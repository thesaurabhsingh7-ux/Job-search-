const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

/**
 * Scrapes Naukri's public search-results pages (no login required).
 * Naukri frequently tweaks their markup/class names — if this starts
 * returning 0 results, inspect the page HTML and update the selectors below.
 */
async function fetchNaukriJobs(keyword, location = "mumbai") {
  const slug = keyword.toLowerCase().replace(/\s+/g, "-");
  const locSlug = location.toLowerCase().replace(/\s+/g, "-");
  const url = `https://www.naukri.com/${slug}-jobs-in-${locSlug}`;

  try {
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(html);
    const jobs = [];

    $("article.jobTuple, div.srp-jobtuple-wrapper").each((_, el) => {
      const card = $(el);
      const title = card.find("a.title, a.title.ellipsis").first().text().trim();
      const link = card.find("a.title, a.title.ellipsis").first().attr("href");
      const company = card.find("a.subTitle, a.comp-name").first().text().trim();
      const jobLocation = card.find(".locWdth, .loc span, .location").first().text().trim();
      const description = card.find(".job-desc, .job-description").first().text().trim();

      if (title && link) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: jobLocation || location,
          description,
          url: link,
          source: "Naukri",
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`[naukri] Failed to fetch "${keyword}":`, err.message);
    return [];
  }
}

module.exports = { fetchNaukriJobs };
