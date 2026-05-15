#!/usr/bin/env node
/**
 * generate-audio.js
 *
 * Reads themes/questions from THEMES below and generates one .mp3 per
 * question + welcome/thanks transitions, using the ElevenLabs API.
 *
 * Output:  audio/<theme-slug>/{welcome,q1..q5,thanks}.mp3
 *
 * Run:  node generate-audio.js            # generate only missing files
 *       node generate-audio.js --force    # regenerate everything
 */

import fs from "node:fs";
import path from "node:path";

// --- Load .env (zero-dep tiny parser) ------------------------------------
const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_turbo_v2_5";

if (!API_KEY || !VOICE_ID) {
  console.error("❌ Missing ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID.");
  console.error("   Copy .env.example to .env and fill in your values.");
  process.exit(1);
}

// --- Voice settings (edit to taste) --------------------------------------
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.3,
  use_speaker_boost: true,
};

// --- Source of truth for themes & questions ------------------------------
// Keep in sync with THEMES in index.html. (Single-source if/when desired.)
const THEMES = {
  "vancouver-local": {
    welcome: "Welcome aboard. Let's chat about Vancouver.",
    thanks:  "Thanks for the chat. Enjoy the rest of your visit.",
    questions: [
      "What brought you to Vancouver?",
      "What's the best meal you've had here so far?",
      "What's one thing you wish you'd known before arriving?",
      "If you had one more day here, what would you do?",
      "Rate your trip so far, 1 to 10 — and why?",
    ],
  },
  "mood-music": {
    welcome: "Welcome aboard. Let's get into the mood.",
    thanks:  "Thanks for sharing. Have a great rest of your day.",
    questions: [
      "On a scale of 1 to 10, how's your day going?",
      "What's a song that matches your mood right now?",
      "What's the best thing that happened to you this week?",
      "If today had a color, what would it be?",
      "What are you looking forward to next?",
    ],
  },
  "life-snapshot": {
    welcome: "Welcome aboard. A few deeper questions for the ride.",
    thanks:  "Thanks for the chat. Take care out there.",
    questions: [
      "What do you do for work — and do you love it?",
      "What's something you've changed your mind about recently?",
      "What's a small thing that made you happy this week?",
      "If you could master one skill instantly, what would it be?",
      "What advice would you give yourself five years ago?",
    ],
  },
  "quick-five": {
    welcome: "Welcome aboard. Quick five questions for you.",
    thanks:  "Thanks. Have a great ride.",
    questions: [
      "Where are you headed?",
      "Business or pleasure?",
      "Coffee or tea?",
      "Best app on your phone right now?",
      "Anything I can do to make this ride better?",
    ],
  },
};

const FORCE = process.argv.includes("--force");

async function tts(text) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "xi-api-key": API_KEY,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: VOICE_SETTINGS,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs error ${res.status}: ${err}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  return buf;
}

async function generateOne(slug, kind, text) {
  const dir = path.join("audio", slug);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${kind}.mp3`);
  if (!FORCE && fs.existsSync(file)) {
    console.log(`  ↺  ${file} (exists, skipping)`);
    return { skipped: true, chars: 0 };
  }
  process.stdout.write(`  →  ${file} ...`);
  const buf = await tts(text);
  fs.writeFileSync(file, buf);
  console.log(` ✓ ${buf.length.toLocaleString()} bytes`);
  return { skipped: false, chars: text.length };
}

async function main() {
  console.log(`\nElevenLabs voice: ${VOICE_ID}`);
  console.log(`Model: ${MODEL}`);
  console.log(`Mode: ${FORCE ? "FORCE regenerate all" : "skip existing"}\n`);

  let totalChars = 0;
  let generated = 0;
  let skipped = 0;

  for (const [slug, t] of Object.entries(THEMES)) {
    console.log(`▸ ${slug}`);
    const jobs = [
      ["welcome", t.welcome],
      ...t.questions.map((q, i) => [`q${i + 1}`, q]),
      ["thanks", t.thanks],
    ];
    for (const [kind, text] of jobs) {
      try {
        const r = await generateOne(slug, kind, text);
        if (r.skipped) skipped++;
        else { generated++; totalChars += r.chars; }
      } catch (e) {
        console.error(`     ❌ ${e.message}`);
      }
    }
  }

  // ElevenLabs pricing (rough): ~$0.30 per 1000 chars on Starter, less on higher tiers.
  // Treat this as an upper-bound estimate.
  const estUsd = (totalChars / 1000) * 0.30;
  console.log(`\nDone. Generated ${generated}, skipped ${skipped}.`);
  console.log(`Characters used this run: ${totalChars.toLocaleString()}`);
  console.log(`Rough cost estimate (Starter tier): $${estUsd.toFixed(3)}`);
  console.log(`\nReload the app — passengers will now hear the new voice.`);
}

main().catch(e => { console.error(e); process.exit(1); });
