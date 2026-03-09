/**
 * Access Control and Authorization — Authorization enforcement — implementation path
 * Story: epic-001-feature-001-story-001
 * Feature: epic-001-feature-001 (Access Control and Authorization — Authorization enforcement)
 * Epic: epic-001 (Access Control and Authorization)
 * Governance source: specs/governance/original-document-system-of-record.digital.md
 *
 * Enforces least-privilege read-only access for the document API as required by governance.
 * Records timestamped audit evidence with actor identity attribution for compliance.
 */

import fs from 'fs'
import path from 'path'

/** Story traceability identifier — links every audit entry back to the originating story. */
const STORY_ID = 'epic-001-feature-001-story-001'

/** HTTP methods that the governance policy permits (read-only API surface). */
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

/** Route prefixes that constitute the read-only document API. */
const ALLOWED_ROUTE_PREFIXES = ['/documents/']

export interface AccessControlResult {
  /** Whether the requested operation is permitted. */
  allowed: boolean
  /** The actor (user, service, or system identity) making the request. */
  actor: string
  /** The operation string in "<METHOD> <path>" format. */
  operation: string
  /** ISO-8601 timestamp captured at enforcement time. */
  timestamp: string
  /** Human-readable reason for the decision. */
  reason: string
}

export interface AuditEntry {
  timestamp: string
  actor: string
  operation: string
  allowed: boolean
  reason: string
  story: string
}

/**
 * Appends a structured JSON audit entry to the access audit log.
 * The log directory is created with mode 0o700 to restrict access.
 *
 * @param entry - Audit record to persist.
 * @param logDir - Directory for the audit log (default: logs/).
 */
export function appendAuditEntry(entry: AuditEntry, logDir?: string): void {
  const resolvedLogDir = path.resolve(logDir ?? 'logs')
  fs.mkdirSync(resolvedLogDir, { recursive: true, mode: 0o700 })

  const logPath = path.join(resolvedLogDir, 'access-audit.jsonl')
  fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, { encoding: 'utf8', mode: 0o600 })
}

/**
 * Determines whether an operation is permitted under the read-only access policy.
 *
 * The governance document specifies that the API exposes only read-only access:
 *   GET /documents/{documentId}
 *   GET /documents/{documentId}/metadata
 * No delete or update endpoints are provided.
 *
 * @param operation - The operation string in "<METHOD> <path>" format,
 *                    e.g. "GET /documents/abc123/metadata".
 * @returns true when the operation matches the allowed read-only policy.
 */
export function isReadOnlyOperation(operation: string): boolean {
  const trimmed = operation.trim()
  const spaceIndex = trimmed.indexOf(' ')
  if (spaceIndex === -1) {
    return false
  }

  const method = trimmed.slice(0, spaceIndex).toUpperCase()
  const routePath = trimmed.slice(spaceIndex + 1).trim()

  if (!ALLOWED_METHODS.has(method)) {
    return false
  }

  return ALLOWED_ROUTE_PREFIXES.some((prefix) => routePath.startsWith(prefix))
}

/**
 * Enforces read-only access control and emits a structured audit event.
 *
 * Acceptance criteria mapped:
 *   - Records timestamped evidence with actor identity attribution (timestamp + actor fields).
 *   - Audit and security events are written to access-controlled logging (logs/access-audit.jsonl, mode 0600).
 *   - Returns an AccessControlResult covering both the allow and deny outcomes.
 *
 * @param actor - Identity of the requesting actor (e.g. "service-account:pipeline").
 * @param operation - Operation string in "<METHOD> <path>" format.
 * @param logDir - Optional override for the log directory path (useful in tests).
 * @returns AccessControlResult with the authorization decision and audit metadata.
 */
export function enforceReadOnlyAccess(actor: string, operation: string, logDir?: string): AccessControlResult {
  const timestamp = new Date().toISOString()
  const allowed = isReadOnlyOperation(operation)
  const reason = allowed
    ? 'Read-only operation permitted by governance policy.'
    : 'Operation not permitted: governance policy restricts access to read-only document endpoints.'

  const result: AccessControlResult = { allowed, actor, operation, timestamp, reason }

  const entry: AuditEntry = {
    timestamp,
    actor,
    operation,
    allowed,
    reason,
    story: STORY_ID,
  }

  appendAuditEntry(entry, logDir)

  return result
}
