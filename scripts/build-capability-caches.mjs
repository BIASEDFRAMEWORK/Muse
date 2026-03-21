#!/usr/bin/env node

/**
 * Build Capability Caches - Fast Lookup Generation
 * 
 * Scans all story files and generates JSON caches:
 * - pr-status-map.json: Individual story PR tracking
 * - capability-summary.json: Aggregated progress by capability
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const STORIES_DIR = 'specs/stories';
const CACHE_DIR = '.muse/story-progress';

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Calculate capability progress
 */
function calcCapabilityProgress(stories) {
  if (stories.length === 0) return 0;

  const totalProgress = stories.reduce((sum, s) => sum + (s.progress || 0), 0);
  return Math.round(totalProgress / stories.length);
}

/**
 * Map PR status to progress percentage
 */
function mapProgressBand(progress) {
  if (progress === 0) return 'not-started';
  if (progress < 50) return 'in-progress-early';
  if (progress < 80) return 'in-progress-late';
  if (progress < 100) return 'nearly-complete';
  return 'complete';
}

function buildCaches() {
  try {
    const files = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.md'));
    const stories = [];
    const capabilities = {};

    console.log(`📦 Building caches from ${files.length} story files...`);

    // Parse all stories
    for (const file of files) {
      const filepath = path.join(STORIES_DIR, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);

      if (!match) continue;

      const meta = yaml.load(match[1]);
      const body = match[2];

      // Extract title from markdown
      const titleMatch = body.match(/^#\s+(.+)/m);
      const title = titleMatch ? titleMatch[1] : meta.name || 'Untitled';

      const story = {
        id: meta.id || file.replace('.md', ''),
        story_id: meta.story_id,
        name: meta.name || title,
        capability: meta.capability,
        epic: meta.epic,
        feature: meta.feature,
        related_pr: meta.related_pr,
        pr_status: meta.pr_status,
        implementation_status: meta.implementation_status,
        progress: meta.progress || 0,
        archived: meta.archived === true,
        last_updated: meta.last_pr_sync || meta.derived_from_date
      };

      stories.push(story);

      // Aggregate by capability
      if (meta.capability) {
        if (!capabilities[meta.capability]) {
          capabilities[meta.capability] = {
            name: meta.capability_name || meta.capability,
            stories: [],
            progress: 0,
            status: 'not-started'
          };
        }
        capabilities[meta.capability].stories.push(story);
      }
    }

    // Calculate capability-level progress
    for (const cap of Object.values(capabilities)) {
      cap.progress = calcCapabilityProgress(cap.stories);
      cap.status = mapProgressBand(cap.progress);
      cap.story_count = cap.stories.length;
    }

    // Write PR status map
    const prStatusMap = {
      generated: new Date().toISOString(),
      story_count: stories.length,
      stories: stories
        .filter(s => s.related_pr)
        .sort((a, b) => (a.related_pr || 0) - (b.related_pr || 0))
    };

    fs.writeFileSync(
      path.join(CACHE_DIR, 'pr-status-map.json'),
      JSON.stringify(prStatusMap, null, 2),
      'utf-8'
    );
    console.log(`✅ Created pr-status-map.json (${prStatusMap.stories.length} stories with PRs)`);

    // Write capability summary
    const capabilitySummary = {
      generated: new Date().toISOString(),
      capabilities: Object.entries(capabilities)
        .map(([id, data]) => ({
          id,
          name: data.name,
          status: data.status,
          progress: data.progress,
          story_count: data.story_count,
          archived_count: data.stories.filter(s => s.archived).length
        }))
        .sort((a, b) => b.progress - a.progress)
    };

    fs.writeFileSync(
      path.join(CACHE_DIR, 'capability-summary.json'),
      JSON.stringify(capabilitySummary, null, 2),
      'utf-8'
    );
    console.log(`✅ Created capability-summary.json (${capabilitySummary.capabilities.length} capabilities)`);

    // Write full story data for report
    fs.writeFileSync(
      path.join(CACHE_DIR, 'stories-full.json'),
      JSON.stringify({
        generated: new Date().toISOString(),
        stories
      }, null, 2),
      'utf-8'
    );
    console.log(`✅ Created stories-full.json (${stories.length} total stories)`);

    console.log(`\n✨ Cache build complete!`);

  } catch (err) {
    console.error(`❌ Cache build error: ${err.message}`);
    process.exit(1);
  }
}

buildCaches();
