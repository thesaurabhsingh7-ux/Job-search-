// Candidate profile derived from Saurabh's CV.
// This is what job postings get scored against. Edit weights/keywords any time
// your target roles shift — no code changes needed elsewhere.

module.exports = {
  // Job titles you're targeting. Exact/partial title matches score highest.
  targetTitles: [
    "influencer marketing executive",
    "influencer marketing manager",
    "social media marketing executive",
    "content marketing executive",
    "marketing executive",
    "brand marketing executive",
    "assistant brand manager", // stretch target — scored but weighted lower
    "digital marketing executive",
    "creator partnerships",
    "brand partnerships",
  ],

  // Titles that are a stretch — still shown, but scored down slightly unless
  // other signals (D2C, influencer) are very strong.
  stretchTitles: ["assistant brand manager", "brand manager"],

  // Core skill/experience keywords from the CV. Each hit adds to the score.
  coreKeywords: [
    "influencer marketing",
    "influencer",
    "creator",
    "content marketing",
    "brand partnerships",
    "campaign management",
    "social media marketing",
    "d2c",
    "content strategy",
    "brand strategy",
    "copywriting",
    "instagram",
    "youtube",
    "creative brief",
    "paid social",
  ],

  // Industry/category signals — brands and categories you've actually worked in.
  categorySignals: [
    "beauty",
    "personal care",
    "skincare",
    "haircare",
    "d2c",
    "consumer tech",
    "fmcg",
    "wellness",
    "fashion",
  ],

  // Bonus: differentiator most candidates won't have.
  bonusKeywords: [
    { keyword: "web development", points: 5 },
    { keyword: "technical", points: 3 },
    { keyword: "shopify", points: 4 },
    { keyword: "startup", points: 3 },
  ],

  location: "Mumbai",
  // Locations you'd also accept beyond an exact Mumbai match
  acceptableLocations: ["mumbai", "remote", "navi mumbai", "thane", "hybrid"],

  minScoreToInclude: Number(process.env.MIN_SCORE || 40),
};
