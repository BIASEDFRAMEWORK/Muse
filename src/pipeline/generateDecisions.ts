import fs from 'fs'
import path from 'path'

export function generateDecisions(governanceMarkdownPath: string): string {
  const absolute = path.resolve(governanceMarkdownPath)
  if (!fs.existsSync(absolute)) {
    throw new Error(`Governance markdown not found: ${absolute}`)
  }

  const content = fs.readFileSync(absolute, 'utf8')
  const outputDir = path.resolve('decisions')
  fs.mkdirSync(outputDir, { recursive: true })

  const outputPath = path.join(outputDir, 'architecture-decisions.md')
  const text = `# Architecture and Product Decisions

## Architecture Decisions
- Use a CLI-first workflow for deterministic artifact generation.
- Keep business logic in pipeline modules, separate from command handlers.

## Security Decisions
- Keep governance source references in all generated artifacts.
- Ensure traceability metadata remains explicit in front matter.

## Product Decisions
- Generate epics, features, stories, and prompts from governance markdown.
- Prioritize explainability and review-ready markdown output.

## Integration Decisions
- Use Microsoft MarkItDown for document-to-markdown conversion.
- Use a declarative muse.yaml pipeline for repeatable execution.

## Source Context
- ${governanceMarkdownPath}
- Input size: ${content.length} characters
`
  fs.writeFileSync(outputPath, text, 'utf8')
  return outputPath
}
