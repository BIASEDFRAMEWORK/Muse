const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const { spawnSync } = require('node:child_process')

const repoRoot = path.resolve(__dirname, '..')
const cliPath = path.join(repoRoot, 'dist/cli/index.js')

function runCli(args) {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
  })
}

test('cli root help works', () => {
  const result = runCli(['--help'])
  assert.equal(result.status, 0, result.stderr || result.stdout)
})

const commandHelpCases = [
  ['init'],
  ['apply'],
  ['convertMD'],
  ['deriveArtifacts'],
  ['decisions'],
  ['todo'],
  ['prompt'],
  ['prompt', 'execute'],
  ['prompt', 'verify'],
  ['task'],
  ['task', 'complete'],
  ['ship'],
  ['explain'],
  ['trace'],
  ['commit'],
  ['pr'],
  ['filter-digital-content'],
]

for (const commandArgs of commandHelpCases) {
  test(`cli command help works: ${commandArgs.join(' ')}`, () => {
    const result = runCli([...commandArgs, '--help'])
    assert.equal(result.status, 0, result.stderr || result.stdout)
  })
}

test('trace resolves prompt lineage to story feature epic', () => {
  const storiesDir = path.join(repoRoot, 'specs/stories')
  const promptsDir = path.join(repoRoot, 'work-items/prompts/stories')
  fs.mkdirSync(storiesDir, { recursive: true })
  fs.mkdirSync(promptsDir, { recursive: true })

  const suffix = Date.now().toString()
  const epicId = 'epic-999'
  const featureId = `${epicId}-feature-001`
  const storyId = `${featureId}-story-001`
  const storyFile = path.join(storiesDir, `${storyId}.md`)
  const promptFile = path.join(promptsDir, `prompt-trace-test-${suffix}.md`)

  const storyContent = `---\nid: ${storyId}\nepic: ${epicId}\nfeature: ${featureId}\nsource: test-source.md\n---\n# Test Story\n`
  const promptContent = `---\nid: prompt-trace-test-${suffix}\nstory: ${storyId}\nsource: test-source.md\n---\n# Test Prompt\n`

  try {
    fs.writeFileSync(storyFile, storyContent, 'utf8')
    fs.writeFileSync(promptFile, promptContent, 'utf8')

    const result = runCli(['trace', promptFile])
    assert.equal(result.status, 0, result.stderr || result.stdout)
    assert.match(result.stdout, new RegExp(`User Story: ${storyId}`))
    assert.match(result.stdout, new RegExp(`Feature: ${featureId}`))
    assert.match(result.stdout, new RegExp(`Epic: ${epicId}`))
  } finally {
    if (fs.existsSync(promptFile)) {
      fs.unlinkSync(promptFile)
    }
    if (fs.existsSync(storyFile)) {
      fs.unlinkSync(storyFile)
    }
  }
})
