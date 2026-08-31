const nodemailer = require("nodemailer");

function buildTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

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

  const transport = buildTransport();
  const sorted = [...jobs].sort((a, b) => b.score - a.score);

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;">
      <h2 style="color:#1a1a1a;">${jobs.length} new job match${jobs.length > 1 ? "es" : ""} today</h2>
      <table style="width:100%;border-collapse:collapse;">
        ${sorted.map(jobRowHtml).join("")}
      </table>
      <p style="color:#999;font-size:12px;margin-top:20px;">Sent by your job-finder script.</p>
    </div>`;

  await transport.sendMail({
    from: process.env.SMTP_USER,
    to: process.env.DIGEST_TO || process.env.SMTP_USER,
    subject: `${jobs.length} new job match${jobs.length > 1 ? "es" : ""} — ${new Date().toLocaleDateString("en-IN")}`,
    html,
  });

  console.log(`[mailer] Sent digest with ${jobs.length} jobs.`);
}

module.exports = { sendDigest };
