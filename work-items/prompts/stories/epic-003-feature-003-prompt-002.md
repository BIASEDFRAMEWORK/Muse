---
id: epic-003-feature-003-prompt-002
prompt_id: epic-003-feature-003-prompt-002
story: epic-003-feature-003-story-002
feature: epic-003-feature-003
epic: epic-003
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-003-feature-003-prompt-002

## Objective
Implement Capture user session context during document access.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-003-feature-003-story-002 -> epic-003-feature-003 -> epic-003

## Required Changes
1. Implement Capture user session context during document access.
2. Implement session tracking using secure session tokens
3. Use GeoIP service for location lookup with privacy considerations
4. Store session data with appropriate data retention policies
5. Ensure GDPR compliance for geographic data collection

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- Session ID is captured and associated with document access
- User agent and browser fingerprint are logged
- Geographic location is determined from IP address when possible
- Access duration is tracked from request to response completion
- Referrer information is captured when available
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Capture user session context during document access.
Context: I want to capture comprehensive session context when users access documents.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- Session ID is captured and associated with document access
- User agent and browser fingerprint are logged
- Geographic location is determined from IP address when possible
- Access duration is tracked from request to response completion
- Referrer information is captured when available
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-003-feature-003-story-002 (Capture user session context during document access).
