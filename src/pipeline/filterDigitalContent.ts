import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

type Section = {
  headingLine: string | null
  headingTitle: string
  lines: string[]
}

type FilterOptions = {
  verbose?: boolean
}

export type FilterDigitalContentResult = {
  outputPath: string
  removedSections: string[]
  keptSections: string[]
}

const physicalStrongKeywords = [
  'physical file',
  'physical storage',
  'manual filing',
  'paper record',
  'physical archive',
  'manual process',
  'file cabinet',
  'paper retention',
  'paper records',
]

const physicalWeakKeywords = ['paper', 'physical', 'manual']

const digitalStrongKeywords = [
  'digital record',
  'electronic record',
  'audit log',
  'access log',
  'process automation',
  'automation',
  'security',
  'encryption',
  'api',
  'software control',
  'software controls',
  'database',
  'logging',
]

const digitalWeakKeywords = ['system', 'software', 'application', 'service']

function countKeywordHits(text: string, keywords: string[]): number {
  const normalized = text.toLowerCase()
  return keywords.reduce((count, keyword) => {
    let index = normalized.indexOf(keyword)
    let matches = 0
    while (index !== -1) {
      matches += 1
      index = normalized.indexOf(keyword, index + keyword.length)
    }
    return count + matches
  }, 0)
}

function splitSections(markdown: string): Section[] {
  const lines = markdown.split(/\r?\n/)
  const sections: Section[] = []

  let current: Section = {
    headingLine: null,
    headingTitle: 'Preamble',
    lines: [],
  }

  for (const line of lines) {
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line)
    if (headingMatch) {
      if (current.lines.length > 0 || current.headingLine !== null) {
        sections.push(current)
      }
      current = {
        headingLine: line,
        headingTitle: headingMatch[2].trim(),
        lines: [line],
      }
      continue
    }

    current.lines.push(line)
  }

  if (current.lines.length > 0 || current.headingLine !== null) {
    sections.push(current)
  }

  return sections
}

function shouldKeepSection(section: Section): boolean {
  const text = section.lines.join('\n')
  const physicalScore =
    countKeywordHits(text, physicalStrongKeywords) * 3 + countKeywordHits(text, physicalWeakKeywords)
  const digitalScore =
    countKeywordHits(text, digitalStrongKeywords) * 3 + countKeywordHits(text, digitalWeakKeywords)

  if (digitalScore === 0) {
    return false
  }

  if (physicalScore >= 6 && physicalScore > digitalScore) {
    return false
  }

  return digitalScore >= Math.max(3, physicalScore)
}

function outputPathFor(inputPath: string): string {
  const absolute = path.resolve(inputPath)
  const parsed = path.parse(absolute)
  const outDir = path.resolve('specs/governance')
  fs.mkdirSync(outDir, { recursive: true })

  const baseName = parsed.name.endsWith('.digital') ? parsed.name : `${parsed.name}.digital`
  return path.join(outDir, `${baseName}.md`)
}

export function filterDigitalContent(markdownPath: string, options: FilterOptions = {}): FilterDigitalContentResult {
  const absoluteInputPath = path.resolve(markdownPath)
  if (!fs.existsSync(absoluteInputPath)) {
    throw new Error(`File not found: ${absoluteInputPath}`)
  }

  const raw = fs.readFileSync(absoluteInputPath, 'utf8')
  if (!raw.trim()) {
    throw new Error('Invalid markdown: file is empty.')
  }

  const parsed = matter(raw)
  const markdownContent = parsed.content
  if (!markdownContent.trim()) {
    throw new Error('Invalid markdown: file has no content after front matter.')
  }

  const documentId =
    typeof parsed.data.document_id === 'string' && parsed.data.document_id.trim().length > 0
      ? parsed.data.document_id.trim()
      : null

  if (options.verbose) {
    process.stdout.write('Filtering governance markdown for digital system requirements...\n\n')
  }

  const sections = splitSections(markdownContent)
  if (sections.length === 0) {
    throw new Error('Invalid markdown: no parseable content found.')
  }

  const kept = sections.filter((section) => shouldKeepSection(section))
  const removed = sections.filter((section) => !shouldKeepSection(section))

  const keptTitles = kept
    .map((section) => section.headingTitle)
    .filter((title) => title && title !== 'Preamble')
  const removedTitles = removed
    .map((section) => section.headingTitle)
    .filter((title) => title && title !== 'Preamble')

  if (options.verbose) {
    process.stdout.write('Removed sections:\n')
    if (removedTitles.length === 0) {
      process.stdout.write('* (none)\n')
    } else {
      for (const title of removedTitles) {
        process.stdout.write(`* ${title}\n`)
      }
    }

    process.stdout.write('\nKept sections:\n')
    if (keptTitles.length === 0) {
      process.stdout.write('* (none)\n')
    } else {
      for (const title of keptTitles) {
        process.stdout.write(`* ${title}\n`)
      }
    }
  }

  if (kept.length === 0) {
    throw new Error('No digital governance requirements detected.')
  }

  const outputPath = outputPathFor(absoluteInputPath)
  const sourceForHeader = path.relative(process.cwd(), absoluteInputPath) || absoluteInputPath

  const frontMatterBlock = [
    '---',
    ...(documentId ? [`document_id: ${documentId}`] : []),
    `source_path: ${absoluteInputPath}`,
    '---',
    '',
  ].join('\n')

  const header = [
    frontMatterBlock,
    '# Digital Governance Extract',
    '',
    'This file was generated by Muse using the filter-digital-content command.',
    'It contains only governance requirements relevant to digital systems and software controls.',
    '',
    'Source:',
    sourceForHeader,
    '',
  ].join('\n')

  const body = kept
    .map((section) => section.lines.join('\n').trimEnd())
    .filter((content) => content.trim().length > 0)
    .join('\n\n')

  if (!body.trim()) {
    throw new Error('No digital governance requirements detected.')
  }

  fs.writeFileSync(outputPath, `${header}${body}\n`, 'utf8')

  if (options.verbose) {
    process.stdout.write(`\nDigital governance file written to:\n${outputPath}\n`)
  }

  return {
    outputPath,
    removedSections: removedTitles,
    keptSections: keptTitles,
  }
}
