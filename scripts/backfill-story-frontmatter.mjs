#!/usr/bin/env node

/**
 * Backfill Script: Add missing frontmatter fields to story specs
 * 
 * Usage:
 *   node scripts/backfill-story-frontmatter.mjs      # Dry-run (show changes)
 *   node scripts/backfill-story-frontmatter.mjs --apply  # Apply changes
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const STORIES_DIR = 'specs/stories';
const APPLY_CHANGES = process.argv.includes('--apply');
const DRY_RUN = !APPLY_CHANGES;

// Capability mapping from epic hierarchy
const CAPABILITY_MAP = {
  'epic-001': 'CAP-001',  // Access Control Enforcement
  'epic-002': 'CAP-002'   // Retention and Lifecycle Governance
};

/**
 * Extract H1 title from markdown content
 */
function extractTitle(content) {
  const match = content.match(/^# (.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Parse YAML frontmatter from markdown file
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) throw new Error('No frontmatter found');
  
  try {
    return yaml.load(match[1]);
  } catch (err) {
    throw new Error(`YAML parse error: ${err.message}`);
  }
}

/**
 * Extract body content after frontmatter
 */
function extractBody(content) {
  return content.replace(/^---\n[\s\S]*?\n---\n/, '');
}

/**
 * Build enhanced frontmatter with new fields
 */
function buildEnhancedFrontmatter(oldMeta, newName, newCapability) {
  return {
    ...oldMeta,
    // NEW FIELDS FOR CAPABILITY TRACKER
    name: newName,
    capability: newCapability,
    related_pr: null,
    pr_status: null,
    implementation_status: 'not-implemented',
    progress: 0,
    archived: false
  };
}

/**
 * Serialize frontmatter to YAML
 */
function serializeFrontmatter(meta) {
  return yaml.dump(meta, {
    indent: 2,
    lineWidth: -1,
    noRefs: true
  });
}

/**
 * Reconstruct markdown file with new frontmatter
 */
function reconstructFile(frontmatter, body) {
  return `---\n${frontmatter}---\n${body}`;
}

/**
 * Show colored diff (simplified)
 */
function showDiff(oldMeta, newMeta, filename) {
  console.log(`\n📄 ${filename}`);
  
  const added = {};
  const modified = {};
  
  for (const key of Object.keys(newMeta)) {
    if (!(key in oldMeta)) {
      added[key] = newMeta[key];
    } else if (JSON.stringify(oldMeta[key]) !== JSON.stringify(newMeta[key])) {
      modified[key] = { old: oldMeta[key], new: newMeta[key] };
    }
  }
  
  if (Object.keys(added).length > 0) {
    console.log('  ✨ ADDED:');
    Object.entries(added).forEach(([k, v]) => {
      console.log(`    + ${k}: ${JSON.stringify(v)}`);
    });
  }
  
  if (Object.keys(modified).length > 0) {
    console.log('  ♻️  MODIFIED:');
    Object.entries(modified).forEach(([k, { old, new: newVal }]) => {
      console.log(`    ~ ${k}: ${JSON.stringify(old)} → ${JSON.stringify(newVal)}`);
    });
  }
}

/**
 * Main backfill logic
 */
async function backfill() {
  console.log(`\n🔍 Scanning ${STORIES_DIR}/ for story files...\n`);
  
  // Get all story files
  const files = fs.readdirSync(STORIES_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();
  
  console.log(`Found ${files.length} stories\n`);
  
  const results = {
    total: files.length,
    success: 0,
    error: 0,
    details: []
  };
  
  // Process each file
  for (const filename of files) {
    const filepath = path.join(STORIES_DIR, filename);
    
    try {
      // Read file
      const content = fs.readFileSync(filepath, 'utf-8');
      
      // Parse components
      const oldMeta = parseFrontmatter(content);
      const body = extractBody(content);
      const title = extractTitle(content);
      
      if (!title) {
        throw new Error('No H1 title found in markdown');
      }
      
      // Map capability from epic
      const epic = oldMeta.epic || oldMeta.epic_id;
      const capability = CAPABILITY_MAP[epic];
      
      if (!capability) {
        throw new Error(`No capability mapping found for epic: ${epic}`);
      }
      
      // Build new frontmatter
      const newMeta = buildEnhancedFrontmatter(oldMeta, title, capability);
      
      // Show diff
      showDiff(oldMeta, newMeta, filename);
      
      results.details.push({
        filename,
        name: title,
        capability,
        status: 'ok'
      });
      
      // Apply changes if --apply flag
      if (!DRY_RUN) {
        const frontmatter = serializeFrontmatter(newMeta);
        const newContent = reconstructFile(frontmatter, body);
        fs.writeFileSync(filepath, newContent, 'utf-8');
        console.log(`  ✅ Written to ${filepath}`);
      }
      
      results.success++;
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
      results.error++;
      results.details.push({
        filename,
        status: 'error',
        error: error.message
      });
    }
  }
  
  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✅ Processed: ${results.success}/${results.total}`);
  console.log(`❌ Errors: ${results.error}/${results.total}`);
  
  if (DRY_RUN) {
    console.log('\n🏃 DRY RUN MODE - No changes applied');
    console.log('   To apply changes, run: node scripts/backfill-story-frontmatter.mjs --apply');
  } else {
    console.log('\n🎉 Changes applied successfully!');
  }
  
  console.log(`${'='.repeat(60)}\n`);
  
  return results.error === 0 ? 0 : 1;
}

// Run
const exitCode = await backfill();
process.exit(exitCode);
