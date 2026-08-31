const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/**
 * Scrapes Indeed India's public search-results pages. Like the other
 * scrapers, this is unofficial — Indeed's markup changes periodically, so
 * if this returns 0 results, check the selectors against the live page.
 */
async function fetchIndeedJobs(keyword, location = "Mumbai") {
  const url = "https://in.indeed.com/jobs";

  try {
    const { data: html } = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      params: { q: keyword, l: location },
    });

    const $ = cheerio.load(html);
    const jobs = [];

    $("div.job_seen_beacon, div.cardOutline").each((_, el) => {
      const card = $(el);
      const title = card.find("h2.jobTitle span").first().text().trim();
      const relLink = card.find("h2.jobTitle a").first().attr("href");
      const company = card.find(".companyName").first().text().trim();
      const jobLocation = card.find(".companyLocation").first().text().trim();
      const description = card.find(".job-snippet").first().text().trim();

      if (title && relLink) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: jobLocation || location,
          description,
          url: relLink.startsWith("http") ? relLink : `https://in.indeed.com${relLink}`,
          source: "Indeed",
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`[indeed] Failed to fetch "${keyword}":`, err.message);
    return [];
  }
}

module.exports = { fetchIndeedJobs };
