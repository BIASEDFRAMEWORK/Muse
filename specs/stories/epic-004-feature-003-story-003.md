---
id: epic-004-feature-003-story-003
story_id: epic-004-feature-003-story-003
epic: epic-004
feature: epic-004-feature-003
derived_from_epic: epic-004
derived_from_feature: epic-004-feature-003
source: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md
source_path: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md
derived_from_document_id: gov-original-document-system-of-record
origin_markdown_path: /Users/dustingaspard/Documents/Excella/Workspace/Muse/specs/governance/original-document-system-of-record.digital.md
---
# Expose integrity status in metadata endpoint

## User Story
As a Compliance Officer, I want to I want to check document integrity status through the metadata API, so that I can so that I can audit document integrity without downloading full document content.

## Acceptance Criteria
- GET /documents/{documentId}/metadata includes integrity verification fields
- Response includes stored document hash
- Response includes timestamp of last integrity verification
- Response includes boolean field indicating last verification result
- Metadata endpoint performs integrity check and updates verification timestamp
- Outcome focus for this story: The API exposes read-only access:.

## Technical Notes
- Add fields to metadata response: sha256Hash, lastVerifiedAt, integrityValid
- lastVerifiedAt should be ISO 8601 formatted timestamp
- Cache verification results for 5 minutes to avoid repeated hash calculations
- Update verification timestamp only when integrity check is performed
- Implementation should prioritize The API exposes read-only access:.
