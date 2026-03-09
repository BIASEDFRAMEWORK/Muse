import { createPullRequest } from '../../pipeline/prFlow'

export function prCommand(
  promptPath: string | undefined,
  options: { museId?: string; base?: string; deleteBranchOnMerge?: boolean; autoMerge?: boolean },
): void {
  const result = createPullRequest({
    promptPath,
    museId: options.museId,
    base: options.base,
    autoMerge: Boolean(options.autoMerge),
    deleteBranchOnMerge: Boolean(options.deleteBranchOnMerge),
  })

  process.stdout.write(`Pull request created for ${result.museId} on ${result.branch}.\n`)
}
