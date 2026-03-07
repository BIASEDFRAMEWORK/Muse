import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { resolveArtifactByIdOrPath } from '../../pipeline/deriveArtifacts'
import { traceArtifact } from '../../pipeline/traceArtifact'

const GENERATED_ARTIFACT_DIRS = ['specs', 'work-items']
const PR_TEMPLATE_PATH = path.resolve('.github/PULL_REQUEST_TEMPLATE.md')

const FALLBACK_TEMPLATE = `# Pull Request

## Summary
{{SUMMARY}}

## MUSE-ID (required)
MUSE-ID: {{MUSE_ID}}

## Objective
{{OBJECTIVE}}

## Traceability
{{TRACEABILITY}}

## Reviewer Guidance
{{REVIEWER_GUIDANCE}}

## Verification
{{VERIFICATION_STEPS}}
`

function existingArtifactDirs(): string[] {
  return GENERATED_ARTIFACT_DIRS.filter((directory) => fs.existsSync(directory))
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

function loadPrTemplate(): string {
  if (fs.existsSync(PR_TEMPLATE_PATH)) {
    return fs.readFileSync(PR_TEMPLATE_PATH, 'utf8')
  }

  return FALLBACK_TEMPLATE
}

function changedFilesInScopes(directories: string[]): string[] {
  if (directories.length === 0) {
    return []
  }

  const output = execSync(`git diff --cached --name-only -- ${directories.join(' ')}`, { encoding: 'utf8' })
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function toRepoRelative(absPath: string): string {
  const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim()
  return path.relative(root, absPath)
}

function inferPromptArtifact(prompt?: string, changedFiles: string[] = []): string | null {
  if (prompt && prompt.trim()) {
    const resolved = resolveArtifactByIdOrPath(prompt.trim())
    return toRepoRelative(resolved.path)
  }

  const changedPrompt = changedFiles.find((file) => /^(work-items\/prompts\/stories)\/.*\.md$/.test(file))
  return changedPrompt || null
}

function renderTemplate(template: string, replacements: Record<string, string>): string {
  let rendered = template
  for (const [key, value] of Object.entries(replacements)) {
    const token = `{{${key}}}`
    rendered = rendered.split(token).join(value)
  }
  return rendered
}

function buildPrBody(promptArtifact: string | null, changedFiles: string[]): string {
  const summary = 'Generated governance-derived artifacts via Muse CLI using canonical specs/work-items layout.'
  const museId = 'N/A'

  let objective =
    'Review generated artifacts for correctness, lineage consistency, and readiness for implementation.'
  let traceability = 'N/A'

  if (promptArtifact) {
    const promptResolved = resolveArtifactByIdOrPath(promptArtifact)
    const promptId = String(promptResolved.data.prompt_id || promptResolved.data.id || path.basename(promptArtifact, '.md'))
    objective = `Validate implementation intent and lineage for ${promptId}.`
    traceability = ['```text', traceArtifact(promptArtifact), '```'].join('\n')
  }

  const changedPreview = changedFiles.slice(0, 10).map((file) => `- ${file}`)
  const changedSection = changedPreview.length
    ? ['Changed files (first 10):', ...changedPreview].join('\n')
    : 'Changed files were staged from specs/ and work-items/.'

  const reviewerGuidance = [
    '- Confirm generated content is aligned with governance scope and does not include out-of-scope physical controls.',
    '- Validate front matter lineage fields (`derived_from_document_id`, `derived_from_epic`, `derived_from_feature`, `source_path`).',
    '- Spot-check acceptance criteria and implementation prompts for actionable, testable detail.',
    changedSection,
  ].join('\n')

  const verificationSteps = [
    '```bash',
    'npm run build',
    'node test/cli-commands.test.cjs',
    'node scripts/validate-traceability.mjs',
    '```',
  ].join('\n')

  const template = loadPrTemplate()
  return renderTemplate(template, {
    SUMMARY: summary,
    MUSE_ID: museId,
    OBJECTIVE: objective,
    TRACEABILITY: traceability,
    REVIEWER_GUIDANCE: reviewerGuidance,
    VERIFICATION_STEPS: verificationSteps,
  })
}

function commandExists(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: 'inherit' })
    return true
  } catch {
    return false
  }
}

function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'inherit' })
    return true
  } catch {
    return false
  }
}

function hasGeneratedArtifactChanges(directories: string[]): boolean {
  if (directories.length === 0) {
    return false
  }

  const scopedDirs = directories.join(' ')
  try {
    execSync(`git diff --quiet -- ${scopedDirs}`, { stdio: 'inherit' })
    execSync(`git diff --cached --quiet -- ${scopedDirs}`, { stdio: 'inherit' })
    return false
  } catch {
    return true
  }
}

function buildBranchName(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `muse/backlog-${year}-${month}-${day}-${hours}${minutes}`
}

export function prCommand(prompt?: string): void {
  if (!commandExists('git')) {
    throw new Error('Git is required to create a pull request.')
  }

  if (!isGitRepository()) {
    throw new Error('Current directory is not a git repository.')
  }

  if (!commandExists('gh')) {
    throw new Error('GitHub CLI (gh) is required to open a pull request.')
  }

  const artifactDirs = existingArtifactDirs()

  if (!hasGeneratedArtifactChanges(artifactDirs)) {
    process.stdout.write('No changes detected in generated artifact directories — nothing to commit.\n')
    return
  }

  const branch = buildBranchName(new Date())

  process.stdout.write(`Creating branch: ${branch}\n`)
  execSync(`git checkout -b ${branch}`, { stdio: 'inherit' })

  process.stdout.write('Staging generated artifacts\n')
  execSync(`git add ${artifactDirs.join(' ')}`, { stdio: 'inherit' })

  const changedFiles = changedFilesInScopes(artifactDirs)
  const promptArtifact = inferPromptArtifact(prompt, changedFiles)

  process.stdout.write('Committing changes\n')
  execSync('git commit -m "Muse: generated governance artifacts"', { stdio: 'inherit' })

  process.stdout.write('Pushing branch to origin\n')
  execSync(`git push origin ${branch}`, { stdio: 'inherit' })

  process.stdout.write('Opening pull request via GitHub CLI\n')
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-pr-'))
  const bodyPath = path.join(tmpDir, 'pr-body.md')

  try {
    const body = buildPrBody(promptArtifact, changedFiles)
    fs.writeFileSync(bodyPath, body, 'utf8')
    execSync(`gh pr create --title "Muse: Governance backlog update" --body-file ${shellQuote(bodyPath)}`, {
      stdio: 'inherit',
    })
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  process.stdout.write('Pull request created successfully.\n')
}
