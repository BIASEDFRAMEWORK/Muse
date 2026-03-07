# GitHub security hardening

This repository uses GitHub-native security features and CI checks to protect the `main` branch.

## What is configured in code

- Dependabot updates via `.github/dependabot.yml`.
- CI checks in `.github/workflows/ci-lint-test.yml`:
  - `build`
  - `cli-tests`
  - `traceability`
  - `actionlint`
  - `npm-audit`
- Security workflow in `.github/workflows/security.yml`:
  - `dependency-review`
  - `codeql`

## One-time repository settings (admin)

Run the helper script:

```bash
scripts/apply-github-hardening.sh BIASEDFRAMEWORK Muse main
```

The script enables:

- GitHub Advanced Security (GHAS)
- Secret scanning
- Secret scanning push protection
- Branch protection on `main` requiring PR reviews and checks:
  - `build`
  - `cli-tests`
  - `traceability`
  - `codeql`

## Notes

- If `gh` prompts for auth, run `gh auth login` first.
- Admin permissions are required to update repository settings.
