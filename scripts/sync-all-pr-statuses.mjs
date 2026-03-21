#!/usr/bin/env node

/**
 * Sync All PR Statuses - Nightly Reconciliation
 * 
 * Loops through all stories with related_pr set.
 * Fetches current PR state from GitHub API.
 * Updates frontmatter if PR state changed.
 */

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const STORIES_DIR = 'specs/stories';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

/**
 * Fetch PR info from GitHub API
 */
async function fetchPRStatus(owner, repo, prNumber) {
  if (!GITHUB_TOKEN) {
    console.warn('⚠️  No GITHUB_TOKEN set, skipping PR fetch');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      console.warn(`⚠️  Could not fetch PR #${prNumber}: ${response.status}`);
      return null;
    }

    const pr = await response.json();
    return {
      number: pr.number,
      state: pr.state,
      draft: pr.draft,
      merged: pr.merged,
      mergeable: pr.mergeable
    };

  } catch (err) {
    console.warn(`⚠️  Error fetching PR #${prNumber}: ${err.message}`);
    return null;
  }
}

/**
 * Map PR state to story status
 */
function mapPRToStatus(prData) {
  if (!prData) return { pr_status: null, implementation_status: 'not-implemented' };

  if (prData.merged) {
    return { pr_status: 'merged', implementation_status: 'implemented' };
  }

  if (prData.state === 'closed') {
    return { pr_status: 'closed', implementation_status: 'not-implemented' };
  }

  if (prData.draft) {
    return { pr_status: 'draft', implementation_status: 'in-progress' };
  }

  return { pr_status: 'open', implementation_status: 'in-progress' };
}

async function syncAllPRStatuses() {
  const owner = 'excel-ai-tech';
  const repo = 'muse';

  try {
    const files = fs.readdirSync(STORIES_DIR).filter(f => f.endsWith('.md'));
    let updated = 0;
    let skipped = 0;

    console.log(`🔄 Syncing ${files.length} story files...`);

    for (const file of files) {
      const filepath = path.join(STORIES_DIR, file);
      const content = fs.readFileSync(filepath, 'utf-8');
      const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)/);

      if (!match) {
        skipped++;
        continue;
      }

      const meta = yaml.load(match[1]);
      const body = match[2];

      if (!meta.related_pr) {
        skipped++;
        continue;
      }

      const prNumber = meta.related_pr;
      const prData = await fetchPRStatus(owner, repo, prNumber);

      if (!prData) {
        console.log(`⏭️  Skipped ${file} (PR fetch failed)`);
        skipped++;
        continue;
      }

      const { pr_status, implementation_status } = mapPRToStatus(prData);

      // Check if status changed
      if (meta.pr_status !== pr_status || meta.implementation_status !== implementation_status) {
        console.log(`✏️  Updating ${file}`);
        console.log(`   PR#${prNumber}: ${meta.pr_status} → ${pr_status}`);

        meta.pr_status = pr_status;
        meta.implementation_status = implementation_status;
        meta.last_pr_sync = new Date().toISOString();

        const frontmatter = yaml.dump(meta, {
          indent: 2,
          lineWidth: -1,
          noRefs: true
        });

        const newContent = `---\n${frontmatter}---\n${body}`;
        fs.writeFileSync(filepath, newContent, 'utf-8');

        updated++;
      } else {
        skipped++;
      }

      // GitHub API rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    console.log(`\n✅ Sync complete: ${updated} updated, ${skipped} skipped/unchanged`);

  } catch (err) {
    console.error(`❌ Sync error: ${err.message}`);
    process.exit(1);
  }
}

syncAllPRStatuses();
