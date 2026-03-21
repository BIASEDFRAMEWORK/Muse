#!/usr/bin/env node

/**
 * Generate Capability Report - Static HTML
 * 
 * Builds .muse/capability-report.html with hierarchy visualization
 * Embeds JSON data for static delivery (no external API calls)
 */

import fs from 'fs';
import path from 'path';

const CACHE_DIR = '.muse/story-progress';
const OUTPUT_FILE = '.muse/capability-report.html';

/**
 * Get color for progress band
 */
function getProgressColor(progress) {
  if (progress === 0) return '#ef4444';      // red
  if (progress < 50) return '#f97316';       // orange
  if (progress < 80) return '#eab308';       // yellow
  if (progress === 100) return '#22c55e';    // green
  return '#3b82f6';                          // blue (80-99%)
}

/**
 * Format timestamp
 */
function formatDate(isoString) {
  if (!isoString) return 'Unknown';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Generate progress bar SVG
 */
function progressBar(value, label = '') {
  const width = 200;
  const fill = (value / 100) * width;
  const color = getProgressColor(value);

  return `
    <div style="margin: 10px 0;">
      <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
        <span>${label}</span>
        <span style="font-weight: bold; color: ${color};">${value}%</span>
      </div>
      <svg width="${width + 40}" height="20" style="background: #f3f4f6; border-radius: 4px; overflow: hidden;">
        <rect width="${fill}" height="20" fill="${color}"/>
      </svg>
    </div>
  `;
}

function generateReport() {
  try {
    // Load caches
    const capSummaryPath = path.join(CACHE_DIR, 'capability-summary.json');
    const storiesFullPath = path.join(CACHE_DIR, 'stories-full.json');

    if (!fs.existsSync(capSummaryPath) || !fs.existsSync(storiesFullPath)) {
      console.error('❌ Cache files not found. Run build-capability-caches.mjs first.');
      process.exit(1);
    }

    const capSummary = JSON.parse(fs.readFileSync(capSummaryPath, 'utf-8'));
    const storiesFull = JSON.parse(fs.readFileSync(storiesFullPath, 'utf-8'));

    console.log(`📊 Generating report with ${capSummary.capabilities.length} capabilities...`);

    // Group stories by epic for display
    const storyMap = new Map();
    storiesFull.stories.forEach(s => {
      if (!storyMap.has(s.epic)) storyMap.set(s.epic, []);
      storyMap.get(s.epic).push(s);
    });

    // Build capability cards HTML
    let capabilitiesHtml = '';
    for (const cap of capSummary.capabilities) {
      const color = getProgressColor(cap.progress);
      const capStories = storiesFull.stories.filter(s => s.capability === cap.id);

      capabilitiesHtml += `
        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #fafafa;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
            <div>
              <h3 style="margin: 0 0 4px 0;">${cap.id}: ${cap.name}</h3>
              <small style="color: #6b7280;">${cap.story_count} stories • Status: <strong>${cap.status}</strong></small>
            </div>
            <div style="font-size: 24px; font-weight: bold; color: ${color};">${cap.progress}%</div>
          </div>
          
          ${progressBar(cap.progress, 'Overall Progress')}
          
          <details style="margin-top: 12px;">
            <summary style="cursor: pointer; color: #0066cc; margin-bottom: 8px;">Show stories (${capStories.length})</summary>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
              ${capStories.map(s => `
                <div style="padding: 8px; margin-bottom: 8px; background: white; border-radius: 4px; border-left: 3px solid ${getProgressColor(s.progress)};">
                  <div style="font-size: 12px; color: #6b7280;">${s.id}</div>
                  <div style="font-weight: 500; margin: 4px 0;">${s.name}</div>
                  <div style="display: flex; gap: 12px; font-size: 12px; color: #6b7280;">
                    <span>${s.implementation_status}</span>
                    <span>PR: ${s.related_pr ? `#${s.related_pr}` : 'none'}</span>
                    <span>${s.progress}%</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </details>
        </div>
      `;
    }

    // Build overall stats
    const totalStories = storiesFull.stories.length;
    const completedStories = storiesFull.stories.filter(s => s.progress === 100).length;
    const inProgressStories = storiesFull.stories.filter(s => s.progress > 0 && s.progress < 100).length;
    const withPRs = storiesFull.stories.filter(s => s.related_pr).length;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Capability Implementation Tracker</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f9fafb;
      color: #1f2937;
      line-height: 1.6;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      border-bottom: 1px solid #e5e7eb;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { font-size: 28px; margin-bottom: 8px; }
    .subtitle { font-size: 14px; opacity: 0.9; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin: 30px 0;
    }
    .stat-card {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #667eea;
    }
    .stat-label {
      font-size: 12px;
      color: #6b7280;
      margin-top: 4px;
    }
    .section { margin: 40px 0; }
    .section h2 {
      font-size: 20px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e5e7eb;
    }
    details summary { outline: none; }
    details summary:hover { text-decoration: underline; }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="container">
      <h1>🎯 Capability Implementation Tracker</h1>
      <div class="subtitle">Real-time progress dashboard for specification-driven development</div>
    </div>
  </div>

  <div class="container">
    <!-- Stats -->
    <div class="stats">
      <div class="stat-card" style="border-left-color: #22c55e;">
        <div class="stat-value" style="color: #22c55e;">${completedStories}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card" style="border-left-color: #3b82f6;">
        <div class="stat-value" style="color: #3b82f6;">${inProgressStories}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card" style="border-left-color: #f97316;">
        <div class="stat-value" style="color: #f97316;">${withPRs}</div>
        <div class="stat-label">With PRs</div>
      </div>
      <div class="stat-card" style="border-left-color: #8b5cf6;">
        <div class="stat-value" style="color: #8b5cf6;">${capSummary.capabilities.length}</div>
        <div class="stat-label">Capabilities</div>
      </div>
    </div>

    <!-- Capabilities Section -->
    <div class="section">
      <h2>Capabilities</h2>
      ${capabilitiesHtml}
    </div>

    <!-- Raw Data (for integrations) -->
    <div class="section">
      <h2>Raw Data</h2>
      <details>
        <summary style="color: #0066cc; cursor: pointer;">View JSON data (for API integrations)</summary>
        <div style="margin-top: 12px; background: #f3f4f6; padding: 12px; border-radius: 4px; overflow: auto; max-height: 400px;">
          <pre style="font-size: 11px; font-family: monospace; white-space: pre-wrap; word-wrap: break-word;">${JSON.stringify(capSummary, null, 2)}</pre>
        </div>
      </details>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>Generated:</strong> ${formatDate(capSummary.generated)}</p>
      <p><strong>Source:</strong> specs/stories/ (${totalStories} stories)</p>
      <p><strong>Progress Bands:</strong> 0% = not-started | 1-49% = early-progress | 50-79% = late-progress | 80-99% = nearly-complete | 100% = complete</p>
      <p>This report is auto-generated. Manual edits will be overwritten.</p>
    </div>
  </div>

  <script>
    // Embed capability summary for client-side queries
    const CAPABILITY_DATA = ${JSON.stringify(capSummary)};
    const STORY_DATA = ${JSON.stringify(storiesFull.stories)};
  </script>
</body>
</html>
    `;

    fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');
    console.log(`✅ Report generated: ${OUTPUT_FILE}`);
    console.log(`   Stats: ${completedStories}/${totalStories} complete, ${withPRs} with PRs`);

  } catch (err) {
    console.error(`❌ Report generation error: ${err.message}`);
    process.exit(1);
  }
}

generateReport();
