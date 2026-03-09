import fs from 'fs'
import path from 'path'

const TODO_PATH = path.resolve('work-items/tasks/TODO.md')

export interface TaskCompletionResult {
  changed: boolean
  alreadyComplete: boolean
  outputPath: string
}

export function completeTaskInMarkdown(markdown: string, museId: string): { updated: string; changed: boolean; alreadyComplete: boolean } {
  const lines = markdown.split(/\r?\n/)
  let changed = false
  let alreadyComplete = false

  const updatedLines = lines.map((line) => {
    const match = line.match(/^(\s*-\s+\[)( |x)(\]\s+([^:]+):\s+.*)$/i)
    if (!match) {
      return line
    }

    const lineId = match[4].trim()
    if (lineId !== museId) {
      return line
    }

    if (match[2].toLowerCase() === 'x') {
      alreadyComplete = true
      return line
    }

    changed = true
    return `${match[1]}x${match[3]}`
  })

  if (!changed && !alreadyComplete) {
    throw new Error(`Task not found in TODO.md: ${museId}`)
  }

  return {
    updated: updatedLines.join('\n'),
    changed,
    alreadyComplete,
  }
}

export function completeTask(museId: string): TaskCompletionResult {
  if (!fs.existsSync(TODO_PATH)) {
    throw new Error('TODO backlog not found at work-items/tasks/TODO.md')
  }

  const raw = fs.readFileSync(TODO_PATH, 'utf8')
  const result = completeTaskInMarkdown(raw, museId)

  if (result.changed) {
    fs.writeFileSync(TODO_PATH, `${result.updated.replace(/\s+$/g, '')}\n`, 'utf8')
  }

  return {
    changed: result.changed,
    alreadyComplete: result.alreadyComplete,
    outputPath: TODO_PATH,
  }
}