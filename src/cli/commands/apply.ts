import { loadConfig } from '../../config/loadConfig'
import { convertDocumentToMarkdown } from '../../markdown/convert'
import { deriveArtifacts } from '../../pipeline/deriveArtifacts'
import { generateDecisions } from '../../pipeline/generateDecisions'
import { generateTodo } from '../../pipeline/generateTodo'
import { filterDigitalContent } from '../../pipeline/filterDigitalContent'

export interface ApplyCommandOptions {
  fast?: boolean
}

export async function applyCommand(options: ApplyCommandOptions = {}): Promise<void> {
  const config = loadConfig('muse.yaml')
  let governanceMarkdown = config.governance.source

  if (config.pipeline.convert_markdown && !config.governance.source.toLowerCase().endsWith('.md')) {
    governanceMarkdown = convertDocumentToMarkdown(config.governance.source)
  }

  if (!governanceMarkdown.toLowerCase().endsWith('.digital.md')) {
    const filtered = filterDigitalContent(governanceMarkdown, { verbose: false })
    governanceMarkdown = filtered.outputPath
  }
  process.stdout.write(`Using digital-only governance source: ${governanceMarkdown}\n`)

  if (config.pipeline.derive_artifacts) {
    if (options.fast) {
      process.stdout.write('Fast mode enabled for apply: reduced token budget and parallel story generation.\n')
    }
    await deriveArtifacts({
      sourceMarkdownPath: governanceMarkdown,
      ai: config.ai,
      mode: options.fast ? 'fast' : 'standard',
    })
  }

  if (config.pipeline.decisions) {
    generateDecisions(governanceMarkdown)
  }

  if (config.pipeline.todo) {
    generateTodo()
  }

  process.stdout.write('muse apply completed.\n')
}
