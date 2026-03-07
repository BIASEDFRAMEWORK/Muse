---
id: epic-004-feature-003-prompt-002
prompt_id: epic-004-feature-003-prompt-002
story: epic-004-feature-003-story-002
feature: epic-004-feature-003
epic: epic-004
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-004-feature-003-prompt-002

## Objective
Implement Verify document integrity on retrieval.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-004-feature-003-story-002 -> epic-004-feature-003 -> epic-004

## Required Changes
1. Implement Verify document integrity on retrieval.
2. Hash verification should occur before streaming document bytes
3. Include custom header 'X-Integrity-Verified: true' on successful responses
4. Log integrity violations for monitoring and alerting
5. Error response should include fields: storedHash, calculatedHash, documentId

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- System recalculates document hash when serving GET /documents/{documentId}
- Comparison is made between stored hash and calculated hash
- If hashes match, document is served normally with HTTP 200
- If hashes don't match, system returns HTTP 409 with integrity violation error
- Response includes both stored and calculated hashes in error details
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Verify document integrity on retrieval.
Context: I want the system to verify document integrity when I retrieve documents.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- System recalculates document hash when serving GET /documents/{documentId}
- Comparison is made between stored hash and calculated hash
- If hashes match, document is served normally with HTTP 200
- If hashes don't match, system returns HTTP 409 with integrity violation error
- Response includes both stored and calculated hashes in error details
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-004-feature-003-story-002 (Verify document integrity on retrieval).
