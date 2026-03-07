import fs from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import matter from 'gray-matter'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function computeDocumentId(inputPath: string): string {
  const stem = path.parse(inputPath).name
  return `gov-${slugify(stem)}`
}

function ensureGovernanceDir(): string {
  const dir = path.resolve('specs/governance')
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function resolvePythonCommand(): string {
  const explicit = process.env.MUSE_PYTHON?.trim()
  if (explicit) {
    return explicit
  }

  const candidates = [
    path.resolve('.venv/bin/python'),
    path.resolve('.venv/Scripts/python.exe'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate
    }
  }

  return 'python3'
}

export function convertDocumentToMarkdown(inputFile: string): string {
  const absoluteInput = path.resolve(inputFile)
  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`Input file not found: ${absoluteInput}`)
  }

  const governanceDir = ensureGovernanceDir()
  const outputName = `${path.parse(absoluteInput).name}.md`
  const outputPath = path.join(governanceDir, outputName)

  const pythonCommand = resolvePythonCommand()
  const attempt = spawnSync(pythonCommand, ['-m', 'markitdown', absoluteInput], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  })

  if (attempt.status !== 0 || !attempt.stdout.trim()) {
    const stderr = attempt.stderr?.trim() || 'markitdown execution failed'
    throw new Error(`MarkItDown conversion failed (python: ${pythonCommand}). Install with '${pythonCommand} -m pip install markitdown[pdf]'. ${stderr}`)
  }

  const content = attempt.stdout.endsWith('\n') ? attempt.stdout : `${attempt.stdout}\n`
  const parsed = matter(content)
  const documentId =
    typeof parsed.data.document_id === 'string' && parsed.data.document_id.trim().length > 0
      ? parsed.data.document_id.trim()
      : computeDocumentId(absoluteInput)
  const outputContent = matter.stringify(parsed.content, {
    ...parsed.data,
    document_id: documentId,
    source_path: absoluteInput,
  })

  fs.writeFileSync(outputPath, outputContent.endsWith('\n') ? outputContent : `${outputContent}\n`, 'utf8')

  return outputPath
}
