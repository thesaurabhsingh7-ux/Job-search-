// Generates a static docs/index.html from data/jobs.json so it can be
// served for free by GitHub Pages — no server process needed, viewable
// from any browser including iPad Safari.
const fs = require("fs");
const path = require("path");
const { loadAll } = require("../src/store");

const OUT_FILE = path.join(__dirname, "..", "docs", "index.html");

function generate() {
  const jobs = loadAll().sort(
    (a, b) => b.score - a.score || new Date(b.firstSeen) - new Date(a.firstSeen)
  );

  const rows = jobs
    .map(
      (j) => `
    <tr>
      <td><a href="${j.url}" target="_blank" rel="noopener">${escapeHtml(j.title)}</a></td>
      <td>${escapeHtml(j.company)}</td>
      <td>${escapeHtml(j.location)}</td>
      <td>${escapeHtml(j.source)}</td>
      <td><span class="score">${j.score}</span></td>
      <td class="reasons">${escapeHtml((j.reasons || []).join(", "))}</td>
      <td>${new Date(j.firstSeen).toLocaleDateString("en-IN")}</td>
    </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Job Finder Dashboard</title>
  <style>
    body { font-family: -apple-system, Arial, sans-serif; margin: 24px; background: #fafafa; color: #1a1a1a; }
    h1 { font-size: 20px; }
    table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
    th { background: #f5f5f5; position: sticky; top: 0; }
    a { color: #0056d6; text-decoration: none; font-weight: 600; }
    .score { font-weight: 700; color: #0a7d3c; }
    .reasons { color: #888; font-size: 12px; max-width: 260px; }
    .meta { color: #888; font-size: 13px; margin-bottom: 16px; }
    @media (max-width: 700px) {
      table, thead, tbody, th, td, tr { display: block; }
      thead { display: none; }
      tr { margin-bottom: 14px; background: white; padding: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      td { border: none; padding: 4px 0; }
      td:before { content: attr(data-label); font-weight: 600; display: inline-block; width: 90px; color: #999; }
    }
  </style>
</head>
<body>
  <h1>Job Finder — ${jobs.length} matches on file</h1>
  <p class="meta">Updated automatically by the scheduled GitHub Action. Sorted by relevance score.</p>
  <table>
    <tr><th>Title</th><th>Company</th><th>Location</th><th>Source</th><th>Score</th><th>Why it matched</th><th>Found</th></tr>
    ${rows || '<tr><td colspan="7">No jobs yet — the workflow hasn\'t run, or nothing matched.</td></tr>'}
  </table>
</body>
</html>`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, html);
  console.log(`[dashboard] Wrote ${jobs.length} jobs to ${OUT_FILE}`);
}

function escapeHtml(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

generate();
