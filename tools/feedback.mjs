#!/usr/bin/env node
// Pull and pretty-print [FEEDBACK] entries from the Vercel function logs.
// Usage: npm run feedback

import { execSync } from "child_process";

const DOMAIN = "mozart-deploy.vercel.app";

let raw;
try {
  raw = execSync(`vercel logs ${DOMAIN} --json`, {
    encoding: "utf-8",
    maxBuffer: 20 * 1024 * 1024,
  });
} catch (e) {
  console.error("✗ Failed to run `vercel logs`. Are you logged in?");
  console.error("   Try: vercel whoami");
  console.error("   Or:  vercel login");
  process.exit(1);
}

const entries = raw
  .split("\n")
  .filter(l => l.trim() && l.includes("[FEEDBACK]"))
  .map(line => {
    try {
      const log = JSON.parse(line);
      const msg = log.message || "";
      const jsonStart = msg.indexOf("{");
      if (jsonStart === -1) return null;
      const payload = JSON.parse(msg.slice(jsonStart));
      return { ts: log.timestamp, ...payload };
    } catch {
      return null;
    }
  })
  .filter(Boolean)
  .sort((a, b) => a.ts - b.ts); // oldest first; newest at bottom

if (entries.length === 0) {
  console.log("\nNo feedback entries found in recent Vercel logs.");
  console.log("(Submit a test from the site, then re-run.)\n");
  process.exit(0);
}

const SEP = "─".repeat(72);
console.log(`\n${entries.length} feedback ${entries.length === 1 ? "entry" : "entries"}:\n`);

entries.forEach((e, i) => {
  const when = new Date(e.ts || e.received_at).toLocaleString("en-CA", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto",
  });
  console.log(SEP);
  console.log(`#${String(i + 1).padStart(2, " ")}   ${when}`);
  console.log(`      view: ${e.view}   |   lang: ${e.lang}   |   movement: ${e.movement || "—"}`);
  if (e.screen_width) console.log(`      screen: ${e.screen_width}px   |   ip: ${e.ip || "—"}`);
  console.log();
  // Indent the message body
  const wrapped = (e.text || "").split("\n").map(l => `      ${l}`).join("\n");
  console.log(wrapped);
  console.log();

  const a = e.claude_analysis;
  if (a) {
    if (a.skipped === "no_api_key") {
      console.log(`      ⓘ Claude analysis skipped — set ANTHROPIC_API_KEY on Vercel to enable.`);
    } else if (a.error) {
      console.log(`      ✗ Claude error: ${a.error}`);
    } else if (a.summary) {
      console.log(`      Claude:`);
      console.log(`        ▸ ${a.summary}`);
      console.log(`        category: ${a.category}   priority: ${a.priority}   actionable: ${a.actionable}`);
      if (Array.isArray(a.concrete_actions) && a.concrete_actions.length) {
        console.log(`        actions:`);
        a.concrete_actions.forEach(x => console.log(`          • ${x}`));
      }
      if (a.reply_to_visitor) console.log(`        reply shown: "${a.reply_to_visitor}"`);
      if (a.tone) console.log(`        tone: ${a.tone}`);
    } else if (a.raw) {
      console.log(`      Claude (unparsed): ${a.raw.slice(0, 200)}…`);
    }
  }
  console.log();
});

console.log(SEP);
console.log(`\nTo view in the dashboard:`);
console.log(`  https://vercel.com/amintheeconomists-projects/mozart-deploy/logs\n`);
