#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init'
import { applyCommand } from './commands/apply'
import { convertMDCommand } from './commands/convertMD'
import { deriveArtifactsCommand } from './commands/deriveArtifacts'
import { decisionsCommand } from './commands/decisions'
import { todoCommand } from './commands/todo'
import { explainCommand } from './commands/explain'
import { traceCommand } from './commands/trace'
import { commitCommand } from './commands/commit'
import { prCommand } from './commands/pr'
import { filterDigitalContentCommand } from './commands/filterDigitalContent'
import { promptExecuteCommand, promptVerifyCommand } from './commands/prompt'
import { taskCompleteCommand } from './commands/task'
import { shipCommand } from './commands/ship'

const program = new Command()

program.name('muse').description('Muse CLI: governance-to-engineering artifact pipeline').version('1.0.0')

program.command('init').description('Create muse.yaml').action(() => initCommand())

program
  .command('apply')
  .description('Apply the declarative muse.yaml pipeline')
  .option('--fast', 'use demo-optimized faster generation mode')
  .option('--demo', 'use fastest demo mode with progressive artifact output')
  .action((options: { fast?: boolean; demo?: boolean }) => applyCommand(options))

program
  .command('convertMD <file>')
  .description('Convert governance document to markdown in specs/governance')
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

const prompt = program.command('prompt').description('Execute or verify a single generated implementation prompt')

prompt
  .command('execute <promptPath>')
  .description('Execute one generated AI prompt and persist execution evidence')
  .option('--muse-id <id>', 'MUSE-ID for commit/PR traceability')
  .action((promptPath: string, options: { museId?: string }) => promptExecuteCommand(promptPath, options))

prompt
  .command('verify <promptPath>')
  .description('Verify implementation against prompt/story acceptance criteria and validation checks')
  .option('--muse-id <id>', 'MUSE-ID for verification evidence metadata')
  .action((promptPath: string, options: { museId?: string }) => promptVerifyCommand(promptPath, options))

const task = program.command('task').description('Task management commands')

task
  .command('complete <museId>')
  .description('Mark a TODO task as complete in work-items/tasks/TODO.md')
  .action((museId: string) => taskCompleteCommand(museId))

program
  .command('ship <promptPath>')
  .description('Create branch, execute/verify prompt, complete task, commit, and open PR')
  .requiredOption('--muse-id <id>', 'required MUSE-ID for commit and PR guardrails')
  .option('--base <branch>', 'base branch name', 'main')
  .option('--auto-merge', 'enable auto-merge via GitHub CLI')
  .option('--delete-branch', 'delete remote branch on merge')
  .action(
    (
      promptPath: string,
      options: { museId: string; base?: string; autoMerge?: boolean; deleteBranch?: boolean },
    ) => shipCommand(promptPath, options),
  )

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
  .command('pr [prompt]')
  .description('Create a branch, commit generated artifacts, and open a template-driven GitHub pull request')
  .option('--muse-id <id>', 'MUSE-ID (required unless inferable from prompt metadata)')
  .option('--base <branch>', 'base branch name', 'main')
  .option('--delete-branch-on-merge', 'delete branch when PR is merged')
  .option('--auto-merge', 'enable GitHub auto-merge')
  .action(
    (
      prompt: string | undefined,
      options: { museId?: string; base?: string; deleteBranchOnMerge?: boolean; autoMerge?: boolean },
    ) => prCommand(prompt, options),
  )

program
  .command('filter-digital-content <markdown>')
  .description('Filter governance markdown to keep only digital system requirements')
  .action((markdown: string) => filterDigitalContentCommand(markdown))

program.parseAsync(process.argv).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`${message}\n`)
  process.exit(1)
})
