const profile = require("./profile");

/**
 * Scores a job posting 0-100+ against the candidate profile.
 * job = { title, company, location, description, source, url }
 */
function scoreJob(job) {
  const title = (job.title || "").toLowerCase();
  const desc = (job.description || "").toLowerCase();
  const loc = (job.location || "").toLowerCase();
  const text = `${title} ${desc}`;

  let score = 0;
  const reasons = [];

  // Title match — strongest signal
  const titleHit = profile.targetTitles.find((t) => title.includes(t));
  if (titleHit) {
    const isStretch = profile.stretchTitles.includes(titleHit);
    score += isStretch ? 20 : 35;
    reasons.push(`Title matches "${titleHit}"`);
  }

  // Core keyword hits in description
  let coreHits = 0;
  profile.coreKeywords.forEach((kw) => {
    if (text.includes(kw)) coreHits += 1;
  });
  score += Math.min(coreHits * 4, 30); // cap contribution
  if (coreHits > 0) reasons.push(`${coreHits} core skill match(es)`);

  // Category / brand-category signals
  let categoryHits = 0;
  profile.categorySignals.forEach((kw) => {
    if (text.includes(kw)) categoryHits += 1;
  });
  score += Math.min(categoryHits * 3, 15);
  if (categoryHits > 0) reasons.push(`${categoryHits} category match(es) (D2C/beauty/etc.)`);

  // Bonus differentiators
  profile.bonusKeywords.forEach(({ keyword, points }) => {
    if (text.includes(keyword)) {
      score += points;
      reasons.push(`Bonus: mentions "${keyword}"`);
    }
  });

  // Location check
  const locationOk = profile.acceptableLocations.some((l) => loc.includes(l));
  if (locationOk) {
    score += 15;
    reasons.push("Location matches");
  } else if (loc) {
    score -= 10; // penalize clearly-wrong-location postings rather than dropping them silently
    reasons.push("Location outside target area");
  }

  return { score: Math.round(score), reasons };
}

module.exports = { scoreJob };
