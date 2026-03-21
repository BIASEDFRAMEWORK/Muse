#!/usr/bin/env node

/**
 * Analyze Implementation - Heuristic Code Scan
 * 
 * Scans codebase for symbols matching story description.
 * If linked PR is merged and symbols found, boosts progress to 100%.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { execSync } from 'child_process';

const STORIES_DIR = 'specs/stories';
const SRC_DIR = 'src';

// Parse CLI arguments
function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx >= 0 ? process.argv[idx + 1] : null;
}

const STORY_ID = getArg('story-id');
const PR_NUMBER = getArg('pr');

/**
 * Extract key terms from story description/title
 */
function extractKeyTerms(storyName, storyDescription) {
  const text = `${storyName} ${storyDescription || ''}`.toLowerCase();
  
  // Extract camelCase, kebab-case, words
  const terms = [];
  
  // camelCase -> separate words
  text.replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s\-_]+/).forEach(word => {
    if (word.length > 3) terms.push(word.toLowerCase());
  });
  
  return [...new Set(terms)];
}

/**
 * Search codebase for matching symbols
 */
function findMatchingSymbols(terms) {
  try {
    const results = [];
    
    for (const term of terms) {
      try {
        // grep for function/class names and imports
        const output = execSync(
          `grep -r "\\b${term}\\b" ${SRC_DIR}/ --include="*.ts" --include="*.js" | head -5`,
          { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        );
        
        if (output) {
          // Parse grep results into file:line format
          output.split('\n').forEach(line => {
            if (line && !results.find(r => r === line)) {
              results.push(line);
            }
          });
        }
      } catch (e) {
        // Term not found, continue
      }
    }
    
    return results.length > 0;  // Boolean: found or not
    
  } catch (err) {
    return false;
  }
}

function analyzeImplementation() {
  if (!STORY_ID) {
    console.error('Usage: node scripts/analyze-implementation.mjs --story-id <id>');
    process.exit(1);
  }

  const filepath = path.join(STORIES_DIR, `${STORY_ID}.md`);
  
  if (!fs.existsSync(filepath)) {
    console.error(`❌ Story file not found: ${filepath}`);
    process.exit(1);
  }

  try {
    // Read story
    const content = fs.readFileSync(filepath, 'utf-8');
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);
    
    if (!match) {
      console.error(`❌ Invalid story format: ${filepath}`);
      process.exit(1);
    }

    const meta = yaml.load(match[1]);
    const body = match[2];
    
    // Only analyze if PR is merged
    if (meta.pr_status !== 'merged') {
      console.log(`⏭️  Skipping analysis (PR not merged): ${STORY_ID}`);
      return;
    }
    
    // Extract terms
    const terms = extractKeyTerms(meta.name || '', body);
    
    if (terms.length === 0) {
      console.log(`⚠️  No terms extracted for analysis: ${STORY_ID}`);
      return;
    }
    
    console.log(`🔍 Analyzing ${STORY_ID}`);
    console.log(`   Terms: ${terms.slice(0, 5).join(', ')}`);
    
    // Search codebase
    const found = findMatchingSymbols(terms);
    
    if (found) {
      console.log(`✅ Implementation symbols found!`);
      console.log(`   Boosting progress: ${meta.progress}% → 100%`);
      
      meta.progress = 100;
      meta.implementation_status = 'implemented';
      meta.code_analysis_updated = new Date().toISOString();
      
      // Write back
      const frontmatter = yaml.dump(meta, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      });
      
      const newContent = `---\n${frontmatter}---\n${body}`;
      fs.writeFileSync(filepath, newContent, 'utf-8');
      
      console.log(`   ✅ Updated ${STORY_ID}`);
      
    } else {
      console.log(`ℹ️  No code analysis symbols found (progress stays at ${meta.progress}%)`);
    }

  } catch (err) {
    console.error(`❌ Analysis error: ${err.message}`);
    process.exit(1);
  }
}

analyzeImplementation();
