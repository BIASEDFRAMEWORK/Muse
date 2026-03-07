---
id: epic-002-feature-001-prompt-002
prompt_id: epic-002-feature-001-prompt-002
story: epic-002-feature-001-story-002
feature: epic-002-feature-001
epic: epic-002
source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/docs/derived/governance/original-document-system-of-record.digital.md
---
# AI Implementation Prompt: epic-002-feature-001-prompt-002

## Objective
Implement Regular user can access authorized documents only.

## Repo Context
- Primary code paths: src/cli/, src/pipeline/, src/config/
- Generated artifacts: docs/derived/epics/, docs/derived/features/, docs/derived/user-stories/, docs/derived/prompts/
- Story linkage: epic-002-feature-001-story-002 -> epic-002-feature-001 -> epic-002

## Required Changes
1. Implement Regular user can access authorized documents only.
2. Implement document-level permission checking in authorization middleware
3. Cache user permissions for performance optimization
4. Return consistent 403 responses for unauthorized access to prevent information disclosure
5. Implementation should prioritize The API exposes read-only access:.

## Constraints
- Preserve traceability metadata and naming conventions for generated artifacts.
- Do not modify files under /contracts without explicit instruction.
- Keep changes scoped to the requested objective and avoid unrelated refactors.
- Use governance source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/docs/derived/governance/original-document-system-of-record.digital.md

## Acceptance Criteria
- Given I am authenticated as a Regular User with access to a document, when I make a GET request to /documents/{documentId}, then I receive the document bytes
- Given I am authenticated as a Regular User with access to a document, when I make a GET request to /documents/{documentId}/metadata, then I receive the document metadata
- Given I am authenticated as a Regular User without access to a document, when I make a GET request to either endpoint, then I receive a 403 Forbidden response
- Given I am not authenticated, when I make a GET request to either endpoint, then I receive a 401 Unauthorized response
- Outcome focus for this story: The API exposes read-only access:.

## Validation
- `npm run build`
- `node scripts/validate-traceability.mjs`

## Deliverable
Return a patch plus a short summary of modified files and validation results.

## Implementation Brief
Implement Regular user can access authorized documents only.
Context: I want to retrieve documents that I have permission to access through the API.
Return production-ready code changes, unit tests, and integration tests with explicit acceptance-criteria mapping.

## Implementation Checklist
- Given I am authenticated as a Regular User with access to a document, when I make a GET request to /documents/{documentId}, then I receive the document bytes
- Given I am authenticated as a Regular User with access to a document, when I make a GET request to /documents/{documentId}/metadata, then I receive the document metadata
- Given I am authenticated as a Regular User without access to a document, when I make a GET request to either endpoint, then I receive a 403 Forbidden response
- Given I am not authenticated, when I make a GET request to either endpoint, then I receive a 401 Unauthorized response
- Outcome focus for this story: The API exposes read-only access:.
- Implementation outcome is unique to epic-002-feature-001-story-002 (Regular user can access authorized documents only).
