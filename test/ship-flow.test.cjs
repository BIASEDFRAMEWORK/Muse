const test = require('node:test')
const assert = require('node:assert/strict')

const { completeTaskInMarkdown } = require('../dist/pipeline/taskCompletion.js')
const { normalizeMuseCommitMessage } = require('../dist/pipeline/prFlow.js')

test('completeTaskInMarkdown marks matching task as complete deterministically', () => {
  const input = [
    '# Prioritized TODO Backlog',
    '',
    '## P0',
    '- [ ] MUSE-001: First task',
    '- [ ] MUSE-002: Second task',
    '',
  ].join('\n')

  const result = completeTaskInMarkdown(input, 'MUSE-001')

  assert.equal(result.changed, true)
  assert.equal(result.alreadyComplete, false)
  assert.match(result.updated, /- \[x\] MUSE-001: First task/)
  assert.match(result.updated, /- \[ \] MUSE-002: Second task/)
})

test('completeTaskInMarkdown is idempotent for completed task', () => {
  const input = [
    '# Prioritized TODO Backlog',
    '',
    '## P0',
    '- [x] MUSE-010: Done task',
    '',
  ].join('\n')

  const result = completeTaskInMarkdown(input, 'MUSE-010')

  assert.equal(result.changed, false)
  assert.equal(result.alreadyComplete, true)
  assert.equal(result.updated, input)
})

test('normalizeMuseCommitMessage enforces MUSE-ID prefix format', () => {
  const message = normalizeMuseCommitMessage('MUSE-123', 'implement ship flow')
  assert.equal(message, 'MUSE-123: implement ship flow')
})
