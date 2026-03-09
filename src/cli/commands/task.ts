import { completeTask } from '../../pipeline/taskCompletion'

export function taskCompleteCommand(museId: string): void {
  const result = completeTask(museId)
  if (result.changed) {
    process.stdout.write(`Task marked complete: ${museId}\n`)
    return
  }

  process.stdout.write(`Task already complete: ${museId}\n`)
}