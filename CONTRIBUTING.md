# Contributing to Muse

Thank you for contributing!

This file summarizes project expectations and the minimal workflow we
expect contributors to follow.

## Project constraints (apply to humans & AI agents)

- **Do NOT modify files under `/contracts`** without explicit instruction.
- **Do NOT modify tests to make failures pass.** Fix the code or add tests
  that reflect intended behavior.
- **Prefer explicit, readable code** over clever abstractions.
- **Add TODO comments** instead of guessing behavior or business rules (for
  example: `// TODO: implement X when spec provided`).
- **Assume regulated environments:** keep checks explicit, logs clear, and
  changes auditable.

> If in doubt about behavior or requirements, open an issue rather than guessing.

## Getting started (local dev)

- Copy `.env.example` → `.env` and adjust as needed.
- Install dependencies: `npm install`
- Build CLI: `npm run build`
- Initialize config: `npm run muse:init`
- Run full pipeline: `node dist/cli/index.js apply`
- Run single-prompt ship flow: `node dist/cli/index.js ship <promptPath> --muse-id <MUSE-ID>`
- Validate traceability: `npm run traceability:check`

`muse run` is removed; use `muse prompt execute`, `muse prompt verify`, `muse task complete`, and `muse ship`.

## Making changes / PR checklist

- Keep PRs small and focused.
- **Commit message format:** Start every commit with `MUSE-XXX:` (e.g., `MUSE-001: add new feature`). Use `N/A:` if no MUSE story applies.
  - This is enforced by CI/CD guardrails and required for PR approval.
  - Example: `MUSE-005: resolve TypeScript compilation errors from GitHub Actions`
- Include a short description and manual verification steps (endpoints to
  call, env vars to set).
- Run `npm run build` and `npm run traceability:check` before opening a PR;
  fix any failing checks.
- Add tests for new behavior where appropriate; do not change existing
  tests to force them to pass.
- Use `// TODO:` comments for behavior that cannot be implemented yet and
  reference an issue if possible.
- Document behavior changes in `docs/` or the relevant `src/` module.

## Contact

- If you're unsure, open an issue describing the change and a suggested
  implementation.

Thank you — your clear, auditable contributions help keep this prototype
maintainable and safe for future regulated use.
