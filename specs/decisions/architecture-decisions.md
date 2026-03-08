# Architecture Decision Records

This file captures deterministic ADRs generated from governance source and current derived artifacts.

## ADR-001: Keep a CLI-first deterministic pipeline

### Status
Accepted

### Context
The team needs repeatable governance-to-engineering generation that works in CI and local development without hidden UI state. The current source is `/home/runner/work/Muse/Muse/specs/governance/original-document-system-of-record.digital.md` (652 characters).

### Decision
Use command-driven generation as the source of truth and keep orchestration in CLI commands while business logic remains in pipeline modules.

### Alternatives Considered
1. Web-first workflow with a persistent server and interactive state.
2. Ad-hoc scripts per artifact type.

### Pros
- Deterministic runs and easier CI/CD automation.
- Lower operational complexity than a long-running service.
- Easier debugging through explicit command boundaries.

### Cons
- Less interactive for non-technical users.
- More emphasis on documentation and command discoverability.

### Consequences
- Pipeline behavior must stay stable across environments.
- Command contracts become part of the product surface area.

### Validation Criteria
- `npm run build` passes.
- Core CLI command help and execution paths remain functional.

---

## ADR-002: Keep canonical IDs as filenames for generated artifacts

### Status
Accepted

### Context
Generated artifacts require stable lineage across epics, features, stories, and prompts. Recent samples include epics `epic-001.md`, `epic-002.md`, `epic-003.md` and stories `epic-001-feature-001-story-001.md`, `epic-001-feature-001-story-002.md`, `epic-001-feature-002-story-001.md`.

### Decision
Keep canonical ID-based filenames (for example `epic-001.md`) and store human-friendly names in markdown titles/front matter.

### Alternatives Considered
1. Friendly-title filenames (for example `document-retrieval-api-system.md`).
2. Hybrid filename with ID and title slug.

### Pros
- Stable references even when titles evolve.
- Lower merge churn and fewer broken links.
- Cleaner traceability for automated tooling.

### Cons
- Filenames are less human-readable in directory listings.

### Consequences
- UX should surface title/slug prominently in rendered views.
- Documentation should explain ID conventions clearly.

### Validation Criteria
- Traceability resolution by ID remains intact.
- Renaming titles does not require file renames.

---

## ADR-003: Preserve explicit lineage metadata in artifact front matter

### Status
Accepted

### Context
Development teams and AI agents need reliable context to connect generated outputs back to governance source and parent artifacts. Current generated sets include features `epic-001-feature-001.md`, `epic-001-feature-002.md`, `epic-002-feature-001.md` and prompts `epic-001-feature-001-prompt-001.md`, `epic-001-feature-001-prompt-002.md`, `epic-001-feature-002-prompt-001.md`.

### Decision
Require front matter lineage fields (such as `derived_from_document_id`, `derived_from_epic`, `derived_from_feature`, and `source_path`) across generated artifacts.

### Alternatives Considered
1. Implicit lineage derived only from directory structure.
2. External lineage map file without per-artifact metadata.

### Pros
- Improves explainability for humans and agents.
- Enables automated traceability validation.
- Supports audit and compliance evidence workflows.

### Cons
- Slightly larger file headers and stricter generation requirements.

### Consequences
- Generators and validators must evolve together.
- Breaking schema changes require migration guidance.

### Validation Criteria
- `node scripts/validate-traceability.mjs` passes.
- Each generated story and prompt resolves to its feature/epic lineage.

---

## ADR-004: Prefer deterministic fallback generation when AI is unavailable

### Status
Accepted

### Context
Artifact generation should remain available during model outages, auth failures, or restricted environments.

### Decision
Use deterministic fallback logic for epics/features/stories/prompts when AI generation cannot be used, while preserving ID and lineage conventions.

### Alternatives Considered
1. Fail hard when AI calls fail.
2. Cache-only generation from prior AI outputs.

### Pros
- Better reliability and developer productivity.
- Predictable outputs useful for tests and demos.

### Cons
- Fallback quality can be less nuanced than successful AI output.

### Consequences
- Fallback behavior must be transparent in logs and docs.
- Teams should periodically review fallback output quality.

### Validation Criteria
- Generation completes successfully without an API key.
- Output schema remains valid and traceable.

## Source Context
- Governance source: `/home/runner/work/Muse/Muse/specs/governance/original-document-system-of-record.digital.md`
- Input size: 652 characters
- Artifact counts: capabilities=2, epics=3, features=6, stories=12, prompts=12
