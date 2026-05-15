#!/usr/bin/env node
// ─── WORK GENERATOR ──────────────────────────────────────────────────────────
// Usage: node tools/generate-work.mjs <seed-slug>
// Reads:  tools/seeds/<slug>.json   (seed file with composer + movement list)
// Writes: content/works/<slug>.json (full bilingual work content)
//
// For each movement in the seed, calls Claude in parallel to generate:
//   - Latin text (the canonical liturgical lines for that section)
//   - Ecclesiastical Latin phonetics (CAPITALS = stressed syllable)
//   - Persian translation (secular register, Avestan-rooted vocabulary)
//   - English translation
//   - A 2-3 paragraph interpretive meaning
//   - An optional historical/musical note
//
// Then in parallel, generates:
//   - 7 cross-cutting themes for the work
//   - Work-specific UI strings (hero blurb, prologue, conclusion)
//
// Claude API key required: set ANTHROPIC_API_KEY in your shell or .env
// Cost per work: ~$0.50-$1.50 on claude-sonnet-4-5

import Anthropic from "@anthropic-ai/sdk";
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");

const MODEL = process.env.GENERATOR_MODEL || "claude-sonnet-4-5";

// ─── ARGS ────────────────────────────────────────────────────────────────────
const slug = process.argv[2];
if (!slug) {
  console.error("Usage: node tools/generate-work.mjs <seed-slug>");
  console.error("Available seeds:");
  try {
    const seeds = readdirSync(resolve(PROJECT_ROOT, "tools/seeds"))
      .filter(f => f.endsWith(".json") && !f.startsWith("_"));
    seeds.forEach(s => console.error(`  - ${s.replace(".json", "")}`));
  } catch {}
  process.exit(1);
}

const seedPath = resolve(PROJECT_ROOT, "tools/seeds", `${slug}.json`);
if (!existsSync(seedPath)) {
  console.error(`✗ Seed not found: ${seedPath}`);
  console.error(`  Copy tools/seeds/_template.json → tools/seeds/${slug}.json and edit it.`);
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("✗ ANTHROPIC_API_KEY not set in environment.");
  console.error("  Get one at https://console.anthropic.com/settings/keys");
  console.error("  Then: export ANTHROPIC_API_KEY=sk-ant-...");
  process.exit(1);
}

const seed = JSON.parse(readFileSync(seedPath, "utf-8"));
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

console.log(`\n▶ Generating "${seed.title.en}" (${seed.composer.en})`);
console.log(`  Slug: ${slug}`);
console.log(`  Movements: ${seed.movements.length}`);
console.log(`  Model: ${MODEL}\n`);

// ─── FEW-SHOT EXAMPLE FROM MOZART ────────────────────────────────────────────
// Read Mozart's content.js as a reference for output style and quality.
// We extract one fully-fleshed movement as the few-shot example.
const MOZART_EXAMPLE = {
  num: "I", latin: "Introitus", arc: 55, color: "#4a6fa5",
  key: { fa: "ر مینور · آداجیو", en: "D minor · Adagio" },
  mood: { fa: "باشکوه", en: "Majestic" },
  author: { fa: "موتزارت — کامل", en: "Mozart — complete" },
  fa: {
    title: "درآمد", sub: "ورود به مراسم — نخستین دعا",
    meaning: "موتزارت مراسم را نه با وحشت، بلکه با دعا آغاز می‌کند — دو خواسته که کل اثر را شکل می‌دهند: آرامش و نور.\n\nآخرین جمله عمیق‌ترین حقیقت این مراسم را بیان می‌کند: «تمام آدمیان نزد تو خواهند آمد.» هیچ استثنایی وجود ندارد. سفری که در پیش است سفر همگان است.",
    note: "این تنها موومانی است که موتزارت پیش از مرگش به‌طور کامل ارکسترال کرد. هر نتی که می‌شنوید از اوست.",
  },
  en: {
    title: "Introit", sub: "The Entrance to the Mass — the First Prayer",
    meaning: "Mozart begins the Mass not with terror, but with prayer — the two desires that shape the entire work: peace and light.\n\nThe final line speaks the deepest truth of this Mass: \"all humanity shall come to you.\" There is no exception. The journey ahead is everyone's journey.",
    note: "This is the only movement Mozart fully orchestrated before his death. Every note you hear is his.",
  },
  text: [
    {
      la: "Requiem aeternam dona eis, Domine,\net lux perpetua luceat eis.",
      phon: "REH-kwee-em eh-TEHR-nahm DOH-nah EH-ees, DOH-mee-neh,\net looks pehr-PEH-too-ah LOO-cheh-aht EH-ees.",
      fa: "پروردگارا، آرامش ابدی به آنان ببخش،\nو نور جاودان بر آنان بتابد.",
      en: "Eternal rest grant unto them, O Lord,\nand let perpetual light shine upon them.",
    },
  ],
};

// ─── PROMPTS ─────────────────────────────────────────────────────────────────
const SHARED_CONTEXT = `You are generating bilingual (Persian/English) content for a presentation of "${seed.title.en}" by ${seed.composer.en} (${seed.year || "n.d."}).

CRITICAL STYLE GUIDE:
- Phonetics use Italian Ecclesiastical Latin, CAPITALS for stressed syllables (e.g. "REH-kwee-em eh-TEHR-nahm DOH-nah").
- Persian uses secular, Avestan-rooted vocabulary where possible (روان not روح, گذر not عبور). NOT Shia/religious register. Audience: Iranian-Canadian.
- Meanings are 2-3 short paragraphs, literary, interpretive — not academic. Each paragraph separated by \\n\\n.
- Notes (when present) are 1 sentence of striking historical or musical fact.
- English translations of Latin follow the standard liturgical tradition (e.g. "Eternal rest grant unto them, O Lord").

Composer context: ${seed.composer_note_for_claude || "(no extra context given)"}
Audience: ${seed.audience || "Iranian-Canadian, secular spiritual register"}

REFERENCE EXAMPLE (Mozart Introit) — match this style and depth:
${JSON.stringify(MOZART_EXAMPLE, null, 2)}`;

function movementPrompt(mv) {
  return `Generate the full bilingual content for one movement of ${seed.title.en}.

Movement seed:
- Number: ${mv.num}
- Latin/Italian section name: "${mv.latin}"
- Tempo/Key hint: "${mv.tempo_key || "unknown"}"
- Mood hint: "${mv.mood_hint || "interpret from text"}"
- Arc value (0 fearful → 100 peaceful): ${mv.arc ?? "interpret"}
- Authorship: "${mv.authorship || "composer — complete"}"

Use the canonical Latin liturgical text for this section. Generate phonetics, fa/en translations, meaning (2-3 paragraphs), and optionally a note.

Respond with ONLY a valid JSON object of this exact shape (no markdown, no prose around it):
{
  "num": "${mv.num}",
  "latin": "${mv.latin}",
  "arc": ${mv.arc ?? 50},
  "color": "${seed.primary_color}",
  "key": { "fa": "...", "en": "..." },
  "mood": { "fa": "...", "en": "..." },
  "author": { "fa": "...", "en": "..." },
  "fa": {
    "title": "...",
    "sub": "...",
    "meaning": "...",
    "note": null
  },
  "en": {
    "title": "...",
    "sub": "...",
    "meaning": "...",
    "note": null
  },
  "text": [
    {
      "la": "...",
      "phon": "...",
      "fa": "...",
      "en": "..."
    }
  ]
}`;
}

const themesPrompt = `Generate 7 cross-cutting themes for ${seed.title.en} by ${seed.composer.en}. Themes are recurring concepts that thread through the entire work — words or images that carry the whole meaning.

For each theme:
- icon: a single unicode symbol that evokes it (e.g. ☩ ✦ ♡ ▲ ⚖ → ↔)
- latin: 1-3 Latin words from the work that embody it, with " · " separator
- fa: { name (Persian, 1-2 words), desc (2-3 sentences in Persian, evocative not academic) }
- en: { name (English, 1-2 words), desc (2-3 sentences in English) }

Respond with ONLY a valid JSON array of 7 theme objects, no prose around it.

Example from Mozart Requiem (do not reuse — invent for ${seed.title.en}):
{
  "icon": "☩", "latin": "requiem · sempiternam",
  "fa": { "name": "آرامش", "desc": "نخستین کلمه مراسم..." },
  "en": { "name": "Peace", "desc": "The first word of the Mass..." }
}`;

const stringsPrompt = `Generate work-specific UI strings for the presentation site of ${seed.title.en} by ${seed.composer.en} (${seed.year}).

Audience: Iranian-Canadian, bilingual, secular spiritual register.

Respond with ONLY a JSON object of this shape (no prose):
{
  "fa": {
    "title1": "گذر روح",
    "title2": "از ${seed.title.fa} ${seed.composer.fa.split(" ").slice(-1)[0]}",
    "blurb": "(2-sentence evocative summary in Persian, about 30-40 words)",
    "prologueEyebrow": "پیش‌درآمد",
    "closingTitle": "(1-sentence Persian headline that captures the work's essence)",
    "prologue": [
      "(opening paragraph about the composer, year, circumstances of composition - in Persian, 2-3 sentences)",
      "(middle paragraph about the work itself - in Persian, 2-3 sentences)",
      "(closing paragraph drawing the reader in - in Persian, 1-2 sentences)"
    ]
  },
  "en": {
    "title1": "The Soul's Passage",
    "title2": "Through ${seed.composer.en.split(" ").slice(-1)[0]}'s ${seed.title.en}",
    "blurb": "(parallel 2-sentence English version of the blurb)",
    "prologueEyebrow": "Prologue",
    "closingTitle": "(English version of the closing title)",
    "prologue": [
      "(English version of opening paragraph)",
      "(English version of middle paragraph)",
      "(English version of closing paragraph)"
    ]
  }
}`;

// ─── CLAUDE CALL HELPER ──────────────────────────────────────────────────────
async function askClaude(userPrompt, label) {
  const start = Date.now();
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SHARED_CONTEXT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = response.content[0]?.text || "";
    const jsonMatch = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (!jsonMatch) throw new Error("no JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    const dt = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`  ✓ ${label} (${dt}s, ${response.usage.input_tokens}↑ ${response.usage.output_tokens}↓)`);
    return parsed;
  } catch (e) {
    console.error(`  ✗ ${label}: ${e.message}`);
    throw e;
  }
}

// ─── ORCHESTRATE ─────────────────────────────────────────────────────────────
async function main() {
  console.log("→ Calling Claude in parallel for movements, themes, work strings...\n");

  const movementJobs = seed.movements.map(mv =>
    askClaude(movementPrompt(mv), `movement ${mv.num} (${mv.latin})`)
  );

  const [movements, themes, work_strings] = await Promise.all([
    Promise.all(movementJobs),
    askClaude(themesPrompt, "themes"),
    askClaude(stringsPrompt, "work strings"),
  ]);

  const output = {
    meta: {
      slug,
      composer: seed.composer,
      title: seed.title,
      catalogue: seed.catalogue,
      year: seed.year,
      key_signature: seed.key_signature,
      tradition: seed.tradition,
      primary_color: seed.primary_color,
      generated_at: new Date().toISOString(),
      generator_model: MODEL,
    },
    work_strings,
    movements,
    themes,
  };

  const outPath = resolve(PROJECT_ROOT, "content/works", `${slug}.json`);
  if (!existsSync(dirname(outPath))) mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(output, null, 2));

  console.log(`\n✓ Wrote ${outPath}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review the generated content — Claude is good but not perfect.`);
  console.log(`     Pay special attention to: phonetics, arc values, meanings.`);
  console.log(`  2. After Phase 2 of the pipeline ships, this work will be live at`);
  console.log(`     https://mozart-deploy.vercel.app/#/works/${slug}`);
}

main().catch(err => {
  console.error(`\n✗ Generation failed: ${err.message}`);
  process.exit(1);
});
