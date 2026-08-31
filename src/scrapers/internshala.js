const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

/**
 * Scrapes Internshala's job search pages. Skews toward early-career roles
 * and internships, but increasingly lists full-time marketing/growth roles
 * at startups too — worth keeping as a supplementary source. Unofficial
 * scrape like the others; check selectors if results drop to 0.
 */
async function fetchInternshalaJobs(keyword, location = "mumbai") {
  const slug = keyword.toLowerCase().replace(/\s+/g, "-");
  const locSlug = location.toLowerCase().replace(/\s+/g, "-");
  const url = `https://internshala.com/jobs/${slug}-jobs-in-${locSlug}/`;

  try {
    const { data: html } = await axios.get(url, { headers: HEADERS, timeout: 15000 });
    const $ = cheerio.load(html);
    const jobs = [];

    $("div.individual_internship").each((_, el) => {
      const card = $(el);
      const title = card.find(".job-internship-name, .profile").first().text().trim();
      const relLink = card.attr("data-href") || card.find("a").first().attr("href");
      const company = card.find(".company-name").first().text().trim();
      const jobLocation = card.find(".locations span, .location_link").first().text().trim();

      if (title && relLink) {
        jobs.push({
          title,
          company: company || "Unknown",
          location: jobLocation || location,
          description: "",
          url: relLink.startsWith("http") ? relLink : `https://internshala.com${relLink}`,
          source: "Internshala",
        });
      }
    });

    return jobs;
  } catch (err) {
    console.error(`[internshala] Failed to fetch "${keyword}":`, err.message);
    return [];
  }
}

module.exports = { fetchInternshalaJobs };
