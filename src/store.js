const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "jobs.json");

function loadAll() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function saveAll(jobs) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(jobs, null, 2));
}

/**
 * Merges newly-scraped jobs into storage, deduping by URL, and returns
 * only the ones that are genuinely new (so the email digest doesn't repeat
 * yesterday's listings).
 */
function mergeAndGetNew(newJobs) {
  const existing = loadAll();
  const existingUrls = new Set(existing.map((j) => j.url));

  const freshJobs = newJobs.filter((j) => !existingUrls.has(j.url));
  const stamped = freshJobs.map((j) => ({ ...j, firstSeen: new Date().toISOString() }));

  saveAll([...existing, ...stamped]);
  return stamped;
}

module.exports = { loadAll, saveAll, mergeAndGetNew };
