#!/usr/bin/env node
/**
 * server.js — passenger-app local server
 *
 *   Static files: index.html, audio/, etc. served from this folder.
 *   API:
 *     GET  /api/context  → driver context.md + whether `claude` is reachable
 *     POST /api/analyze  → { session, external? } → insights JSON
 *     POST /api/patterns → { sessions: [...] } → cross-ride patterns
 *
 * Auth: invokes the `claude` CLI (Claude Code) as a subprocess. Uses your
 *       Max subscription via the CLI's OAuth login — no Anthropic API key.
 *
 *       One-time setup:  run `claude /login` in a terminal once and pick
 *       "Sign in with Claude" (your Max account).
 *
 * Run:  npm start
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5174);
const ROOT = __dirname;

// Path to the `claude` CLI (override with env CLAUDE_BIN if needed)
const CLAUDE_BIN = process.env.CLAUDE_BIN || "/opt/homebrew/bin/claude";
const MODEL = process.env.CLAUDE_MODEL || "";  // empty = let claude pick default

// --- tiny .env loader (still useful for ElevenLabs vars) -----------------
function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
loadEnv(path.join(ROOT, ".env"));

// --- static file serving --------------------------------------------------
const MIME = {
  ".html": "text/html; charset=utf-8", ".js": "application/javascript",
  ".css":  "text/css", ".mp3": "audio/mpeg", ".json": "application/json",
  ".md":   "text/markdown; charset=utf-8", ".png": "image/png",
  ".svg":  "image/svg+xml", ".ico": "image/x-icon",
};
function serveStatic(req, res) {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel === "/" || rel.endsWith("/")) rel = path.posix.join(rel, "index.html");
  const filePath = path.normalize(path.join(ROOT, rel));
  if (!filePath.startsWith(ROOT)) return send(res, 403, "forbidden");
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return send(res, 404, "not found");
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(filePath).pipe(res);
}
function send(res, code, body) { res.writeHead(code, { "Content-Type": "text/plain" }); res.end(body); }
function sendJson(res, code, body) {
  res.writeHead(code, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(body));
}
async function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", c => { data += c; if (data.length > 5_000_000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(data || "{}")); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

// --- claude subprocess invocation -----------------------------------------
function claudeAvailable() {
  return fs.existsSync(CLAUDE_BIN);
}

async function callClaude(userPrompt, options = {}) {
  return new Promise((resolve, reject) => {
    const args = ["-p", "--output-format", "json"];
    if (options.systemPrompt) args.push("--system-prompt", options.systemPrompt);
    if (options.model || MODEL) args.push("--model", options.model || MODEL);
    const child = spawn(CLAUDE_BIN, args, { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", d => stdout += d.toString());
    child.stderr.on("data", d => stderr += d.toString());
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0 && !stdout) return reject(new Error(`claude exited ${code}: ${stderr || "(no stderr)"}`));
      try {
        const wrap = JSON.parse(stdout);
        if (wrap.is_error) {
          return reject(new Error(wrap.result || "claude returned an error"));
        }
        resolve({
          text:       wrap.result || "",
          usage:      wrap.usage,
          modelUsage: wrap.modelUsage,
          durationMs: wrap.duration_ms,
          costUsd:    wrap.total_cost_usd,
        });
      } catch (e) {
        reject(new Error(`could not parse claude output: ${e.message}\n${stdout.slice(0, 800)}`));
      }
    });
    child.stdin.write(userPrompt);
    child.stdin.end();
  });
}

function extractJson(text) {
  let s = (text || "").trim();
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  const start = s.indexOf("{");
  const end   = s.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error(`no JSON object in response: ${text.slice(0, 300)}`);
  return JSON.parse(s.slice(start, end + 1));
}

// --- prompts --------------------------------------------------------------
const INSTRUCTIONS = `
You're an assistant for a Vancouver Uber driver. After a passenger answers 5
questions through a voice questionnaire, produce concise, actionable insights
tailored to the driver's style and goals.

Rules:
- Be specific, warm, practical. No moralizing.
- A skipped question carries no signal — don't infer from absence.
- Recommend at most 3 conversation topics; best-fit first.
- Route suggestions must respect time-sensitive passengers (e.g. airport runs).
- If external data is provided (Uber/Maps/Tesla/Grok), use it.

Output ONLY a JSON object — no prose, no markdown fences — with these fields:
{
  "mood_score":          1-10,
  "mood_summary":        "string",
  "tip_likelihood":      "low" | "medium" | "high",
  "tip_reasoning":       "string",
  "conversation_topics": ["string", ...],
  "avoid_topics":        ["string", ...],
  "route_suggestions":   ["string", ...],
  "follow_up_question":  "string",
  "summary":             "string"
}
`.trim();

const PATTERNS_INSTRUCTIONS = `
You analyse ride patterns across many passenger questionnaire sessions for an
Uber driver. Find genuine signal, surface concrete changes, and propose new
questions worth testing. Be honest about weak signal when the sample is small.

Output ONLY a JSON object — no prose, no markdown fences — with these fields:
{
  "top_themes_by_engagement":  ["string", ...],
  "common_passenger_types":    ["string", ...],
  "best_engaging_questions":   ["string", ...],
  "underperforming_questions": ["string", ...],
  "mood_trend":                "string",
  "avg_tip_likelihood":        "string",
  "driver_action_items":       ["string", ...],
  "suggested_new_questions":   ["string", ...]
}
`.trim();

// --- helpers --------------------------------------------------------------
function loadContext() {
  const file = path.join(ROOT, "context.md");
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "(no driver context configured)";
}

function formatSession(session) {
  const out = [];
  out.push(`Theme: ${session.themeName || session.theme || "(unknown)"}`);
  out.push(`When: ${session.timestamp || "(unknown)"}`);
  if (session.external) {
    out.push("");
    out.push("External context (Uber/Maps/Tesla/Grok, etc.):");
    out.push(JSON.stringify(session.external, null, 2));
  }
  out.push("");
  out.push("Conversation:");
  (session.responses || []).forEach((r, i) => {
    out.push(`${i + 1}. Q: ${r.question}`);
    out.push(`   A: ${r.skipped ? "(skipped)" : (r.answer || "(empty)")}`);
  });
  return out.join("\n");
}

// --- API handlers ---------------------------------------------------------
async function handleAnalyze(req, res) {
  if (!claudeAvailable()) {
    return sendJson(res, 500, { error: `claude CLI not found at ${CLAUDE_BIN}. Install with: npm install -g @anthropic-ai/claude-code` });
  }
  const body = await readJson(req);
  if (!body.session) return sendJson(res, 400, { error: "session required" });

  const driverCtx = loadContext();
  const userText  = formatSession(body.session);
  const systemPrompt = `${INSTRUCTIONS}\n\n--- Driver context ---\n${driverCtx}`;

  try {
    const r = await callClaude(userText, { systemPrompt });
    const insights = extractJson(r.text);
    return sendJson(res, 200, { insights, usage: r.usage, durationMs: r.durationMs, costUsd: r.costUsd });
  } catch (e) {
    return sendJson(res, 502, { error: e.message });
  }
}

async function handlePatterns(req, res) {
  if (!claudeAvailable()) {
    return sendJson(res, 500, { error: `claude CLI not found at ${CLAUDE_BIN}` });
  }
  const body = await readJson(req);
  if (!Array.isArray(body.sessions) || body.sessions.length === 0) {
    return sendJson(res, 400, { error: "sessions array required" });
  }
  const driverCtx = loadContext();
  const userText  = "Sessions:\n\n" + body.sessions.map(formatSession).join("\n\n---\n\n");
  const systemPrompt = `${PATTERNS_INSTRUCTIONS}\n\n--- Driver context ---\n${driverCtx}`;

  try {
    const r = await callClaude(userText, { systemPrompt });
    const patterns = extractJson(r.text);
    return sendJson(res, 200, { patterns, usage: r.usage, durationMs: r.durationMs, costUsd: r.costUsd, session_count: body.sessions.length });
  } catch (e) {
    return sendJson(res, 502, { error: e.message });
  }
}

// --- request router -------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      return res.end();
    }
    if (req.url === "/api/context"  && req.method === "GET")  {
      return sendJson(res, 200, {
        context: loadContext(),
        apiKeyPresent: claudeAvailable(),
        model: MODEL || "default (Claude Code)",
        backend: "claude-cli (uses your Max subscription)"
      });
    }
    if (req.url === "/api/analyze"  && req.method === "POST") return handleAnalyze(req, res);
    if (req.url === "/api/patterns" && req.method === "POST") return handlePatterns(req, res);
    serveStatic(req, res);
  } catch (e) {
    console.error("[server error]", e);
    sendJson(res, 500, { error: e.message || String(e) });
  }
});

server.listen(PORT, () => {
  console.log(`\n▸ Passenger app:  http://localhost:${PORT}`);
  console.log(`  Backend:        claude CLI (${CLAUDE_BIN})`);
  console.log(`  Claude CLI:     ${claudeAvailable() ? "✓ found" : "✗ NOT FOUND — install with: npm install -g @anthropic-ai/claude-code"}`);
  console.log(`  Auth:           uses Claude Code's OAuth (your Max subscription).`);
  console.log(`                  Run \`claude /login\` once if you haven't yet.`);
  console.log(`\n  Ctrl-C to stop.\n`);
});
