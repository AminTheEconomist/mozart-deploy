// Vercel serverless function — POST /api/feedback
// Receives feedback from the FeedbackWidget, calls Claude to analyze it,
// and logs both the raw submission and Claude's structured analysis.
//
// Set ANTHROPIC_API_KEY in Vercel env vars to enable Claude analysis.
// Without it, the endpoint still works — just logs feedback without analysis.

import Anthropic from "@anthropic-ai/sdk";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const SYSTEM_PROMPT = `You are an assistant helping the creator of a bilingual (Persian/English) presentation website about Mozart's Requiem.

The site has 9 views the visitor can be on:
- interactive (dark exploration)
- poetic (parchment, spine layout — the DEFAULT view)
- museum (cream gallery rooms)
- cinematic (large, glowing, dramatic)
- minimal (clean, whitespace)
- editorial (magazine-style, drop caps)
- illuminated (spiritual, manuscript-style)
- performance (atmospheric: choir / hall / church image scaffold)
- sheet (sight-reading score with Latin phonetics)

The Requiem is translated in Persian as سرود روان (Avestan-rooted, secular). Visitors are Persian speakers and Canadian English speakers.

Your job: read each piece of visitor feedback, understand what they're really asking for, and produce strict JSON guidance the creator can act on. Be honest about category and priority — don't inflate.

Always reply with ONLY valid JSON, no prose around it.`;

async function analyzeWithClaude(record) {
  if (!client) return { skipped: "no_api_key" };

  const userMsg = `Visitor feedback: """${record.text}"""

Context at time of submission:
- View: ${record.view}
- Language UI: ${record.lang}
- Selected movement: ${record.movement || "none"}
- Screen width: ${record.screen_width || "unknown"}

Respond with strict JSON of this shape:
{
  "summary": "one short sentence in English",
  "category": "bug | feature_request | aesthetic | content | translation | praise | confusion | question | other",
  "priority": "low | medium | high",
  "language_used": "fa | en | mixed | other",
  "actionable": true | false,
  "concrete_actions": ["specific step 1", "specific step 2"],
  "tone": "brief tone/sentiment note",
  "reply_to_visitor": "what to say back to them, in their language, under 30 words"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMsg }],
    });
    const text = response.content[0]?.text || "";
    // Try to parse JSON, fall back to raw text if not parseable
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch {}
    }
    return { raw: text };
  } catch (e) {
    return { error: e?.message || String(e) };
  }
}

export default async function handler(req, res) {
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

  // Synchronously ask Claude what to make of this feedback.
  // ~3-8 seconds for a typical small Sonnet call; widget shows "Sending…" meanwhile.
  const claude_analysis = await analyzeWithClaude(record);

  const fullRecord = { ...record, claude_analysis };

  // Structured log — grep "[FEEDBACK]" in Vercel function logs to read everything.
  console.log("[FEEDBACK]", JSON.stringify(fullRecord));

  // Return a reply to show the visitor if Claude provided one
  return res.status(200).json({
    ok: true,
    reply: claude_analysis?.reply_to_visitor || null,
  });
}
