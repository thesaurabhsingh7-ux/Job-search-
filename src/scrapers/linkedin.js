const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/**
 * LinkedIn exposes a "guest" job-search endpoint that returns server-rendered
 * HTML fragments without needing a login. It's unofficial and undocumented,
 * so LinkedIn can change or rate-limit it at any time — treat this scraper as
 * the most likely one to need maintenance. Keep request volume low (this repo
 * already spaces out requests in index.js) to avoid IP-level blocks.
 */
async function fetchLinkedInJobs(keyword, location = "Mumbai, Maharashtra, India") {
  const url = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search";

  try {
    const { data: html } = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      params: {
        keywords: keyword,
        location,
        f_TPR: "r604800", // past week
        start: 0,
      },
    });

    const $ = cheerio.load(html);
    const jobs = [];

    $("li").each((_, el) => {
      const card = $(el);
      const title = card.find(".base-search-card__title").text().trim();
      const company = card.find(".base-search-card__subtitle").text().trim();
      const jobLocation = card.find(".job-search-card__location").text().trim();
      const link = card.find("a.base-card__full-link").attr("href");

      if (title && link) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: jobLocation || location,
          description: "", // guest endpoint doesn't include full JD; scored on title only
          url: link.split("?")[0],
          source: "LinkedIn",
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`[linkedin] Failed to fetch "${keyword}":`, err.message);
    return [];
  }
}

module.exports = { fetchLinkedInJobs };
