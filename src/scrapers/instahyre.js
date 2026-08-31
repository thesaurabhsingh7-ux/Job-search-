const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/**
 * Scrapes Instahyre's public job-search page. Instahyre skews tech-heavy but
 * increasingly lists marketing/growth roles at startups — worth keeping as a
 * secondary source. Unofficial scrape, same caveats as the other scrapers:
 * markup can change, so check selectors if this starts returning nothing.
 */
async function fetchInstahyreJobs(keyword, location = "mumbai") {
  const url = "https://www.instahyre.com/search-jobs/";

  try {
    const { data: html } = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      params: { q: keyword, city: location },
    });

    const $ = cheerio.load(html);
    const jobs = [];

    $(".job-card, .opportunity-card").each((_, el) => {
      const card = $(el);
      const title = card.find(".job-title, .opportunity-title").first().text().trim();
      const link = card.find("a").first().attr("href");
      const company = card.find(".company-name").first().text().trim();
      const jobLocation = card.find(".job-location, .location").first().text().trim();

      if (title && link) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: jobLocation || location,
          description: "",
          url: link.startsWith("http") ? link : `https://www.instahyre.com${link}`,
          source: "Instahyre",
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`[instahyre] Failed to fetch "${keyword}":`, err.message);
    return [];
  }
}

module.exports = { fetchInstahyreJobs };
