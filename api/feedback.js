// Vercel serverless function — POST /api/feedback
// Receives feedback submissions from the FeedbackWidget on the live site.
// Logs structured records that show up in Vercel's function logs dashboard.
// Future: forward to GitHub Issues, Slack, email, or a proper DB.

export default async function handler(req, res) {
  // CORS for local dev
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const text = (body.text || "").toString().slice(0, 4000).trim();
  if (!text) return res.status(400).json({ error: "Empty feedback" });

  const record = {
    text,
    view: body.view || "unknown",
    lang: body.lang || "unknown",
    movement: body.movement || null,
    submitted_at: body.timestamp || new Date().toISOString(),
    received_at: new Date().toISOString(),
    user_agent: (body.userAgent || "").slice(0, 200),
    screen_width: body.screenWidth || null,
    ip: req.headers["x-forwarded-for"] || req.headers["x-real-ip"] || null,
  };

  // Structured log line — easy to grep in Vercel function logs
  console.log("[FEEDBACK]", JSON.stringify(record));

  return res.status(200).json({ ok: true });
}
