---
id: epic-002-feature-002-prompt-001
prompt_id: epic-002-feature-002-prompt-001
story: epic-002-feature-002-story-001
feature: epic-002-feature-002
epic: epic-002
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-002-feature-002-prompt-001

## Objective
Implement Implement role-based document retrieval authorization.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-002-feature-002-story-001 -> epic-002-feature-002 -> epic-002

## Required Changes
1. Implement Implement role-based document retrieval authorization.
2. Implement middleware to intercept requests before document retrieval
3. Add role validation logic that checks user permissions against document access rules
4. Return appropriate HTTP status codes (401, 403) for authorization failures
5. Ensure authorization check occurs before any document streaming begins

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- GET /documents/{documentId} returns 403 Forbidden when user lacks document read permission
- GET /documents/{documentId} streams document bytes when user has valid read permission
- GET /documents/{documentId}/metadata returns 403 Forbidden when user lacks metadata read permission
- GET /documents/{documentId}/metadata returns metadata JSON when user has valid read permission
- Authorization header is validated on every request
- Invalid or missing authorization returns 401 Unauthorized
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Implement role-based document retrieval authorization.
Context: I want to retrieve documents only if my role has proper authorization.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- GET /documents/{documentId} returns 403 Forbidden when user lacks document read permission
- GET /documents/{documentId} streams document bytes when user has valid read permission
- GET /documents/{documentId}/metadata returns 403 Forbidden when user lacks metadata read permission
- GET /documents/{documentId}/metadata returns metadata JSON when user has valid read permission
- Authorization header is validated on every request
- Invalid or missing authorization returns 401 Unauthorized
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-002-feature-002-story-001 (Implement role-based document retrieval authorization).
