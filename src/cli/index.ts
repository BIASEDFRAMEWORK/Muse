#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init'
import { applyCommand } from './commands/apply'
import { convertMDCommand } from './commands/convertMD'
import { deriveArtifactsCommand } from './commands/deriveArtifacts'
import { decisionsCommand } from './commands/decisions'
import { todoCommand } from './commands/todo'
import { runCommand } from './commands/run'
import { explainCommand } from './commands/explain'
import { traceCommand } from './commands/trace'
import { commitCommand } from './commands/commit'
import { prCommand } from './commands/pr'
import { filterDigitalContentCommand } from './commands/filterDigitalContent'

const program = new Command()

program.name('muse').description('Muse CLI: governance-to-engineering artifact pipeline').version('1.0.0')

program.command('init').description('Create muse.yaml').action(() => initCommand())

program
  .command('apply')
  .description('Apply the declarative muse.yaml pipeline')
  .option('--fast', 'use demo-optimized faster generation mode')
  .action((options: { fast?: boolean }) => applyCommand(options))

program
  .command('convertMD <file>')
  .description('Convert governance document to markdown in docs/governance')
  .action((file: string) => convertMDCommand(file))

program
  .command('deriveArtifacts <markdown>')
  .description('Generate epics, features, user stories, and prompts from markdown')
  .option('--fast', 'use demo-optimized faster generation mode')
  .action((markdown: string, options: { fast?: boolean }) => deriveArtifactsCommand(markdown, options))

program
  .command('decisions <markdown>')
  .description('Generate architecture/product decision document from markdown')
  .action((markdown: string) => decisionsCommand(markdown))

program
  .command('todo <markdown>')
  .description('Generate prioritized TODO backlog from derived artifacts')
  .action((_markdown: string) => todoCommand())

program
  .command('run <file>')
  .description('Run convert + derive + decisions + todo for a single file')
  .action((file: string) => runCommand(file))

program
  .command('explain <artifact>')
  .description('Explain artifact purpose, origin, guidance, and security implications')
  .action((artifact: string) => explainCommand(artifact))

program
  .command('trace <artifact>')
  .description('Trace artifact lineage to feature, epic, and governance source')
  .action((artifact: string) => traceCommand(artifact))

program
  .command('commit')
  .description('Stage docs/, commit generated artifacts, optionally open PR')
  .option('--pr', 'open a GitHub pull request using gh CLI')
  .action((options: { pr?: boolean }) => commitCommand(Boolean(options.pr)))

program
  .command('pr')
  .description('Create a branch, commit generated artifacts, and open a GitHub pull request')
  .action(() => prCommand())

program
  .command('filter-digital-content <markdown>')
  .description('Filter governance markdown to keep only digital system requirements')
  .action((markdown: string) => filterDigitalContentCommand(markdown))

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
