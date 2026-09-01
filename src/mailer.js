const axios = require("axios");

function jobRowHtml(job) {
  return `
    <tr>
      <td style="padding:10px 8px;border-bottom:1px solid #eee;">
        <a href="${job.url}" style="font-weight:600;color:#1a1a1a;text-decoration:none;">${job.title}</a><br/>
        <span style="color:#555;font-size:13px;">${job.company} · ${job.location} · ${job.source}</span><br/>
        <span style="color:#999;font-size:12px;">Score: ${job.score} — ${job.reasons.join(", ")}</span>
      </td>
    </tr>`;
}

async function sendDigest(jobs) {
  if (!jobs.length) {
    console.log("[mailer] No new matching jobs — skipping email.");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[mailer] RESEND_API_KEY is not set — skipping email send.");
    return;
  }

  const sorted = [...jobs].sort((a, b) => b.score - a.score);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <h2 style="color:#1a1a1a;">${jobs.length} new job match${jobs.length > 1 ? "es" : ""} today</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${sorted.map(jobRowHtml).join("")}
      </table>
      <p style="color:#999;font-size:12px;margin-top:20px;">Sent by your job-finder script.</p>
    </div>`;

  try {
    await axios.post(
      "https://api.resend.com/emails",
      {
        from: "Job Finder <onboarding@resend.dev>",
        to: [process.env.DIGEST_TO],
        subject: `${jobs.length} new job match${jobs.length > 1 ? "es" : ""} — ${new Date().toLocaleDateString("en-IN")}`,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`[mailer] Sent digest with ${jobs.length} jobs via Resend.`);
  } catch (err) {
    console.error("[mailer] Resend API error:", err.response?.data || err.message);
    throw err;
  }
}

module.exports = { sendDigest };
