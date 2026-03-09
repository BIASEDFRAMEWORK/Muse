import { execSync } from 'child_process'
import { createPullRequest, normalizeMuseCommitMessage } from './prFlow'
import { executePrompt, verifyPrompt } from './promptFlow'
import { completeTask } from './taskCompletion'

export interface ShipFlowOptions {
  promptPath: string
  museId: string
  base?: string
  autoMerge?: boolean
  deleteBranch?: boolean
}

export interface ShipFlowResult {
  branch: string
  executionArtifact: string
  verificationArtifact: string
}

function createBranch(branchName: string, base: string): void {
  execSync(`git checkout ${base}`, { stdio: 'inherit' })
  execSync(`git pull --ff-only origin ${base}`, { stdio: 'inherit' })
  execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' })
}

function branchNameFromMuseId(museId: string): string {
  return `muse/${museId.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

export async function shipPrompt(options: ShipFlowOptions): Promise<ShipFlowResult> {
  const base = options.base || 'main'
  const branch = branchNameFromMuseId(options.museId)

  createBranch(branch, base)

  const executionResult = await executePrompt({
    promptPath: options.promptPath,
    museId: options.museId,
  })

  const verificationResult = verifyPrompt({
    promptPath: options.promptPath,
    museId: options.museId,
  })

  const taskId = executionResult.prompt.storyId || options.museId
  completeTask(taskId)

  createPullRequest({
    promptPath: options.promptPath,
    museId: options.museId,
    base,
    branchName: branch,
    createBranch: false,
    commitMessage: normalizeMuseCommitMessage(options.museId, `ship ${executionResult.prompt.id}`),
    title: `${options.museId}: ${executionResult.prompt.title}`,
    autoMerge: options.autoMerge,
    deleteBranchOnMerge: options.deleteBranch,
  })

  return {
    branch,
    executionArtifact: executionResult.outputPath,
    verificationArtifact: verificationResult.verificationPath,
  }
}