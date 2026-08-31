require("dotenv").config();
const profile = require("./profile");
const { scoreJob } = require("./scorer");
const { mergeAndGetNew } = require("./store");
const { sendDigest } = require("./mailer");
const { fetchNaukriJobs } = require("./scrapers/naukri");
const { fetchLinkedInJobs } = require("./scrapers/linkedin");
const { fetchIndeedJobs } = require("./scrapers/indeed");
const { fetchInstahyreJobs } = require("./scrapers/instahyre");
const { fetchFounditJobs } = require("./scrapers/foundit");
const { fetchInternshalaJobs } = require("./scrapers/internshala");
const { fetchCompanyPageJobs } = require("./scrapers/companyPages");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Keep this list reasonably short — each entry is one request per source per
// run. More keywords = better coverage but slower runs and higher block risk.
// With 7 sources now, each extra keyword adds ~7 requests to the run.
const SEARCH_KEYWORDS = (
  process.env.SEARCH_TITLES ||
  "influencer marketing,social media marketing,content marketing,marketing executive,brand marketing,growth marketing,performance marketing,community manager"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const LOCATION = process.env.SEARCH_LOCATION || "Mumbai";

async function run() {
  console.log(`[run] Starting job search for ${SEARCH_KEYWORDS.length} keyword(s) in ${LOCATION}...`);
  const allJobs = [];

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`  → Naukri: "${keyword}"`);
    allJobs.push(...(await fetchNaukriJobs(keyword, LOCATION)));
    await sleep(1000);

    console.log(`  → LinkedIn: "${keyword}"`);
    allJobs.push(...(await fetchLinkedInJobs(keyword, `${LOCATION}, Maharashtra, India`)));
    await sleep(1000);

    console.log(`  → Indeed: "${keyword}"`);
    allJobs.push(...(await fetchIndeedJobs(keyword, LOCATION)));
    await sleep(1000);

    console.log(`  → Instahyre: "${keyword}"`);
    allJobs.push(...(await fetchInstahyreJobs(keyword, LOCATION)));
    await sleep(1000);

    console.log(`  → Foundit: "${keyword}"`);
    allJobs.push(...(await fetchFounditJobs(keyword, LOCATION)));
    await sleep(1000);

    console.log(`  → Internshala: "${keyword}"`);
    allJobs.push(...(await fetchInternshalaJobs(keyword, LOCATION)));
    await sleep(1000);
  }

  console.log("  → Company & agency career pages");
  allJobs.push(...(await fetchCompanyPageJobs()));

  console.log(`[run] Fetched ${allJobs.length} raw listings. Scoring...`);

  const scored = allJobs
    .map((job) => {
      const { score, reasons } = scoreJob(job);
      return { ...job, score, reasons };
    })
    .filter((job) => job.score >= profile.minScoreToInclude);

  console.log(`[run] ${scored.length} listings passed the relevance threshold (>= ${profile.minScoreToInclude}).`);

  const newJobs = mergeAndGetNew(scored);
  console.log(`[run] ${newJobs.length} are new since last run.`);

  await sendDigest(newJobs);
  console.log("[run] Done.");
}

run().catch((err) => {
  console.error("[run] Fatal error:", err);
  process.exit(1);
});
  
