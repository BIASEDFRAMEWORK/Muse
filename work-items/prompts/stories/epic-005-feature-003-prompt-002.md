---
id: epic-005-feature-003-prompt-002
prompt_id: epic-005-feature-003-prompt-002
story: epic-005-feature-003-story-002
feature: epic-005-feature-003
epic: epic-005
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-005-feature-003-prompt-002

## Objective
Implement Block unauthorized IP addresses from document endpoints.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-005-feature-003-story-002 -> epic-005-feature-003 -> epic-005

## Required Changes
1. Implement Block unauthorized IP addresses from document endpoints.
2. Implement IP validation as early middleware in request pipeline
3. Return consistent error response format matching existing API standards
4. Avoid exposing allowlist configuration or internal IP details in responses
5. Ensure IP validation occurs before any business logic processing

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- Requests from non-allowlisted IPs return HTTP 403 Forbidden status
- Response includes generic error message without revealing allowlist details
- Both GET /documents/{documentId} and GET /documents/{documentId}/metadata endpoints enforce IP restrictions
- Response headers do not leak internal system information
- Blocked requests are not processed beyond IP validation
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Block unauthorized IP addresses from document endpoints.
Context: receive appropriate HTTP responses when accessing document endpoints from non-allowlisted IP addresses.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- Requests from non-allowlisted IPs return HTTP 403 Forbidden status
- Response includes generic error message without revealing allowlist details
- Both GET /documents/{documentId} and GET /documents/{documentId}/metadata endpoints enforce IP restrictions
- Response headers do not leak internal system information
- Blocked requests are not processed beyond IP validation
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-005-feature-003-story-002 (Block unauthorized IP addresses from document endpoints).
