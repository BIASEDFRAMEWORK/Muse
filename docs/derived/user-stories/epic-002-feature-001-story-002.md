---
id: epic-002-feature-001-story-002
story_id: epic-002-feature-001-story-002
epic: epic-002
feature: epic-002-feature-001
derived_from_epic: epic-002
derived_from_feature: epic-002-feature-001
source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/docs/derived/governance/original-document-system-of-record.digital.md
source_path: /Users/dustingaspard/Documents/Excella/Workspace/Muse/docs/derived/governance/original-document-system-of-record.digital.md
derived_from_document_id: gov-original-document-system-of-record
origin_markdown_path: /Users/dustingaspard/Documents/Excella/Workspace/Muse/docs/derived/governance/original-document-system-of-record.digital.md
---
# As an authenticated user, I want to retrieve document metadata based on my role permissions

## User Story
As a authenticated user, I want to I can access document metadata through the GET /documents/{documentId}/metadata endpoint only if my role has read permissions for that document, so that I can I can view document properties and metadata for authorized documents without downloading the full content.

## Acceptance Criteria
- GET /documents/{documentId}/metadata returns 200 with metadata JSON when user role has read permission
- GET /documents/{documentId}/metadata returns 403 when user role lacks read permission
- GET /documents/{documentId}/metadata returns 401 when user is not authenticated
- Metadata response includes document properties like size, type, upload date, and custom metadata
- Response format is consistent JSON structure
- Outcome focus for this story: The API exposes read-only access:.

## Technical Notes
- Reuse same role-based authorization middleware as document content endpoint
- Metadata should be retrieved from database without accessing the actual document file
- Consider what metadata fields should be included in response schema
- Ensure metadata endpoint has lower latency than full document retrieval
- Implementation should prioritize The API exposes read-only access:.
