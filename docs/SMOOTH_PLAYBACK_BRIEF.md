# Smooth-Playback Engine — Brief

Self-contained brief for a fresh Claude Code session to build a dedicated
smooth-playback engine for the mozart-deploy Sheet Music view. This document
is the single source of truth — read this first, do NOT need to read prior
session transcripts.

## The problem

The current `src/SheetMusicPlayer.jsx` renders MusicXML via OSMD
(OpenSheetMusicDisplay) and drives playback with a JS `setTimeout` loop:

```js
const tick = () => {
  if (cursor.iterator.endReached) { ... onEnd(); return; }
  const dtMs = currentStepDurationMs();        // duration of current step
  playCurrentNotes(dtMs / 1000);                // schedule synth/soundfont notes
  setTimeout(() => { cursor.next(); tick(); }, dtMs);
};
```

A CSS `transition: left Xms linear` was added to OSMD's cursor `<img>` so it
glides between positions, but this is a band-aid. Real problems remaining:

1. **Cursor sync drifts from audio.** Audio is scheduled via Web Audio's
   `AudioContext.currentTime`; cursor advances via `setTimeout`. Browser timer
   jitter (especially when tab is backgrounded) makes them desync within seconds.
2. **No frame-accurate cursor position between notes.** The cursor jumps from
   note N to note N+1 with a CSS transition over the step duration. It's NOT
   computed from current playback time — it's a fire-and-forget animation
   that runs even if the audio is paused/slow/fast.
3. **Tempo changes mid-playback don't gracefully adjust the queue.** Stopping
   and restarting causes a clicky/stuttery experience.
4. **Per-voice mute happens at synth level**, fine — but when an MP3 (AI
   vocal) is used, there's no way to mute individual SATB voices because the
   MP3 is a mix.
5. **No way to seek** (click a measure to jump there). Cursor only walks forward.

## Goal

Build a `SmoothPlaybackEngine` component that:

- Renders the MusicXML notation (can keep using OSMD or use an alternative)
- Plays the audio (synth, soundfont, OR pre-rendered MP3) with **frame-accurate
  cursor sync** — cursor position interpolates between note positions based on
  current playback time, driven by `requestAnimationFrame` polling `AudioContext.currentTime`
- Tempo can change mid-playback without re-scheduling everything (use AudioContext's
  tempo-aware scheduling, e.g. Tone.js Transport, OR re-derive timestamps from a
  tempo function)
- Seek by clicking a measure
- Cursor glides continuously (not step-and-wait) — visually like Drumeo, Soundslice,
  flat.io, Sibelius play mode

## Constraints

- Browser only (no Electron, no native). Must work on **iOS Safari mobile** (this
  is the primary target — user tests on iPhone).
- Existing MusicXML files in `public/scores/<work-slug>/<num>-<latin-slug>.musicxml`
  must continue to work.
- Pre-rendered MP3s in `public/audio/<work-slug>/<num>-<latin-slug>.mp3` (when
  present) should be the audio source when AI Vocal is selected.
- Must integrate cleanly with the existing SheetMusicPlayer or **replace** it —
  the consumer (`src/views-new.jsx::ViewSheetMusic` and `src/views-extra.jsx::ViewScoreOnly`)
  imports `SheetMusicPlayer` with these props:
  ```jsx
  <SheetMusicPlayer
    musicXmlUrl
    audioUrl           // optional
    defaultTempo       // 80
    lang               // "fa" | "en"
    color              // accent hex
    autoplay           // boolean — start when ready
    onEnd              // called when score ends
    onAutoplayStarted  // called once after autoplay fires
    chrome             // "full" | "minimal" | "none"
  />
  ```
- Existing memory rules apply: see
  `~/.claude/projects/-Users-amin-Desktop/memory/lessons_mozart_deploy_pitfalls.md`
  (React hook ordering, Vercel alias drift, cache-stale defense via UpdateBanner,
  voice-input artifacts).

## Recommended approach (start here, iterate)

1. **Pre-compute the timeline at load.** Walk the MusicXML once, build an array
   of `[startTimeSec, endTimeSec, cursorX, cursorY, notes[]]` per step.
2. **Use Web Audio's AudioContext for scheduling.** Schedule all notes upfront
   with `oscillator.start(ctx.currentTime + offset)`. Pause via `ctx.suspend()`.
   Tempo changes = re-schedule remaining steps from current time.
3. **rAF loop polls `ctx.currentTime`** and interpolates cursor X/Y between
   the previous and next step. Linear interpolation in pixel space.
4. **For pre-rendered MP3:** use `<audio>.currentTime` as the timeline source
   instead of AudioContext. Then map MP3 time → cursor position via the same
   pre-computed timeline (with a one-time calibration step or a known mapping
   if the MP3 was generated at the same tempo as the score).
5. **Hide OSMD's built-in cursor** (`drawSlurs: true` etc options), render a
   custom positioned `<div>` on top of the OSMD SVG for cursor visualization.

## What's already in the repo to leverage

- `src/SheetMusicPlayer.jsx` — current player (the thing being replaced).
  Read this for: instrument selector, voice toggle, AI-vocal HEAD probe,
  chrome modes, props shape.
- `opensheetmusicdisplay` npm package — already installed. Use it for parsing
  + rendering the notation.
- `soundfont-player` — for MIDI samples (piano, choir, organ).
- `public/scores/tora-doost-daram/{i-opening,ii-middle,iii-climax}.musicxml`
  — three small test files (G minor, 3/4, ♩=84, SATB).
- `public/scores/mozart-requiem/{ii-kyrie,viii-lacrimosa}.musicxml`
  — larger real-world test files.

## Suggested deliverable

A self-contained component file:

```
src/SmoothPlaybackEngine.jsx
```

With the same prop shape as the existing SheetMusicPlayer. When ready, the
integration is a one-line swap in `src/views-new.jsx` and `src/views-extra.jsx`:

```diff
- import { SheetMusicPlayer } from "./SheetMusicPlayer.jsx";
+ import { SmoothPlaybackEngine as SheetMusicPlayer } from "./SmoothPlaybackEngine.jsx";
```

Or keep the old player and add the new one as an alternative
(`chrome="smooth"` or `engine="smooth"` prop).

## How to start the session

1. `cd ~/projects/mozart-deploy` (so the per-cwd memory loads — this is where
   the pitfalls + workflow rules live).
2. Create a worktree to keep this isolated from any UI work happening in
   parallel:
   ```bash
   git worktree add ../mozart-deploy-smooth-playback -b smooth-playback-engine
   cd ../mozart-deploy-smooth-playback
   claude
   ```
3. First prompt to the new session:
   > Read `docs/SMOOTH_PLAYBACK_BRIEF.md` and build the smooth-playback engine
   > per the spec. Test against `public/scores/tora-doost-daram/iii-climax.musicxml`
   > first (shortest file, fastest iteration). Push to the `smooth-playback-engine`
   > branch when each milestone works; no need to merge to `main` — the other
   > session will integrate.

## Integration plan (back in the original session)

Once the worktree session has `src/SmoothPlaybackEngine.jsx` working and pushed
to `origin/smooth-playback-engine`:

```bash
cd ~/projects/mozart-deploy
git fetch origin smooth-playback-engine
git checkout main
git cherry-pick origin/smooth-playback-engine~..origin/smooth-playback-engine
# or merge: git merge origin/smooth-playback-engine
```

Then the UI session swaps the import and tests on Vercel. Done.

## Success criteria (acceptance test)

Open `https://mozart-deploy.vercel.app` on iPhone Safari, switch to Tora →
Sheet view → press Play. Observe:

- [ ] Cursor moves **continuously** (sub-step pixel resolution, no jumps)
- [ ] Cursor position **matches** the audible note position (test by ear)
- [ ] Tempo slider adjustment is smooth, not clicky
- [ ] Switching instruments mid-play doesn't desync
- [ ] Clicking a measure jumps cursor + audio to that point
- [ ] Per-voice mute (Soprano/Alto/Tenor/Bass) works without affecting cursor
- [ ] Cursor remains accurate after backgrounding the tab for 30s and returning
- [ ] No console errors

When all boxes pass, this is done. Integration into main = a one-line import swap.
