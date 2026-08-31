const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/**
 * Scrapes Foundit.in (formerly Monster India) public search pages.
 * Unofficial, markup-dependent like the other scrapers — check selectors
 * against the live page if this starts returning 0 results.
 */
async function fetchFounditJobs(keyword, location = "Mumbai") {
  const slug = keyword.toLowerCase().replace(/\s+/g, "-");
  const locSlug = location.toLowerCase().replace(/\s+/g, "-");
  const url = `https://www.foundit.in/search/${slug}-jobs-in-${locSlug}`;

  try {
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(html);
    const jobs = [];

    $("div.srpResultCardContainer, div.cardContainer").each((_, el) => {
      const card = $(el);
      const title = card.find("h3, .jobTitle a").first().text().trim();
      const link = card.find("a").first().attr("href");
      const company = card.find(".companyName, .company-name").first().text().trim();
      const jobLocation = card.find(".loc, .location").first().text().trim();

      if (title && link) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: jobLocation || location,
          description: "",
          url: link.startsWith("http") ? link : `https://www.foundit.in${link}`,
          source: "Foundit",
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`[foundit] Failed to fetch "${keyword}":`, err.message);
    return [];
  }
}

module.exports = { fetchFounditJobs };
