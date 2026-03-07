---
id: epic-004-feature-003-prompt-003
prompt_id: epic-004-feature-003-prompt-003
story: epic-004-feature-003-story-003
feature: epic-004-feature-003
epic: epic-004
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-004-feature-003-prompt-003

## Objective
Implement Expose integrity status in metadata endpoint.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-004-feature-003-story-003 -> epic-004-feature-003 -> epic-004

## Required Changes
1. Implement Expose integrity status in metadata endpoint.
2. Add fields to metadata response: sha256Hash, lastVerifiedAt, integrityValid
3. lastVerifiedAt should be ISO 8601 formatted timestamp
4. Cache verification results for 5 minutes to avoid repeated hash calculations
5. Update verification timestamp only when integrity check is performed

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- GET /documents/{documentId}/metadata includes integrity verification fields
- Response includes stored document hash
- Response includes timestamp of last integrity verification
- Response includes boolean field indicating last verification result
- Metadata endpoint performs integrity check and updates verification timestamp
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Expose integrity status in metadata endpoint.
Context: I want to check document integrity status through the metadata API.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- GET /documents/{documentId}/metadata includes integrity verification fields
- Response includes stored document hash
- Response includes timestamp of last integrity verification
- Response includes boolean field indicating last verification result
- Metadata endpoint performs integrity check and updates verification timestamp
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-004-feature-003-story-003 (Expose integrity status in metadata endpoint).
