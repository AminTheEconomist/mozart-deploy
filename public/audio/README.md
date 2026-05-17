# AI-rendered audio for the Sheet Music player

When the user picks **🎤 AI Vocal (real choir)** from the instrument dropdown, the
player plays an MP3 from this folder instead of the synth. The cursor still walks
the score on the tempo clock for visual sync (it may drift slightly from the audio).

## Naming convention

```
public/audio/<work-slug>/<num>-<latin-slug>.mp3
```

Same pattern as `public/scores/`. Examples:

```
public/audio/tora-doost-daram/i-opening.mp3
public/audio/tora-doost-daram/ii-middle.mp3
public/audio/tora-doost-daram/iii-climax.mp3

public/audio/mozart-requiem/ii-kyrie.mp3
public/audio/mozart-requiem/viii-lacrimosa.mp3
```

If the file doesn't exist, the player does a HEAD probe and **disables the 🎤
AI Vocal option** in the dropdown with "not yet recorded" — no error, no broken state.

## How to generate one (Suno workflow)

1. Open <https://suno.com> and sign in.
2. Click **Create** → **Custom** mode.
3. **Style** — describe the choir + meter + mood. Keep under ~120 chars. Example for
   Tora Doost Daram Opening:

   ```
   Persian SATB a cappella choir, slow waltz 3/4 quarter=84, melancholic
   contemplative, mixed adult voices, subito piano humming opening then mp
   ```

4. **Lyrics** — paste the transliterated text from the score (Suno pronounces phonetically
   when given Latin script). Use `[bracket tags]` to shape the structure:

   ```
   [Intro: soft choir humming, 4 bars]
   mmm... mmm... mmm... mmm...

   [Verse: SATB four-part choir, mp dynamic, contemplative]
   Pooche jahaan hich
   Agar dustat nadaaram
   Ey kohan, pir-e jaavid
   Bornaa, to
   ```

5. Generate. Suno gives two versions — pick the cleaner one.
6. **Download** as MP3.
7. Rename to match the naming convention above and drop into the right folder.
8. Commit + push. Vercel deploys. The 🎤 option appears automatically.

## Credit (when persona is finalized)

Per `~/.claude/projects/-Users-amin-Desktop/memory/project_ai_choir_character.md`,
attribute the performer with a project-owned persona name (Nova / VocaCora Iran /
similar) rather than "Suno AI" in the user-facing UI. Track which sections were
rendered by which generation when iterating.
