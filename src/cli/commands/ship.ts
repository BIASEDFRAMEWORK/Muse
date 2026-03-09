import { shipPrompt } from '../../pipeline/shipFlow'

export async function shipCommand(
  promptPath: string,
  options: { museId: string; base?: string; autoMerge?: boolean; deleteBranch?: boolean },
): Promise<void> {
  const result = await shipPrompt({
    promptPath,
    museId: options.museId,
    base: options.base,
    autoMerge: Boolean(options.autoMerge),
    deleteBranch: Boolean(options.deleteBranch),
  })

  process.stdout.write(`Ship flow completed on branch ${result.branch}\n`)
  process.stdout.write(`Execution artifact: ${result.executionArtifact}\n`)
  process.stdout.write(`Verification artifact: ${result.verificationArtifact}\n`)
}