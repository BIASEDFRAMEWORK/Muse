import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { inferMuseIdFromPrompt, resolvePrompt } from './promptFlow'
import { traceArtifact } from './traceArtifact'

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

export interface CreatePrOptions {
  promptPath?: string
  museId?: string
  base?: string
  title?: string
  commitMessage?: string
  createBranch?: boolean
  branchName?: string
  autoMerge?: boolean
  deleteBranchOnMerge?: boolean
}

export interface CreatePrResult {
  branch: string
  museId: string
  changedFiles: string[]
}

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

function renderTemplate(template: string, replacements: Record<string, string>): string {
  let rendered = template
  for (const [key, value] of Object.entries(replacements)) {
    const token = `{{${key}}}`
    rendered = rendered.split(token).join(value)
  }
  return rendered
}

function commandExists(command: string): boolean {
  try {
    execSync(`command -v ${command}`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function isGitRepository(): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' })
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
    execSync(`git diff --quiet -- ${scopedDirs}`, { stdio: 'ignore' })
    execSync(`git diff --cached --quiet -- ${scopedDirs}`, { stdio: 'ignore' })
    return false
  } catch {
    return true
  }
}

function sanitizeForBranch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'change'
}

function buildBranchName(museId: string): string {
  return `muse/${sanitizeForBranch(museId)}`
}

function resolveMuseId(promptPath?: string, museId?: string): string {
  if (museId && museId.trim().length > 0) {
    return museId.trim()
  }

  if (!promptPath) {
    throw new Error('MUSE-ID is required. Provide --muse-id or pass a prompt path with inferable metadata.')
  }

  const inferred = inferMuseIdFromPrompt(promptPath)
  if (!inferred) {
    throw new Error('Unable to infer MUSE-ID from prompt metadata. Provide --muse-id explicitly.')
  }
  return inferred
}

function buildPrBody(promptPath: string | undefined, museId: string, changedFiles: string[]): string {
  const summary = `Generated implementation artifacts for ${museId} via Muse CLI ship flow.`

  let objective = `Review and merge implementation updates for ${museId}.`
  let traceability = 'N/A'

  if (promptPath) {
    const prompt = resolvePrompt(promptPath)
    objective = `Validate implementation intent and lineage for ${prompt.id}.`
    traceability = ['```text', traceArtifact(prompt.absPath), '```'].join('\n')
  }

  const changedPreview = changedFiles.slice(0, 12).map((file) => `- ${file}`)
  const reviewerGuidance = [
    '- Confirm code and tests align with story acceptance criteria.',
    '- Confirm traceability metadata remains intact in generated artifacts.',
    changedPreview.length > 0 ? 'Changed files (first 12):' : 'Changed files were staged from specs/ and work-items/.',
    ...changedPreview,
  ].join('\n')

  const verificationSteps = ['```bash', 'npm run build', 'npm test', '```'].join('\n')

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

export function createPullRequest(options: CreatePrOptions = {}): CreatePrResult {
  if (!commandExists('git')) {
    throw new Error('Git is required to create a pull request.')
  }

  if (!isGitRepository()) {
    throw new Error('Current directory is not a git repository.')
  }

  if (!commandExists('gh')) {
    throw new Error('GitHub CLI (gh) is required to open a pull request.')
  }

  const museId = resolveMuseId(options.promptPath, options.museId)
  const artifactDirs = existingArtifactDirs()

  if (!hasGeneratedArtifactChanges(artifactDirs)) {
    throw new Error('No changes detected in generated artifact directories — nothing to commit.')
  }

  const branch = options.branchName || buildBranchName(museId)

  if (options.createBranch !== false) {
    execSync(`git checkout -b ${branch}`, { stdio: 'inherit' })
  }

  execSync(`git add ${artifactDirs.join(' ')}`, { stdio: 'inherit' })
  const changedFiles = changedFilesInScopes(artifactDirs)

  const commitMessage = options.commitMessage || `${museId}: ship prompt implementation artifacts`
  if (!commitMessage.startsWith(`${museId}:`)) {
    throw new Error(`Commit message must start with "${museId}:"`)
  }
  execSync(`git commit -m ${shellQuote(commitMessage)}`, { stdio: 'inherit' })

  execSync(`git push origin ${branch}`, { stdio: 'inherit' })

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'muse-pr-'))
  const bodyPath = path.join(tmpDir, 'pr-body.md')
  const title = options.title || `${museId}: Muse ship flow update`

  try {
    const body = buildPrBody(options.promptPath, museId, changedFiles)
    fs.writeFileSync(bodyPath, body, 'utf8')
    const base = options.base || 'main'
    execSync(
      `gh pr create --base ${shellQuote(base)} --title ${shellQuote(title)} --body-file ${shellQuote(bodyPath)}`,
      {
        stdio: 'inherit',
      },
    )

    if (options.autoMerge || options.deleteBranchOnMerge) {
      const mergeArgs = ['pr', 'merge', '--auto']
      if (options.deleteBranchOnMerge) {
        mergeArgs.push('--delete-branch')
      }
      execSync(`gh ${mergeArgs.join(' ')}`, { stdio: 'inherit' })
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  return {
    branch,
    museId,
    changedFiles,
  }
}

export function normalizeMuseCommitMessage(museId: string, summary: string): string {
  const trimmedId = museId.trim()
  const trimmedSummary = summary.trim() || 'update'
  return `${trimmedId}: ${trimmedSummary}`
}