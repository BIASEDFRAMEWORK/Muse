import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

type TodoItem = {
  id: string
  title: string
  priority: 'P0' | 'P1' | 'P2'
}

function inferPriority(index: number): 'P0' | 'P1' | 'P2' {
  if (index < 4) {
    return 'P0'
  }
  if (index < 10) {
    return 'P1'
  }
  return 'P2'
}

export function generateTodo(): string {
  const storyDirs = [path.resolve('specs/stories'), path.resolve('docs/derived/user-stories')]
  const storiesDir = storyDirs.find((dir) => fs.existsSync(dir))
  if (!storiesDir) {
    throw new Error('No user stories found. Run muse deriveArtifacts first.')
  }

  const storyFiles = fs
    .readdirSync(storiesDir)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b))

  const todos: TodoItem[] = storyFiles.map((name, index) => {
    const raw = fs.readFileSync(path.join(storiesDir, name), 'utf8')
    const parsed = matter(raw)
    const titleLine = parsed.content.split(/\r?\n/).find((line) => line.startsWith('# '))
    return {
      id: String(parsed.data.id || path.parse(name).name),
      title: titleLine ? titleLine.replace('# ', '').trim() : name,
      priority: inferPriority(index),
    }
  })

  const outputDir = path.resolve('tasks')
  fs.mkdirSync(outputDir, { recursive: true })
  const outputPath = path.join(outputDir, 'TODO.md')

  const sections: Array<'P0' | 'P1' | 'P2'> = ['P0', 'P1', 'P2']
  const lines: string[] = ['# Prioritized TODO Backlog', '']
  for (const section of sections) {
    lines.push(`## ${section}`)
    const sectionItems = todos.filter((item) => item.priority === section)
    if (sectionItems.length === 0) {
      lines.push('- (none)')
      lines.push('')
      continue
    }
    for (const item of sectionItems) {
      lines.push(`- [ ] ${item.id}: ${item.title}`)
    }
    lines.push('')
  }

  fs.writeFileSync(outputPath, lines.join('\n'), 'utf8')
  return outputPath
}
