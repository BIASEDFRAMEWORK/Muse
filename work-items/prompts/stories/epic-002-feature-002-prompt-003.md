---
id: epic-002-feature-002-prompt-003
prompt_id: epic-002-feature-002-prompt-003
story: epic-002-feature-002-story-003
feature: epic-002-feature-002
epic: epic-002
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-002-feature-002-prompt-003

## Objective
Implement Validate user roles for document API access.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-002-feature-002-story-003 -> epic-002-feature-002 -> epic-002

## Required Changes
1. Implement Validate user roles for document API access.
2. Implement JWT token parsing to extract role claims
3. Create role hierarchy validation logic
4. Add token expiration checking
5. Support multiple role claims in single token

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- User JWT token contains role claims that are extracted and validated
- Role validation occurs before any document operation
- Multiple roles per user are supported
- Role hierarchy is respected (e.g., admin > manager > user)
- Expired or invalid tokens result in 401 Unauthorized response
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Validate user roles for document API access.
Context: I want my role to be validated against document permissions.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- User JWT token contains role claims that are extracted and validated
- Role validation occurs before any document operation
- Multiple roles per user are supported
- Role hierarchy is respected (e.g., admin > manager > user)
- Expired or invalid tokens result in 401 Unauthorized response
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-002-feature-002-story-003 (Validate user roles for document API access).
