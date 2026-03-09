'use strict'
/**
 * Tests for src/pipeline/accessControl.ts
 * Story: epic-001-feature-001-story-001
 * Covers: success path, failure (deny) path, and evidence-capture behavior.
 */

const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const { enforceReadOnlyAccess, isReadOnlyOperation, appendAuditEntry } = require('../dist/pipeline/accessControl.js')

// ---------------------------------------------------------------------------
// isReadOnlyOperation unit tests
// ---------------------------------------------------------------------------

test('isReadOnlyOperation: allows GET /documents/{id}', () => {
  assert.equal(isReadOnlyOperation('GET /documents/abc123'), true)
})

test('isReadOnlyOperation: allows GET /documents/{id}/metadata', () => {
  assert.equal(isReadOnlyOperation('GET /documents/abc123/metadata'), true)
})

test('isReadOnlyOperation: allows HEAD /documents/{id}', () => {
  assert.equal(isReadOnlyOperation('HEAD /documents/abc123'), true)
})

test('isReadOnlyOperation: denies POST /documents/{id}', () => {
  assert.equal(isReadOnlyOperation('POST /documents/abc123'), false)
})

test('isReadOnlyOperation: denies PUT /documents/{id}', () => {
  assert.equal(isReadOnlyOperation('PUT /documents/abc123'), false)
})

test('isReadOnlyOperation: denies DELETE /documents/{id}', () => {
  assert.equal(isReadOnlyOperation('DELETE /documents/abc123'), false)
})

test('isReadOnlyOperation: denies PATCH /documents/{id}', () => {
  assert.equal(isReadOnlyOperation('PATCH /documents/abc123'), false)
})

test('isReadOnlyOperation: denies malformed operation string with no space separator', () => {
  assert.equal(isReadOnlyOperation('NOSPACE_NO_PATH'), false)
})

test('isReadOnlyOperation: denies GET /admin path (not a document endpoint)', () => {
  assert.equal(isReadOnlyOperation('GET /admin/settings'), false)
})

// ---------------------------------------------------------------------------
// enforceReadOnlyAccess — success path
// ---------------------------------------------------------------------------

test('enforceReadOnlyAccess: returns allowed=true for GET /documents/{id}', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-access-ctrl-'))
  try {
    const result = enforceReadOnlyAccess('user:alice', 'GET /documents/doc-001', tmpDir)
    assert.equal(result.allowed, true, 'should allow read-only GET')
    assert.equal(result.actor, 'user:alice')
    assert.equal(result.operation, 'GET /documents/doc-001')
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('enforceReadOnlyAccess: returns allowed=true for GET metadata endpoint', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-access-ctrl-'))
  try {
    const result = enforceReadOnlyAccess('svc:pipeline', 'GET /documents/doc-999/metadata', tmpDir)
    assert.equal(result.allowed, true)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// enforceReadOnlyAccess — failure (deny) path
// ---------------------------------------------------------------------------

test('enforceReadOnlyAccess: returns allowed=false for DELETE /documents/{id}', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-access-ctrl-'))
  try {
    const result = enforceReadOnlyAccess('user:bob', 'DELETE /documents/doc-001', tmpDir)
    assert.equal(result.allowed, false, 'should deny non-read-only DELETE')
    assert.ok(result.reason.length > 0, 'should provide a denial reason')
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('enforceReadOnlyAccess: returns allowed=false for POST /documents', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-access-ctrl-'))
  try {
    const result = enforceReadOnlyAccess('user:charlie', 'POST /documents', tmpDir)
    assert.equal(result.allowed, false)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// enforceReadOnlyAccess — evidence-capture behavior
// ---------------------------------------------------------------------------

test('enforceReadOnlyAccess: records timestamped evidence in audit log', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-access-ctrl-'))
  try {
    const before = new Date()
    const result = enforceReadOnlyAccess('user:diana', 'GET /documents/doc-777', tmpDir)
    const after = new Date()

    // Result timestamp is an ISO-8601 string
    assert.ok(result.timestamp, 'result must include a timestamp')
    const ts = new Date(result.timestamp)
    assert.ok(ts >= before && ts <= after, 'timestamp must fall within the call window')

    // Audit log file must exist
    const logPath = path.join(tmpDir, 'access-audit.jsonl')
    assert.ok(fs.existsSync(logPath), 'access-audit.jsonl must be created')

    // Parse the written entry
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n')
    assert.equal(lines.length, 1, 'exactly one audit entry should be written')
    const entry = JSON.parse(lines[0])

    assert.equal(entry.actor, 'user:diana', 'entry must record actor identity')
    assert.equal(entry.operation, 'GET /documents/doc-777', 'entry must record operation')
    assert.ok(entry.timestamp, 'entry must have a timestamp')
    assert.equal(entry.story, 'epic-001-feature-001-story-001', 'entry must carry story traceability')
    assert.equal(entry.allowed, true, 'entry must record the decision')
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('enforceReadOnlyAccess: records denied access attempt in audit log', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-access-ctrl-'))
  try {
    enforceReadOnlyAccess('user:eve', 'PUT /documents/doc-002', tmpDir)

    const logPath = path.join(tmpDir, 'access-audit.jsonl')
    assert.ok(fs.existsSync(logPath), 'audit log must be created for denied requests')
    const entry = JSON.parse(fs.readFileSync(logPath, 'utf8').trim())

    assert.equal(entry.actor, 'user:eve')
    assert.equal(entry.allowed, false, 'denied entry must record allowed=false')
    assert.ok(entry.reason.length > 0, 'denied entry must include a reason')
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

test('enforceReadOnlyAccess: multiple calls append multiple audit entries', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-access-ctrl-'))
  try {
    enforceReadOnlyAccess('user:frank', 'GET /documents/doc-001', tmpDir)
    enforceReadOnlyAccess('user:frank', 'DELETE /documents/doc-001', tmpDir)

    const logPath = path.join(tmpDir, 'access-audit.jsonl')
    const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n')
    assert.equal(lines.length, 2, 'two calls should produce two audit lines')

    const first = JSON.parse(lines[0])
    const second = JSON.parse(lines[1])
    assert.equal(first.allowed, true)
    assert.equal(second.allowed, false)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})

// ---------------------------------------------------------------------------
// appendAuditEntry — direct unit test
// ---------------------------------------------------------------------------

test('appendAuditEntry: writes well-formed JSONL entry to specified directory', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-audit-direct-'))
  try {
    const entry = {
      timestamp: new Date().toISOString(),
      actor: 'svc:test',
      operation: 'GET /documents/x',
      allowed: true,
      reason: 'test reason',
      story: 'epic-001-feature-001-story-001',
    }
    appendAuditEntry(entry, tmpDir)

    const logPath = path.join(tmpDir, 'access-audit.jsonl')
    assert.ok(fs.existsSync(logPath))
    const parsed = JSON.parse(fs.readFileSync(logPath, 'utf8').trim())
    assert.deepEqual(parsed, entry)
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
