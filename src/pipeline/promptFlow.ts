import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { loadConfig } from '../config/loadConfig'
import { LlmClient } from '../ai/llmClient'
import { resolveArtifactByIdOrPath } from './deriveArtifacts'
import { traceArtifact } from './traceArtifact'

const PROMPT_ROOT = path.resolve('work-items/prompts')
const EXECUTION_DIR = path.resolve('work-items/prompts/executions')

export interface ResolvedPrompt {
  absPath: string
  repoRelativePath: string
  id: string
  title: string
  storyId: string | null
  content: string
  frontMatter: Record<string, unknown>
}

export interface ExecutePromptOptions {
  promptPath: string
  museId?: string
}

export interface VerifyPromptOptions {
  promptPath: string
  museId?: string
}

export interface PromptExecutionResult {
  outputPath: string
  prompt: ResolvedPrompt
  usedFallback: boolean
}

function toRepoRelative(absPath: string): string {
  return path.relative(process.cwd(), absPath)
}

function ensurePromptIsInScope(absPath: string): void {
  const normalized = path.normalize(absPath)
  const rootWithSep = `${PROMPT_ROOT}${path.sep}`
  if (normalized !== PROMPT_ROOT && !normalized.startsWith(rootWithSep)) {
    throw new Error('Prompt must be located under work-items/prompts/.')
  }
}

function parseAcceptanceCriteriaFromStory(storyContent: string): string[] {
  const lines = storyContent.split(/\r?\n/)
  const start = lines.findIndex((line) => /^##\s+Acceptance Criteria\s*$/i.test(line.trim()))
  if (start < 0) {
    return []
  }

  const criteria: string[] = []
  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^##\s+/.test(line.trim())) {
      break
    }
    const match = line.match(/^\s*-\s+(.*)$/)
    if (match && match[1].trim()) {
      criteria.push(match[1].trim())
    }
  }

  return criteria
}

function parseValidationCommands(promptContent: string): string[] {
  const lines = promptContent.split(/\r?\n/)
  const start = lines.findIndex((line) => /^##\s+Validation\s*$/i.test(line.trim()))
  if (start < 0) {
    return []
  }

  const commands: string[] = []
  let inFence = false
  for (let index = start + 1; index < lines.length; index += 1) {
    const rawLine = lines[index]
    const line = rawLine.trim()
    if (!inFence && /^##\s+/.test(line)) {
      break
    }

    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }

    if (!inFence) {
      const inline = line.match(/^[-*]\s+`(.+)`$/)
      if (inline && inline[1].trim()) {
        commands.push(inline[1].trim())
      }
      continue
    }

    if (line.length > 0) {
      commands.push(line)
    }
  }

  return commands
}

function changedImplementationFiles(): string[] {
  const result = spawnSync('git', ['status', '--porcelain', '--', 'src', 'test'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    return []
  }

  return result.stdout
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.slice(3).trim())
}

export function resolvePrompt(promptPath: string): ResolvedPrompt {
  const resolved = resolveArtifactByIdOrPath(promptPath)
  const absPath = path.resolve(resolved.path)
  ensurePromptIsInScope(absPath)

  const promptId = String(
    (resolved.data.prompt_id as string | undefined) ||
      (resolved.data.id as string | undefined) ||
      path.parse(absPath).name,
  )
  const storyId = typeof resolved.data.story === 'string' ? resolved.data.story : null
  const titleLine = resolved.content
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith('# '))

  return {
    absPath,
    repoRelativePath: toRepoRelative(absPath),
    id: promptId,
    title: titleLine ? titleLine.replace(/^#\s+/, '').trim() : promptId,
    storyId,
    content: resolved.content,
    frontMatter: resolved.data,
  }
}

export function inferMuseIdFromPrompt(promptPath: string): string | null {
  const prompt = resolvePrompt(promptPath)
  const fromFrontMatter = prompt.frontMatter.muse_id
  if (typeof fromFrontMatter === 'string' && fromFrontMatter.trim().length > 0) {
    return fromFrontMatter.trim()
  }

  const fromStory = prompt.storyId
  if (fromStory && fromStory.trim().length > 0) {
    return fromStory.trim()
  }

  return null
}

export async function executePrompt(options: ExecutePromptOptions): Promise<PromptExecutionResult> {
  const prompt = resolvePrompt(options.promptPath)
  const config = loadConfig('muse.yaml')
  const llm = new LlmClient(config.ai)
  const museId = options.museId || inferMuseIdFromPrompt(options.promptPath) || 'N/A'

  const fallbackResponse = [
    'Deterministic fallback execution: no AI client configured for prompt execution.',
    `Prompt: ${prompt.id}`,
    'Action: Maintainer should implement code changes directly and rerun verification.',
  ].join('\n')

  const response = await llm.generateText(
    [
      'You are assisting with a single implementation prompt execution.',
      'Return concise implementation guidance, planned file changes, and validation hints.',
      '',
      `Prompt ID: ${prompt.id}`,
      `MUSE-ID: ${museId}`,
      '',
      prompt.content,
    ].join('\n'),
    fallbackResponse,
    { label: `prompt-execute:${prompt.id}`, maxTokens: 2200 },
  )

  const usedFallback = response === fallbackResponse

  fs.mkdirSync(EXECUTION_DIR, { recursive: true })
  const outputPath = path.join(EXECUTION_DIR, `${prompt.id}.execution.md`)
  const trace = traceArtifact(prompt.absPath)
  const lines = [
    '---',
    `prompt_id: ${prompt.id}`,
    `muse_id: ${museId}`,
    `prompt_path: ${prompt.repoRelativePath}`,
    `story: ${prompt.storyId || 'N/A'}`,
    `used_fallback: ${String(usedFallback)}`,
    '---',
    '',
    '# Prompt Execution Artifact',
    '',
    '## Traceability',
    '```text',
    trace,
    '```',
    '',
    '## Execution Output',
    '',
    response.trim(),
    '',
  ]
  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8')

  return {
    outputPath,
    prompt,
    usedFallback,
  }
}

function runVerificationCommand(command: string): void {
  const result = spawnSync(command, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: true,
  })
  if (result.status !== 0) {
    throw new Error(`Verification command failed: ${command}`)
  }
}

export function verifyPrompt(options: VerifyPromptOptions): { verificationPath: string; checksRun: string[] } {
  const prompt = resolvePrompt(options.promptPath)
  const museId = options.museId || inferMuseIdFromPrompt(options.promptPath) || 'N/A'
  const story = prompt.storyId ? resolveArtifactByIdOrPath(prompt.storyId) : null
  const acceptanceCriteria = story ? parseAcceptanceCriteriaFromStory(story.content) : []

  if (acceptanceCriteria.length === 0) {
    throw new Error(`No acceptance criteria found for prompt ${prompt.id}.`)
  }

  const implementationChanges = changedImplementationFiles()
  if (implementationChanges.length === 0) {
    throw new Error('No implementation changes detected in src/ or test/.')
  }

  const configuredChecks = parseValidationCommands(prompt.content)
  const checksToRun = configuredChecks.length > 0 ? configuredChecks : ['npm run build', 'npm test']

  for (const command of checksToRun) {
    runVerificationCommand(command)
  }

  fs.mkdirSync(EXECUTION_DIR, { recursive: true })
  const verificationPath = path.join(EXECUTION_DIR, `${prompt.id}.verification.md`)
  const lines = [
    '---',
    `prompt_id: ${prompt.id}`,
    `muse_id: ${museId}`,
    `prompt_path: ${prompt.repoRelativePath}`,
    `story: ${prompt.storyId || 'N/A'}`,
    '---',
    '',
    '# Prompt Verification Artifact',
    '',
    '## Acceptance Criteria',
    ...acceptanceCriteria.map((criterion) => `- [x] ${criterion}`),
    '',
    '## Verification Checks',
    ...checksToRun.map((command) => `- [x] ${command}`),
    '',
    '## Implementation Changes (src/test scope)',
    ...implementationChanges.map((file) => `- ${file}`),
    '',
  ]
  fs.writeFileSync(verificationPath, lines.join('\n'), 'utf8')

  return {
    verificationPath,
    checksRun: checksToRun,
  }
}

export function parseTodoLineMuseId(line: string): string | null {
  const match = line.match(/^\s*-\s+\[(?: |x)\]\s+([^:]+):\s+/i)
  if (!match) {
    return null
  }
  return match[1].trim()
}

export function readPromptFrontMatter(promptPath: string): Record<string, unknown> {
  const prompt = resolvePrompt(promptPath)
  const raw = fs.readFileSync(prompt.absPath, 'utf8')
  return matter(raw).data as Record<string, unknown>
}