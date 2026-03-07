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
# Regular user can access authorized documents only

## User Story
As a Regular User, I want to I want to retrieve documents that I have permission to access through the API, so that I can so that I can view documents relevant to my role while being prevented from accessing restricted content.

## Acceptance Criteria
- Given I am authenticated as a Regular User with access to a document, when I make a GET request to /documents/{documentId}, then I receive the document bytes
- Given I am authenticated as a Regular User with access to a document, when I make a GET request to /documents/{documentId}/metadata, then I receive the document metadata
- Given I am authenticated as a Regular User without access to a document, when I make a GET request to either endpoint, then I receive a 403 Forbidden response
- Given I am not authenticated, when I make a GET request to either endpoint, then I receive a 401 Unauthorized response
- Outcome focus for this story: The API exposes read-only access:.

## Technical Notes
- Implement document-level permission checking in authorization middleware
- Cache user permissions for performance optimization
- Return consistent 403 responses for unauthorized access to prevent information disclosure
- Implementation should prioritize The API exposes read-only access:.
