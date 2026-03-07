---
id: epic-004-feature-001-prompt-002
prompt_id: epic-004-feature-001-prompt-002
story: epic-004-feature-001-story-002
feature: epic-004-feature-001
epic: epic-004
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-004-feature-001-prompt-002

## Objective
Implement Retrieve document metadata with role-based filtering.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-004-feature-001-story-002 -> epic-004-feature-001 -> epic-004

## Required Changes
1. Implement Retrieve document metadata with role-based filtering.
2. Implement metadata filtering based on user role permissions
3. Cache metadata responses to improve performance
4. Use JSON schema validation for consistent metadata structure
5. Add audit logging for metadata access attempts

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- GET /documents/{documentId}/metadata returns HTTP 200 with metadata JSON when authorized
- GET /documents/{documentId}/metadata returns HTTP 403 when user lacks metadata read permissions
- GET /documents/{documentId}/metadata returns HTTP 404 when document does not exist
- Metadata response excludes sensitive fields based on user role permissions
- Response time is under 200ms for metadata retrieval
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Retrieve document metadata with role-based filtering.
Context: I want to access document metadata through the API.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- GET /documents/{documentId}/metadata returns HTTP 200 with metadata JSON when authorized
- GET /documents/{documentId}/metadata returns HTTP 403 when user lacks metadata read permissions
- GET /documents/{documentId}/metadata returns HTTP 404 when document does not exist
- Metadata response excludes sensitive fields based on user role permissions
- Response time is under 200ms for metadata retrieval
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-004-feature-001-story-002 (Retrieve document metadata with role-based filtering).
