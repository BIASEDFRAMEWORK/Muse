import { executePrompt, verifyPrompt } from '../../pipeline/promptFlow'

export async function promptExecuteCommand(promptPath: string, options: { museId?: string }): Promise<void> {
  const result = await executePrompt({ promptPath, museId: options.museId })
  process.stdout.write(`Prompt execution artifact: ${result.outputPath}\n`)
}

export function promptVerifyCommand(promptPath: string, options: { museId?: string }): void {
  const result = verifyPrompt({ promptPath, museId: options.museId })
  process.stdout.write(`Prompt verification artifact: ${result.verificationPath}\n`)
}