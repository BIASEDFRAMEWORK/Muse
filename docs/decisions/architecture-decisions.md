# Architecture and Product Decisions

## Architecture Decisions
- Use a CLI-first workflow for deterministic artifact generation.
- Keep business logic in pipeline modules, separate from command handlers.

## Security Decisions
- Keep governance source references in all generated artifacts.
- Ensure traceability metadata remains explicit in front matter.

## Product Decisions
- Generate epics, features, stories, and prompts from governance markdown.
- Prioritize explainability and review-ready markdown output.

## Integration Decisions
- Use Microsoft MarkItDown for document-to-markdown conversion.
- Use a declarative muse.yaml pipeline for repeatable execution.

## Source Context
- /home/runner/work/Muse/Muse/docs/derived/governance/original-document-system-of-record.digital.md
- Input size: 501 characters
