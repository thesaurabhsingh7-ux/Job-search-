const axios = require("axios");
const cheerio = require("cheerio");

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
};

// D2C brands + marketing/influencer agencies worth checking directly — a lot
// of marketing roles never hit Naukri/LinkedIn at all, especially at
// early-stage startups and boutique agencies.
// Most run on Greenhouse/Lever/Ashby/Turbohire — add more as you find them.
// To find a brand's board: try {brand}.com/careers, or search
// "site:boards.greenhouse.io {brand}" / "site:jobs.lever.co/{brand}".
// NOTE: smaller-brand and boutique-agency URLs below are best-guess
// "/careers" paths — some may 404 if the company doesn't run a standard
// careers page. If one fails consistently, check the site directly and
// update the URL here.
const CAREER_PAGES = [
  // --- D2C brands — established (beauty / personal care / consumer tech) ---
  { name: "Nykaa/Nykd", url: "https://job-boards.greenhouse.io/nykaa" },
  { name: "Honasa (Mamaearth)", url: "https://honasa.turbohire.co/" },
  { name: "boAt", url: "https://www.boat-lifestyle.com/pages/careers" },
  { name: "Sugar Cosmetics", url: "https://sugarcosmetics.com/pages/careers" },
  { name: "Wow Skin Science", url: "https://www.wowskinscience.com/pages/careers" },
  { name: "Bombay Shaving Company", url: "https://bombayshavingcompany.com/pages/careers" },
  { name: "Plum Goodness", url: "https://www.plumgoodness.com/pages/careers" },
  { name: "Minimalist", url: "https://www.beminimalist.co/pages/careers" },
  { name: "mCaffeine", url: "https://mcaffeine.com/pages/careers" },
  { name: "The Man Company", url: "https://themancompany.com/pages/careers" },
  { name: "Noise", url: "https://gonoise.com/pages/careers" },
  { name: "Wakefit", url: "https://www.wakefit.co/careers" },
  { name: "Licious", url: "https://www.licious.in/careers" },
  { name: "Sirona", url: "https://www.sirona.in/pages/careers" },
  { name: "Traya Health", url: "https://traya.health/pages/careers" },

  // --- D2C brands — smaller / earlier-stage (worth watching closely, less competition) ---
  { name: "Just Herbs", url: "https://justherbs.in/pages/careers" },
  { name: "Arata", url: "https://arata.in/pages/careers" },
  { name: "Bare Anatomy", url: "https://bareanatomy.com/pages/careers" },
  { name: "The Moms Co", url: "https://themomsco.com/pages/careers" },
  { name: "Juicy Chemistry", url: "https://www.juicychemistry.com/pages/careers" },
  { name: "Disguise Cosmetics", url: "https://disguisecosmetics.com/pages/careers" },
  { name: "Kapiva", url: "https://www.kapiva.in/pages/careers" },
  { name: "OZiva", url: "https://www.oziva.in/pages/careers" },
  { name: "Slurrp Farm", url: "https://slurrpfarm.com/pages/careers" },
  { name: "The Whole Truth Foods", url: "https://thewholetruthfoods.com/pages/careers" },
  { name: "Yoga Bar", url: "https://yogabar.in/pages/careers" },
  { name: "Neeman's", url: "https://neemans.com/pages/careers" },

  // --- Full-service / digital marketing agencies (Mumbai-based or with Mumbai offices) ---
  { name: "Schbang", url: "https://schbang.com/careers/" },
  { name: "WATConsult", url: "https://www.watconsult.com/careers/" },
  { name: "Gozoop", url: "https://gozoop.com/careers/" },
  { name: "Kinnect", url: "https://kinnect.co.in/careers/" },
  { name: "FoxyMoron", url: "https://www.foxymoron.in/careers" },
  { name: "DigiChefs", url: "https://digichefs.com/careers/" },
  { name: "Riyo Advertising", url: "https://www.riyoadvertising.com/careers" },
  { name: "Matrix Bricks", url: "https://matrixbricks.com/careers" },

  // --- Influencer-marketing specialists / boutique agencies ---
  { name: "Chtrbox", url: "https://chtrbox.com/careers" },
  { name: "Confluencr", url: "https://confluencr.com/careers" },
  { name: "Monk-E", url: "https://www.monk-e.in/careers" },
  { name: "Kalakar House", url: "https://kalakarhouse.com/careers" },
  { name: "Panache Talents", url: "https://panachetalents.com/careers" },
  { name: "Sociobliss", url: "https://sociobliss.com/careers" },
  { name: "Social Panga", url: "https://www.socialpanga.com/careers" },
  { name: "Fruitbowl Digital", url: "https://fruitbowldigital.com/careers" },

  // --- Smaller / boutique agencies (higher signal-to-noise, less applicant competition) ---
  { name: "The Glitch", url: "https://theglitch.in/careers" },
  { name: "Third Eye Blind Productions", url: "https://thirdeyeblindproductions.com/careers" },
  { name: "Glad U Came", url: "https://gladucame.com/careers" },
  { name: "Pulpkey", url: "https://pulpkey.com/careers" },
  { name: "Brew My Idea", url: "https://brewmyidea.com/careers" },
];

/**
 * Generic fallback: fetches each career page and pulls out anything that
 * looks like a job listing link. These sites vary wildly in structure, so
 * this is intentionally loose — treat results as "check this page manually"
 * signals rather than fully parsed job objects. Greenhouse/Lever/Turbohire-
 * hosted boards (structured HTML) will parse cleanly; custom Shopify/agency
 * "careers" pages often won't return much and are worth a manual glance too.
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
          lower.includes("marketing") ||
          lower.includes("brand") ||
          lower.includes("content") ||
          lower.includes("influencer") ||
          lower.includes("social media") ||
          lower.includes("pr ") ||
          lower.includes("communications") ||
          lower.includes("growth") ||
          lower.includes("account manager") ||
          lower.includes("client servicing");
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
