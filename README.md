# Muse (CLI-first)

Muse is a CLI pipeline that converts governance documents into engineering artifacts.

## What it does

1. Converts governance documents to markdown
2. Derives epics, features, user stories, and AI prompts
3. Generates architecture/product decision documents
4. Builds a prioritized TODO backlog
5. Supports explainability and traceability from CLI

## Install

```bash
npm install
npm run build
```

Microsoft MarkItDown is required for document conversion:

```bash
python3 -m pip install markitdown
```

## CLI commands

```bash
muse init
muse apply
muse apply --fast
muse apply --demo
muse convertMD <file>
muse deriveArtifacts <markdown>
muse deriveArtifacts <markdown> --fast
muse decisions <markdown>
muse todo <markdown>
muse run <file>
muse explain <artifact>
muse trace <artifact>
muse commit [--pr]
muse pr [prompt]
muse filter-digital-content <markdown>
```

## Command reference

| Command | Purpose | Key options / args |
|---|---|---|
| `muse init` | Create `muse.yaml` scaffold | none |
| `muse apply` | Execute declarative pipeline from `muse.yaml` | `--fast`, `--demo` |
| `muse convertMD <file>` | Convert source document into markdown under `specs/governance/` | `<file>` |
| `muse deriveArtifacts <markdown>` | Generate capabilities, epics, features, stories, prompts | `<markdown>`, `--fast` |
| `muse decisions <markdown>` | Generate architecture/product decision document | `<markdown>` |
| `muse todo <markdown>` | Generate prioritized TODO backlog from artifacts | `<markdown>` |
| `muse run <file>` | Run convert + derive + decisions + todo in one command | `<file>` |
| `muse explain <artifact>` | Explain purpose/origin/guidance/security implications of an artifact | `<artifact>` |
| `muse trace <artifact>` | Show lineage from artifact back to source governance | `<artifact>` |
| `muse commit` | Stage docs and generated artifacts and create commit | `--pr` |
| `muse pr [prompt]` | Create branch, commit artifacts, and open template-driven PR | optional `[prompt]` |
| `muse filter-digital-content <markdown>` | Keep only digital-system requirements from governance markdown | `<markdown>` |

## Declarative config

Create `muse.yaml` with:

```yaml
project: system-access-logging

governance:
  source: docs/governance/policy.pdf

pipeline:
  convert_markdown: true
  derive_artifacts: true
  decisions: true
  todo: true

ai:
  provider: anthropic
  model: claude-sonnet-4-20250514
```

## Generated outputs

- `specs/governance/`
- `specs/capabilities/`
- `specs/epics/`
- `specs/features/`
- `specs/stories/`
- `specs/decisions/`
- `work-items/prompts/stories/`
- `work-items/tasks/`

## Notes

- Keep business logic in `src/pipeline/` and keep CLI parsing in `src/cli/`.
- Do not modify files in `docs/organizational-contracts/` unless explicitly requested.
