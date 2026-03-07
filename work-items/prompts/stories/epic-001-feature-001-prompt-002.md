---
id: epic-001-feature-001-prompt-002
prompt_id: epic-001-feature-001-prompt-002
story: epic-001-feature-001-story-002
feature: epic-001-feature-001
epic: epic-001
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-001-feature-001-prompt-002

## Objective
Implement Retrieve document metadata without content.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-001-feature-001-story-002 -> epic-001-feature-001 -> epic-001

## Required Changes
1. Implement Retrieve document metadata without content.
2. Return JSON structure with consistent field names
3. Include content-disposition filename if available
4. Add last-modified timestamp for caching
5. Implement database index on documentId for fast lookups

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- GET /documents/{documentId}/metadata returns HTTP 200 with JSON metadata
- Response includes file size, content type, upload timestamp, and checksum
- Response excludes the actual document bytes
- Invalid documentId returns HTTP 404 with error message
- Malformed documentId returns HTTP 400 with validation error
- Response time is under 200ms for metadata lookup
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Retrieve document metadata without content.
Context: request metadata about a document without downloading the actual content.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- GET /documents/{documentId}/metadata returns HTTP 200 with JSON metadata
- Response includes file size, content type, upload timestamp, and checksum
- Response excludes the actual document bytes
- Invalid documentId returns HTTP 404 with error message
- Malformed documentId returns HTTP 400 with validation error
- Response time is under 200ms for metadata lookup
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-001-feature-001-story-002 (Retrieve document metadata without content).
