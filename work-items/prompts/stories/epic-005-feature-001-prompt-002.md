---
id: epic-005-feature-001-prompt-002
prompt_id: epic-005-feature-001-prompt-002
story: epic-005-feature-001-story-002
feature: epic-005-feature-001
epic: epic-005
source: specs/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-005-feature-001-prompt-002

## Objective
Implement Rate limiting per authenticated user.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: specs/epics/, specs/capabilities/, specs/stories/, work-items/prompts/stories/
- Story linkage: epic-005-feature-001-story-002 -> epic-005-feature-001 -> epic-005

## Required Changes
1. Implement Rate limiting per authenticated user.
2. Use sliding window or token bucket algorithm for rate limiting
3. Store rate limit counters in Redis or in-memory cache
4. Extract user ID from JWT sub claim for rate limit key
5. Configure rate limits via environment variables or config file

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- Rate limit is applied per user ID extracted from JWT token
- Requests exceeding rate limit return 429 Too Many Requests
- Rate limit headers are included in all responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Rate limit counters reset after configured time window
- Different rate limits can be configured for different user roles
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Rate limiting per authenticated user.
Context: I want to enforce rate limits based on authenticated user identity.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- Rate limit is applied per user ID extracted from JWT token
- Requests exceeding rate limit return 429 Too Many Requests
- Rate limit headers are included in all responses (X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset)
- Rate limit counters reset after configured time window
- Different rate limits can be configured for different user roles
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-005-feature-001-story-002 (Rate limiting per authenticated user).
