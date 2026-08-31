const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

// D2C brands worth checking directly — a lot of marketing roles never hit
// Naukri/LinkedIn at all, especially at early-stage startups.
// Most run on Greenhouse/Lever/Ashby — add more as you find them.
// To find a brand's board: try {brand}.com/careers, or search
// "site:boards.greenhouse.io {brand}" / "site:jobs.lever.co/{brand}".
const CAREER_PAGES = [
  { name: "Nykaa/Nykd", url: "https://job-boards.greenhouse.io/nykaa" },
  { name: "Honasa (Mamaearth)", url: "https://honasa.turbohire.co/" },
  { name: "boAt", url: "https://www.boat-lifestyle.com/pages/careers" },
  { name: "Sugar Cosmetics", url: "https://sugarcosmetics.com/pages/careers" },
  { name: "Wow Skin Science", url: "https://www.wowskinscience.com/pages/careers" },
];

/**
 * Generic fallback: fetches each career page and pulls out anything that
 * looks like a job listing link. These sites vary wildly in structure, so
 * this is intentionally loose — treat results as "check this page manually"
 * signals rather than fully parsed job objects. Greenhouse/Lever-hosted boards
 * (structured HTML) will parse cleanly; custom Shopify "careers" pages often won't.
 */
async function fetchCompanyPageJobs() {
  const jobs = [];

  for (const { name, url } of CAREER_PAGES) {
    try {
      const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
      const $ = cheerio.load(html);

      $("a").each((_, el) => {
        const text = $(el).text().trim();
        const href = $(el).attr("href");
        if (!text || !href) return;
        const lower = text.toLowerCase();
        const isMarketingRole =
          lower.includes("marketing") || lower.includes("brand") || lower.includes("content") || lower.includes("influencer");
        if (isMarketingRole) {
          const fullUrl = href.startsWith("http") ? href : new URL(href, url).toString();
          jobs.push({
            title: text,
            company: name,
            location: "Check listing",
            description: "",
            url: fullUrl,
            source: "Company page",
          });
        }
      });
    } catch (err) {
      console.error(`[companyPages] Failed to fetch ${name}:`, err.message);
    }
  }

  return jobs;
}

module.exports = { fetchCompanyPageJobs, CAREER_PAGES };
