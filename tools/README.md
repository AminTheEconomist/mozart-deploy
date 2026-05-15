# Work-generation pipeline

Adds a new musical work (any choral / orchestral piece) to the site in ~1 hour:
10 minutes writing a seed, ~30 seconds running the generator, 20-30 minutes
reviewing and editing the output.

## How it works

```
tools/seeds/<slug>.json     →   node tools/generate-work.mjs <slug>   →   content/works/<slug>.json
   (10 lines you write)          (calls Claude ~17 times in parallel)        (full bilingual content)
```

The generator reads your seed (composer, work title, movement list with mood
hints), then calls `claude-sonnet-4-5` once per movement plus once for themes
plus once for work-level UI strings — all in parallel — and writes a single
JSON file matching the same schema as the Mozart Requiem content already in
`src/content.js`.

## Add a new work in 3 steps

**1. Write a seed.** Copy the template and edit:

```bash
cp tools/seeds/_template.json tools/seeds/faure-requiem.json
$EDITOR tools/seeds/faure-requiem.json
```

Minimum fields the generator needs:

| Field | What it is |
|---|---|
| `slug` | URL-safe identifier (e.g. `faure-requiem`) |
| `composer.fa` / `composer.en` | Full name in both languages |
| `title.fa` / `title.en` | Work title in both languages |
| `year` | Year of composition |
| `key_signature` | Primary key (e.g. `D minor`) |
| `primary_color` | Hex color for accents (#RRGGBB) |
| `composer_note_for_claude` | 2-3 sentences telling Claude what makes this work distinct — Claude uses this to keep the meanings authentic |
| `audience` | The cultural register (default: secular Iranian-Canadian) |
| `movements[]` | One entry per movement with `num`, `latin`, `tempo_key`, `mood_hint`, `arc` (0-100, fearful→peaceful), `authorship` |

**2. Set your Anthropic API key**, then run the generator:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
npm run generate faure-requiem
```

Output:

```
▶ Generating "Requiem" (Gabriel Fauré)
  Slug: faure-requiem
  Movements: 7
  Model: claude-sonnet-4-5

→ Calling Claude in parallel for movements, themes, work strings...

  ✓ movement I (Introit et Kyrie) (4.2s, 1842↑ 1124↓)
  ✓ movement II (Offertoire) (4.8s, 1841↑ 1287↓)
  ✓ movement III (Sanctus) (3.6s, 1840↑ 891↓)
  ✓ movement IV (Pie Jesu) (4.1s, 1840↑ 1042↓)
  ✓ movement V (Agnus Dei) (4.5s, 1841↑ 1187↓)
  ✓ movement VI (Libera Me) (5.1s, 1841↑ 1356↓)
  ✓ movement VII (In Paradisum) (4.4s, 1841↑ 1198↓)
  ✓ themes (6.8s, 982↑ 1456↓)
  ✓ work strings (5.2s, 891↑ 987↓)

✓ Wrote content/works/faure-requiem.json
```

**3. Review and edit.** Open `content/works/faure-requiem.json` and read through:

- **Phonetics** — verify the stressed syllables (CAPITALS) match how you'd actually sing it.
- **Arc values** — Claude can be inconsistent here; tune them so the emotional curve makes sense.
- **Persian meanings** — check for Arabicisms or Shia-religious framing that slipped in.
- **English meanings** — make sure the voice matches your scholarship.
- **Notes** — these are 1-sentence facts; if Claude invented one, replace or remove.

## Cost

Each work costs roughly $0.50-$1.50 in Claude API calls (Sonnet 4.5). To go
cheaper, swap to Haiku:

```bash
GENERATOR_MODEL=claude-haiku-4-5 npm run generate faure-requiem
```

Haiku is ~10× cheaper but the meanings will be less nuanced. Worth using for
first drafts you'll heavily edit; Sonnet is better when you want generated
content to be close to publishable.

## What the schema looks like

A generated work file has three top-level sections:

```json
{
  "meta": { /* composer, title, year, primary_color, etc. */ },
  "work_strings": {
    "fa": { /* title1, title2, blurb, prologue[] */ },
    "en": { /* same */ }
  },
  "movements": [
    {
      "num": "I", "latin": "Introitus",
      "arc": 55, "color": "#4a6fa5",
      "key": { "fa": "...", "en": "..." },
      "mood": { "fa": "...", "en": "..." },
      "author": { "fa": "...", "en": "..." },
      "fa": { "title": "...", "sub": "...", "meaning": "...", "note": null },
      "en": { "title": "...", "sub": "...", "meaning": "...", "note": null },
      "text": [
        { "la": "...", "phon": "...", "fa": "...", "en": "..." }
      ]
    }
    // ... one per movement
  ],
  "themes": [
    {
      "icon": "☩", "latin": "requiem · sempiternam",
      "fa": { "name": "...", "desc": "..." },
      "en": { "name": "...", "desc": "..." }
    }
    // ... 7 themes
  ]
}
```

The Mozart Requiem (still in `src/content.js`) is the reference example —
generated works conform to the same shape so the app's views render any of
them identically.

## What comes next (Phase 2)

This pipeline produces work JSON files. The app currently only renders the
Mozart Requiem hardcoded in `src/content.js`. Phase 2 of the pipeline adds:

- A landing page at `/` listing all works in `content/works/`
- Hash-routed `#/works/<slug>` URLs that load the matching JSON
- Per-work primary color theming
- (Optional) a `vercel --prod` per-work deploy command

Until Phase 2 ships, you can already generate and review work content. The
JSON files are forward-compatible.
