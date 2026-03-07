import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import matter from 'gray-matter'

const repoRoot = process.cwd()

const dirs = {
  governance: ['specs/governance', 'docs/governance', 'docs/derived/governance'],
  epics: ['specs/epics', 'docs/derived/epics'],
  features: ['specs/capabilities', 'docs/derived/features'],
  stories: ['specs/stories', 'docs/stories', 'docs/derived/user-stories']
}

const errors = []
const warnings = []

const report = {
  summary: {},
  errors,
  warnings,
  artifacts: {
    governance: [],
    epics: [],
    features: [],
    stories: []
  }
}

function normalizePathRef(pathRef) {
  if (!pathRef || typeof pathRef !== 'string') return null
  const resolved = path.isAbsolute(pathRef) ? pathRef : path.resolve(repoRoot, pathRef)
  return path.relative(repoRoot, resolved)
}

function parseDigitalSourcePath(raw) {
  const sourceMatch = raw.match(/(?:^|\n)Source:\s*\n([^\n]+)/m)
  if (!sourceMatch) return null
  const candidate = sourceMatch[1].trim()
  return candidate.length ? candidate : null
}

// Determines if a file should be excluded from validation (documentation, tests, examples)
function shouldExcludeFile(filePath) {
  const basename = path.basename(filePath)
  const relativePath = path.relative(repoRoot, filePath)
  
  // Exclude files with "agent-based" in the name (documentation files)
  if (basename.includes('agent-based')) return true
  
  // Exclude epic-003 documentation files (completion status, quick reference)
  if (basename.includes('epic-003-completion') || basename.includes('epic-003-quickref')) return true
  
  // Exclude files with temp directory references
  const content = fs.readFileSync(filePath, 'utf-8')
  if (content.includes('/var/folders/') || content.includes('/tmp/')) return true
  
  return false
}

// Extracts YAML front matter blocks from markdown or YAML files, handling both single and multi-block formats.
function readFrontMatterBlocks(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')

  if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
    try {
      const data = YAML.parse(raw) || {}
      return [{ data }]
    } catch (err) {
      errors.push(`Failed to parse YAML in ${path.relative(repoRoot, filePath)}: ${err.message || err}`)
      return []
    }
  }

  // Only parse front matter if file starts with ---
  if (!raw.trimStart().startsWith('---\n')) {
    return []
  }

  const blocks = []
  // Match front matter blocks: must start at beginning of file or after a previous block
  const fmRegex = /^---\n([\s\S]*?)\n---\n/gm
  let match
  while ((match = fmRegex.exec(raw)) !== null) {
    // Only accept matches that are at the start or immediately follow another block
    if (match.index === 0 || raw.substring(0, match.index).trim().endsWith('---')) {
      try {
        const data = YAML.parse(match[1]) || {}
        blocks.push({ data })
      } catch (err) {
        errors.push(`Failed to parse front matter in ${path.relative(repoRoot, filePath)}: ${err.message || err}`)
      }
    }
  }

  return blocks
}

// Recursively walks directory trees and collects files matching given extensions.
function walkFiles(targetDirs, exts) {
  const files = []
  const validExts = new Set(exts)

  for (const dir of targetDirs) {
    const absDir = path.join(repoRoot, dir)
    if (!fs.existsSync(absDir)) continue

    const stack = [absDir]
    while (stack.length) {
      const current = stack.pop()
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        const absPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          stack.push(absPath)
        } else if (validExts.has(path.extname(entry.name))) {
          files.push(absPath)
        }
      }
    }
  }

  return files
}

// Loads and parses muse.yaml artifact registry, or returns null if missing.
function loadMuseYaml() {
  const musePath = path.join(repoRoot, 'muse.yaml')
  if (!fs.existsSync(musePath)) return null

  try {
    return YAML.parse(fs.readFileSync(musePath, 'utf-8')) || null
  } catch (err) {
    errors.push(`Failed to parse muse.yaml: ${err.message || err}`)
    return null
  }
}

// Scans governance files and collects document IDs from front matter.
function collectGovernance() {
  const files = walkFiles(dirs.governance, ['.md', '.markdown', '.yaml', '.yml'])
  for (const filePath of files) {
    if (shouldExcludeFile(filePath)) continue

    const rel = path.relative(repoRoot, filePath)
    const raw = fs.readFileSync(filePath, 'utf-8')
    const blocks = readFrontMatterBlocks(filePath)
    const data = blocks[0]?.data || {}
    let documentId = typeof data.document_id === 'string' ? data.document_id : null

    if (!documentId) {
      const sourcePath = parseDigitalSourcePath(raw)
      if (sourcePath) {
        const sourceAbsPath = path.isAbsolute(sourcePath) ? sourcePath : path.resolve(repoRoot, sourcePath)
        if (fs.existsSync(sourceAbsPath)) {
          const sourceBlocks = readFrontMatterBlocks(sourceAbsPath)
          const sourceData = sourceBlocks[0]?.data || {}
          if (typeof sourceData.document_id === 'string' && sourceData.document_id.trim()) {
            documentId = sourceData.document_id.trim()
          }
        }
      }
    }

    if (!documentId) {
      warnings.push(`Governance file missing document_id in front matter: ${rel}`)
    }
    report.artifacts.governance.push({ document_id: documentId, path: rel, source_path: rel })
  }
}

// Collects epic artifacts from files and muse.yaml, deduplicating entries.
function collectEpics(muse) {
  const files = walkFiles(dirs.epics, ['.md', '.markdown', '.yaml', '.yml'])
  for (const filePath of files) {
    if (shouldExcludeFile(filePath)) continue
    
    const rel = path.relative(repoRoot, filePath)
    const data = readFrontMatterBlocks(filePath)[0]?.data || {}
    const epicId = data.epic_id || data.id
    const derivedFromDocumentId = data.derived_from_document_id || data.document_id || null
    const sourcePath = data.source_path || data.source || null
    if (!epicId) {
      errors.push(`Epic file missing epic_id in front matter: ${rel}`)
      continue
    }
    report.artifacts.epics.push({
      epic_id: epicId,
      derived_from_document_id: derivedFromDocumentId,
      source_path: sourcePath,
      path: rel,
    })
  }

  const museEpics = muse?.artifacts?.epics || []
  for (const epic of museEpics) {
    const rel = epic.epic_path ? path.relative(repoRoot, path.join(repoRoot, epic.epic_path)) : null
    if (rel && !fs.existsSync(path.join(repoRoot, rel))) {
      errors.push(`muse.yaml references missing epic file: ${rel}`)
    }
    if (report.artifacts.epics.some((e) => e.epic_id === epic.epic_id)) continue
    report.artifacts.epics.push({
      epic_id: epic.epic_id,
      derived_from_document_id: epic.derived_from_document_id || epic.derived_from || null,
      source_path: epic.source_path || epic.source || null,
      path: rel || epic.epic_path || 'unknown'
    })
  }
}

// Collects feature artifacts from files and muse.yaml, deduplicating entries.
function collectFeatures(muse) {
  const files = walkFiles(dirs.features, ['.md', '.markdown', '.yaml', '.yml'])
  for (const filePath of files) {
    if (shouldExcludeFile(filePath)) continue
    
    const rel = path.relative(repoRoot, filePath)
    const data = readFrontMatterBlocks(filePath)[0]?.data || {}
    const featureId = data.feature_id || data.id
    const epicRef = data.epic_id || data.derived_from_epic || data.epic
    const parent = data.parent_feature_id || null
    if (!featureId) {
      errors.push(`Feature file missing feature_id in front matter: ${rel}`)
      continue
    }
    report.artifacts.features.push({
      feature_id: featureId,
      derived_from_epic: epicRef,
      parent_feature_id: parent,
      path: rel
    })
  }

  const museFeatures = muse?.artifacts?.features || []
  for (const feature of museFeatures) {
    const rel = feature.feature_path ? path.relative(repoRoot, path.join(repoRoot, feature.feature_path)) : null
    if (rel && !fs.existsSync(path.join(repoRoot, rel))) {
      errors.push(`muse.yaml references missing feature file: ${rel}`)
    }
    if (report.artifacts.features.some((f) => f.feature_id === feature.feature_id)) continue
    report.artifacts.features.push({
      feature_id: feature.feature_id,
      derived_from_epic: feature.derived_from_epic || feature.epic_id,
      parent_feature_id: feature.parent_feature_id || null,
      path: rel || feature.feature_path || 'unknown'
    })
  }
}

// Collects story artifacts from files and muse.yaml, handling multi-block markdown files.
function collectStories(muse) {
  const files = walkFiles(dirs.stories, ['.md', '.markdown', '.yaml', '.yml'])
  for (const filePath of files) {
    if (shouldExcludeFile(filePath)) continue
    
    const rel = path.relative(repoRoot, filePath)
    const blocks = readFrontMatterBlocks(filePath)
    if (blocks.length === 0) {
      warnings.push(`No front matter found for stories file: ${rel}`)
      continue
    }

    for (const block of blocks) {
      const data = block.data || {}
      const storyId = data.story_id || data.id
      const featureRef = data.derived_from_feature || data.feature || data.feature_id
      const epicRef = data.derived_from_epic || data.epic || data.epic_id
      if (!storyId) {
        errors.push(`Story entry missing story_id in ${rel}`)
        continue
      }
      report.artifacts.stories.push({
        story_id: storyId,
        derived_from_feature: featureRef,
        derived_from_epic: epicRef,
        path: rel
      })
    }
  }

  const museStories = muse?.artifacts?.stories || []
  for (const story of museStories) {
    const rel = story.story_path ? path.relative(repoRoot, path.join(repoRoot, story.story_path)) : null
    if (rel && !fs.existsSync(path.join(repoRoot, rel))) {
      errors.push(`muse.yaml references missing story file: ${rel}`)
    }
    if (report.artifacts.stories.some((s) => s.story_id === story.story_id)) continue
    report.artifacts.stories.push({
      story_id: story.story_id,
      derived_from_feature: story.derived_from_feature,
      derived_from_epic: story.derived_from_epic,
      path: rel || story.story_path || 'unknown'
    })
  }
}

// Detects and records duplicate IDs in artifact collections.
function recordDuplicateIds(items, key, label) {
  const counts = new Map()
  for (const item of items) {
    const id = item[key]
    if (!id) continue
    counts.set(id, (counts.get(id) || 0) + 1)
  }

  const duplicates = [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
  for (const dup of duplicates) {
    errors.push(`Duplicate ${label} ID detected: ${dup}`)
  }
}

// Validates that all governance, epic, feature, and story references resolve correctly and are bidirectionally linked.
function validateReferences(governanceMap, epicMap, featureMap, storyMap) {
  const governancePathMap = new Map()
  for (const governance of report.artifacts.governance) {
    const normalized = normalizePathRef(governance.path)
    if (normalized) {
      governancePathMap.set(normalized, governance.document_id || null)
    }
  }

  for (const epic of epicMap.values()) {
    const referencedDocumentId = epic.derived_from_document_id || null
    const normalizedSourcePath = normalizePathRef(epic.source_path)
    const sourcePathExists = normalizedSourcePath ? fs.existsSync(path.resolve(repoRoot, normalizedSourcePath)) : false
    const sourceDocumentId = normalizedSourcePath ? governancePathMap.get(normalizedSourcePath) : null

    if (referencedDocumentId) {
      if (!governanceMap.has(referencedDocumentId)) {
        errors.push(`Epic ${epic.epic_id} references missing governance document_id: ${referencedDocumentId}`)
      }
      continue
    }

    if (sourceDocumentId) {
      warnings.push(`Epic ${epic.epic_id} missing derived_from_document_id; inferred from source_path`)
      continue
    }

    if (sourcePathExists) {
      warnings.push(`Epic ${epic.epic_id} has source_path but cannot resolve governance document_id`) 
      continue
    }

    errors.push(`Epic ${epic.epic_id} missing canonical governance lineage (derived_from_document_id/source_path)`)
  }

  for (const feature of featureMap.values()) {
    if (!feature.derived_from_epic) {
      errors.push(`Feature ${feature.feature_id} missing epic reference`)
      continue
    }
    if (!epicMap.has(feature.derived_from_epic)) {
      errors.push(`Feature ${feature.feature_id} references unknown epic_id: ${feature.derived_from_epic}`)
    }
    if (feature.parent_feature_id && !featureMap.has(feature.parent_feature_id)) {
      errors.push(`Feature ${feature.feature_id} references missing parent_feature_id: ${feature.parent_feature_id}`)
    }
  }

  const featureToStories = new Map()
  for (const story of storyMap.values()) {
    if (!story.derived_from_feature) {
      errors.push(`Story ${story.story_id} missing derived_from_feature`)
    } else if (!featureMap.has(story.derived_from_feature)) {
      errors.push(`Story ${story.story_id} references unknown feature_id: ${story.derived_from_feature}`)
    }

    if (!story.derived_from_epic) {
      errors.push(`Story ${story.story_id} missing derived_from_epic`)
    } else if (!epicMap.has(story.derived_from_epic)) {
      errors.push(`Story ${story.story_id} references unknown epic_id: ${story.derived_from_epic}`)
    }

    if (story.derived_from_feature) {
      const feature = featureMap.get(story.derived_from_feature)
      if (feature && feature.derived_from_epic && story.derived_from_epic && feature.derived_from_epic !== story.derived_from_epic) {
        errors.push(
          `Story ${story.story_id} epic mismatch: feature=${feature.derived_from_epic} story=${story.derived_from_epic}`
        )
      }
      if (feature) {
        featureToStories.set(feature.feature_id, [...(featureToStories.get(feature.feature_id) || []), story.story_id])
      }
    }
  }

  for (const feature of featureMap.values()) {
    const stories = featureToStories.get(feature.feature_id) || []
    if (stories.length === 0) {
      errors.push(`Feature ${feature.feature_id} has no linked stories`)
    }
  }

  for (const epic of epicMap.values()) {
    const hasFeatures = [...featureMap.values()].some((f) => f.derived_from_epic === epic.epic_id)
    if (!hasFeatures) {
      errors.push(`Epic ${epic.epic_id} has no linked features`)
    }
  }
}

// Builds deduplicated Maps of governance, epic, feature, and story artifacts by ID.
function buildMaps() {
  const governanceMap = new Map()
  for (const g of report.artifacts.governance) {
    if (g.document_id) governanceMap.set(g.document_id, g)
  }

  const epicMap = new Map()
  for (const e of report.artifacts.epics) {
    if (e.epic_id && !epicMap.has(e.epic_id)) epicMap.set(e.epic_id, e)
  }

  const featureMap = new Map()
  for (const f of report.artifacts.features) {
    if (f.feature_id && !featureMap.has(f.feature_id)) featureMap.set(f.feature_id, f)
  }

  const storyMap = new Map()
  for (const s of report.artifacts.stories) {
    if (s.story_id && !storyMap.has(s.story_id)) storyMap.set(s.story_id, s)
  }

  return { governanceMap, epicMap, featureMap, storyMap }
}

// Writes traceability validation results to JSON and text report files.
function writeReports(status) {
  report.summary = {
    status,
    counts: {
      governance: report.artifacts.governance.length,
      epics: report.artifacts.epics.length,
      features: report.artifacts.features.length,
      stories: report.artifacts.stories.length
    }
  }

  const jsonPath = path.join(repoRoot, 'traceability-report.json')
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2))

  const lines = [
    `Traceability status: ${status.toUpperCase()}`,
    `Governance: ${report.summary.counts.governance} | Epics: ${report.summary.counts.epics} | Features: ${report.summary.counts.features} | Stories: ${report.summary.counts.stories}`,
    errors.length ? 'Errors:' : 'Errors: none'
  ]

  for (const err of errors) lines.push(`- ${err}`)

  if (warnings.length) {
    lines.push('Warnings:')
    for (const warn of warnings) lines.push(`- ${warn}`)
  }

  const textPath = path.join(repoRoot, 'traceability-report.txt')
  fs.writeFileSync(textPath, lines.join('\n'))

  console.log(lines.join('\n'))
}

// Main orchestrator: collects artifacts, validates references, detects duplicates, and writes reports.
function main() {
  const muse = loadMuseYaml()

  collectGovernance()
  collectEpics(muse)
  collectFeatures(muse)
  collectStories(muse)

  const { governanceMap, epicMap, featureMap, storyMap } = buildMaps()

  recordDuplicateIds(report.artifacts.epics, 'epic_id', 'epic')
  recordDuplicateIds(report.artifacts.features, 'feature_id', 'feature')
  recordDuplicateIds(report.artifacts.stories, 'story_id', 'story')

  if (report.artifacts.epics.length || report.artifacts.features.length || report.artifacts.stories.length) {
    validateReferences(governanceMap, epicMap, featureMap, storyMap)
  } else {
    warnings.push('No epics/features/stories discovered; validation skipped')
  }

  const status = errors.length === 0 ? 'passed' : 'failed'
  writeReports(status)

  if (errors.length > 0) {
    process.exitCode = 1
  }
}

main()
