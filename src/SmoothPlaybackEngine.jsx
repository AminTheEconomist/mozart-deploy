// ─── SMOOTH PLAYBACK ENGINE ───────────────────────────────────────────────────
// Drop-in replacement for SheetMusicPlayer with frame-accurate cursor sync.
//
// Architecture:
//  1. After OSMD renders the MusicXML, walk the cursor once to pre-compute a
//     timeline: every step's [startSec, durationSec, cursorX, cursorY, notes…]
//     at the score's base tempo. Stored in timelineRef (immutable until reload).
//  2. Playback is driven by Web Audio's AudioContext clock (or, for AI-vocal
//     mode, by the <audio> element's currentTime). A requestAnimationFrame
//     loop polls the clock every frame, computes the current timeline-second,
//     and interpolates cursor X/Y between adjacent steps for sub-step pixel
//     resolution. This is what makes the cursor glide instead of jump.
//  3. A look-ahead scheduler (~150ms window) hands notes to Web Audio just
//     before they need to sound — no audible timer jitter even when the tab is
//     backgrounded, and tempo changes only affect the next ~150ms of notes.
//  4. Tempo changes rebaseline the (ctx-time ↔ timeline-time) mapping with a
//     ~40ms cross-fade so playback stays smooth, not clicky.
//  5. Per-voice mute uses one persistent GainNode per part — toggles take
//     effect in 20ms regardless of what's already scheduled.
//  6. Click on the score → finds the nearest step on that line → seeks both
//     cursor and audio there.
//  7. OSMD's built-in cursor is hidden; a custom <div> overlay is positioned
//     via direct transform writes inside the rAF loop (bypasses React).

import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import Soundfont from "soundfont-player";
import { useWork } from "./WorkContext.jsx";

// Instrument options — match SheetMusicPlayer so the UI is interchangeable.
const INSTRUMENTS = [
  { key: "synth",                label: { fa: "سینتیسایزر",    en: "Synth (no download)" } },
  { key: "ai-vocal",             label: { fa: "🎤 صدای واقعی (AI)", en: "🎤 AI Vocal (real choir)" }, requiresAudio: true },
  { key: "acoustic_grand_piano", label: { fa: "پیانو",          en: "Piano" } },
  { key: "choir_aahs",           label: { fa: "کر (آه‌آه)",    en: "Choir (Aahs)" } },
  { key: "voice_oohs",           label: { fa: "صدای انسانی (اوه‌اوه)", en: "Voice (Oohs)" } },
  { key: "church_organ",         label: { fa: "ارگ کلیسا",      en: "Church Organ" } },
  { key: "string_ensemble_1",    label: { fa: "گروه زهی",       en: "Strings" } },
];

// How far ahead the scheduler queues notes. 150ms is generous enough to survive
// the occasional dropped rAF frame (≤16ms) yet short enough that tempo changes
// feel responsive.
const LOOKAHEAD_SEC = 0.15;

// Cross-fade applied when canceling scheduled audio (pause, seek, tempo change).
// Long enough to avoid clicks; short enough to feel instant.
const FADE_SEC = 0.04;

// Synth voice timbre — additive sine harmonics with a unified vibrato LFO.
// Matches SheetMusicPlayer.buildVoice so the synth sound is identical.
const HARMONICS = [
  { mult: 1, amp: 1.00 },
  { mult: 2, amp: 0.35 },
  { mult: 3, amp: 0.18 },
  { mult: 4, amp: 0.08 },
  { mult: 5, amp: 0.04 },
];

export function SmoothPlaybackEngine({
  musicXmlUrl,
  audioUrl,
  defaultTempo = 80,
  lang = "fa",
  color = "#b8893a",
  autoplay = false,
  onEnd,
  onAutoplayStarted,
  chrome = "full",
}) {
  // ─── DOM refs ────────────────────────────────────────────────────────────
  const containerRef = useRef(null);       // OSMD render target + click surface
  const cursorElRef = useRef(null);        // Custom cursor overlay div
  const aiAudioRef = useRef(null);         // <audio> for AI-vocal MP3

  // ─── OSMD + Web Audio refs ───────────────────────────────────────────────
  const osmdRef = useRef(null);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const partGainsRef = useRef([]);         // one GainNode per part for fast mute
  const instrumentRef = useRef(null);      // active Soundfont instance
  const instrumentCacheRef = useRef({});   // cache by instrument key

  // ─── Playback timing refs (no re-renders) ────────────────────────────────
  const timelineRef = useRef([]);          // [{startSec, durationSec, cursorX, …}]
  const baseTempoRef = useRef(defaultTempo);
  const tempoScaleRef = useRef(1);         // baseTempo / currentTempo
  const playbackStartCtxTimeRef = useRef(0);
  const playbackStartTimelineSecRef = useRef(0);
  const currentTimelineSecRef = useRef(0);
  const nextScheduleIdxRef = useRef(0);
  const currentStepIdxRef = useRef(0);
  const scheduledVoicesRef = useRef([]);   // for cancel-on-seek/tempo/pause
  const rafIdRef = useRef(0);
  // setInterval safety net — rAF gets throttled to 0 fps in backgrounded /
  // headless browser tabs (iOS Safari can suspend it entirely), so the audio
  // scheduler MUST have a non-rAF heartbeat or notes stop being queued and
  // playback dies. The interval also keeps the cursor moving in hidden tabs
  // (where rAF is suspended) at ~30fps, so when the user returns the cursor
  // is already in the right place rather than catching up with a visible jump.
  const tickIntervalRef = useRef(0);

  // ─── Mirror state into refs for use inside non-React functions ──────────
  const partsStateRef = useRef([]);
  const instrumentStateRef = useRef("synth");
  const audioOnRef = useRef(true);
  const isAiVocalRef = useRef(false);
  const playingRef = useRef(false);

  // ─── UI state ────────────────────────────────────────────────────────────
  const [status, setStatus] = useState("loading"); // loading | ready | error | missing
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(defaultTempo);
  const [zoom, setZoom] = useState(1);
  const [audioOn, setAudioOn] = useState(true);
  const [instrument, setInstrument] = useState("choir_aahs");
  const [instrumentLoading, setInstrumentLoading] = useState(false);
  const [parts, setParts] = useState([]);
  const [aiAudioAvailable, setAiAudioAvailable] = useState(false);

  const { STR } = useWork();
  const t = STR[lang].sheetPlayer || FALLBACK_STRINGS[lang];
  const isAiVocal = instrument === "ai-vocal" && !!audioUrl && aiAudioAvailable;

  // ─── Keep refs synced with state so non-React code reads latest values ──
  useEffect(() => { partsStateRef.current = parts; }, [parts]);
  useEffect(() => { instrumentStateRef.current = instrument; }, [instrument]);
  useEffect(() => { audioOnRef.current = audioOn; }, [audioOn]);
  useEffect(() => { isAiVocalRef.current = isAiVocal; }, [isAiVocal]);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  // ─── Probe AI-vocal MP3 availability (HEAD once per audioUrl) ───────────
  useEffect(() => {
    if (!audioUrl) { setAiAudioAvailable(false); return; }
    let cancelled = false;
    fetch(audioUrl, { method: "HEAD" })
      .then(r => { if (!cancelled) setAiAudioAvailable(r.ok); })
      .catch(() => { if (!cancelled) setAiAudioAvailable(false); });
    return () => { cancelled = true; };
  }, [audioUrl]);

  // Fall back to synth if AI-vocal was selected but no MP3 for this movement
  useEffect(() => {
    if (instrument === "ai-vocal" && !aiAudioAvailable) setInstrument("synth");
  }, [aiAudioAvailable]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── OSMD: load, render, build timeline ─────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !musicXmlUrl) { setStatus("missing"); return; }
    setStatus("loading");

    const osmd = new OpenSheetMusicDisplay(containerRef.current, {
      autoResize: true,
      backend: "svg",
      drawTitle: false,
      drawSubtitle: false,
      drawComposer: false,
      drawCredits: false,
      drawPartNames: true,
      drawMeasureNumbers: true,
      // Show OSMD's cursor briefly during timeline build so we can read its
      // positions; we hide it (display:none) right after.
      cursorsOptions: [{ type: 0, color, alpha: 0.7, follow: false }],
    });
    osmdRef.current = osmd;

    osmd.load(musicXmlUrl)
      .then(() => {
        osmd.zoom = zoom;
        osmd.render();

        // Detect parts (Soprano/Alto/Tenor/Bass for SATB)
        const instruments = osmd.sheet?.Instruments || osmd.sheet?.instruments || [];
        const partList = instruments.map((inst, idx) => ({
          name: inst.Name || inst.NameLabel?.text || inst.nameLabel?.text || inst.Label || inst.Id || `Part ${idx + 1}`,
          enabled: true,
        }));
        setParts(partList);
        partsStateRef.current = partList;

        // Use the score's notated tempo if present, otherwise the prop default.
        // userStartTempoInBPM is set when MusicXML has a metronome marking.
        const scoreTempo =
          osmd.sheet?.userStartTempoInBPM
          || osmd.sheet?.DefaultStartTempoInBpm
          || osmd.sheet?.defaultStartTempoInBpm
          || defaultTempo;
        baseTempoRef.current = scoreTempo;
        setTempo(scoreTempo);
        tempoScaleRef.current = 1;

        // Build timeline (cursor walk reads cursorElement positions)
        const tl = buildTimeline(osmd, scoreTempo);
        timelineRef.current = tl;
        currentStepIdxRef.current = 0;
        nextScheduleIdxRef.current = 0;
        playbackStartTimelineSecRef.current = 0;
        currentTimelineSecRef.current = 0;

        // Hide OSMD's built-in cursor — our overlay div takes over.
        try {
          const el = getCursorEl(osmd, containerRef.current);
          if (el) el.style.display = "none";
        } catch {}

        // Position custom cursor at step 0
        updateCursorVisual(0, /*direct=*/true);
        setStatus("ready");
      })
      .catch((err) => {
        console.warn("OSMD load failed for", musicXmlUrl, err);
        setStatus("error");
      });

    return () => {
      cancelAnimationFrame(rafIdRef.current);
      try { osmd.clear(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [musicXmlUrl, color]);

  // ─── Zoom change → re-render OSMD → rebuild timeline coords ─────────────
  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd || status !== "ready") return;
    const wasPlaying = playingRef.current;
    const resumeAtSec = currentTimelineSecRef.current;
    if (wasPlaying) {
      cancelScheduledFuture(0);
      cancelAnimationFrame(rafIdRef.current);
    }
    osmd.zoom = zoom;
    try {
      osmd.render();
      const el = getCursorEl(osmd, containerRef.current);
      if (el) el.style.display = "none";
    } catch {}
    // Note durations don't change with zoom, only pixel positions — but we
    // rebuild the full timeline for simplicity (cheap; OSMD already walked it).
    const tl = buildTimeline(osmd, baseTempoRef.current);
    timelineRef.current = tl;
    // Restore play position
    const idx = findStepIdxAtSec(tl, resumeAtSec);
    currentStepIdxRef.current = idx;
    updateCursorVisual(resumeAtSec);
    if (wasPlaying) {
      playbackStartTimelineSecRef.current = resumeAtSec;
      const ctx = audioCtxRef.current;
      if (ctx) playbackStartCtxTimeRef.current = ctx.currentTime;
      nextScheduleIdxRef.current = idx;
      startPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  // ─── Soundfont instrument load ──────────────────────────────────────────
  useEffect(() => {
    if (instrument === "synth" || instrument === "ai-vocal") {
      instrumentRef.current = null;
      return;
    }
    const cached = instrumentCacheRef.current[instrument];
    if (cached) { instrumentRef.current = cached; return; }
    const ctx = ensureAudio();
    if (!ctx) return;
    setInstrumentLoading(true);
    Soundfont.instrument(ctx, instrument, { soundfont: "MusyngKite" })
      .then(inst => {
        instrumentCacheRef.current[instrument] = inst;
        instrumentRef.current = inst;
        setInstrumentLoading(false);
      })
      .catch(err => {
        console.warn("Soundfont load failed for", instrument, err);
        setInstrumentLoading(false);
        setInstrument("synth");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument]);

  // ─── Tempo change → cross-fade rebaseline (synth path only) ─────────────
  useEffect(() => {
    const newScale = baseTempoRef.current / Math.max(1, tempo);
    const oldScale = tempoScaleRef.current;
    if (playingRef.current && !isAiVocalRef.current) {
      const ctx = audioCtxRef.current;
      if (ctx) {
        // Compute where we are NOW using the old scale
        const elapsedCtx = ctx.currentTime - playbackStartCtxTimeRef.current;
        const cur = playbackStartTimelineSecRef.current + elapsedCtx / oldScale;
        cancelScheduledFuture(FADE_SEC);
        playbackStartCtxTimeRef.current = ctx.currentTime + FADE_SEC;
        playbackStartTimelineSecRef.current = cur;
        currentTimelineSecRef.current = cur;
        tempoScaleRef.current = newScale;
        nextScheduleIdxRef.current = findStepIdxAtSec(timelineRef.current, cur);
        return;
      }
    }
    tempoScaleRef.current = newScale;
  }, [tempo]);

  // ─── Autoplay on ready ──────────────────────────────────────────────────
  useEffect(() => {
    if (autoplay && status === "ready" && !playing) {
      ensureAudio();
      setPlaying(true);
      onAutoplayStarted?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, status]);

  // ─── playing → start/stop the engine ────────────────────────────────────
  useEffect(() => {
    if (status !== "ready") return;
    if (playing) {
      startPlayback();
    } else {
      stopPlayback();
    }
    return () => {
      cancelAnimationFrame(rafIdRef.current);
      clearInterval(tickIntervalRef.current);
      cancelScheduledFuture(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, status]);

  // ─── Instrument hot-swap while playing ──────────────────────────────────
  useEffect(() => {
    if (!playingRef.current || status !== "ready") return;
    // Cancel current synth notes; new ones get scheduled from the look-ahead
    cancelScheduledFuture(FADE_SEC);
    const ctx = audioCtxRef.current;
    if (isAiVocal) {
      const a = aiAudioRef.current;
      if (a) {
        a.currentTime = currentTimelineSecRef.current;
        a.play().catch(() => {});
      }
    } else {
      // Restart from current position
      if (ctx) {
        playbackStartCtxTimeRef.current = ctx.currentTime + FADE_SEC;
        playbackStartTimelineSecRef.current = currentTimelineSecRef.current;
        nextScheduleIdxRef.current = findStepIdxAtSec(
          timelineRef.current,
          currentTimelineSecRef.current
        );
      }
      // Pause the AI audio if we were on it
      const a = aiAudioRef.current;
      if (a) { try { a.pause(); } catch {} }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instrument]);

  // ─── Apply per-voice mute via per-part gain nodes ───────────────────────
  useEffect(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    ensurePartGains();
    const now = ctx.currentTime;
    parts.forEach((p, i) => {
      const g = partGainsRef.current[i];
      if (g) {
        g.gain.cancelScheduledValues(now);
        g.gain.linearRampToValueAtTime(p.enabled ? 1 : 0, now + 0.02);
      }
    });
  }, [parts]);

  // ─── AI audio end → stop + notify ───────────────────────────────────────
  useEffect(() => {
    const a = aiAudioRef.current;
    if (!a) return;
    const onAudioEnd = () => {
      if (isAiVocalRef.current) {
        setPlaying(false);
        onEnd?.();
      }
    };
    a.addEventListener("ended", onAudioEnd);
    return () => a.removeEventListener("ended", onAudioEnd);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onEnd]);

  // ─── Audio context init (lazy, on user gesture) ─────────────────────────
  function ensureAudio() {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      masterGainRef.current = master;
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();
    ensurePartGains();
    return ctx;
  }

  // ─── Lazy-create per-part gain nodes as parts appear ────────────────────
  function ensurePartGains() {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;
    const need = partsStateRef.current.length || 1;
    while (partGainsRef.current.length < need) {
      const g = ctx.createGain();
      const idx = partGainsRef.current.length;
      const enabled = partsStateRef.current[idx]?.enabled !== false;
      g.gain.value = enabled ? 1 : 0;
      g.connect(master);
      partGainsRef.current.push(g);
    }
  }

  // ─── Timeline build (walk OSMD cursor, read coords + durations) ─────────
  function buildTimeline(osmd, baseTempo) {
    const cursor = osmd.cursor;
    try { cursor.reset(); } catch {}
    try { cursor.show(); } catch {}
    const tl = [];
    let timeSec = 0;
    const beatSec = 60 / baseTempo; // duration of one quarter at base tempo
    let safety = 0;
    while (!cursor.iterator.endReached && safety < 50000) {
      safety++;
      const el = getCursorEl(osmd, containerRef.current);
      const x = el ? (parseFloat(el.style.left) || 0) : 0;
      const y = el ? (parseFloat(el.style.top) || 0) : 0;
      // OSMD sets cursor height via the HTML `height` attribute, not CSS.
      // Fall back to style.height, then to a sensible default.
      const h = el
        ? (Number(el.getAttribute("height")) || parseFloat(el.style.height) || el.height || 40)
        : 40;

      const entries = cursor.iterator.CurrentVoiceEntries
        || cursor.iterator.currentVoiceEntries
        || [];

      let minFraction = 1;
      const notes = [];
      for (const ve of entries) {
        const partIdx = getPartIndex(ve, osmd);
        const veNotes = ve.Notes || ve.notes || [];
        for (const note of veNotes) {
          const len = note.length || note.Length;
          const real = len && (len.realValue ?? len.RealValue);
          if (typeof real === "number" && real > 0) {
            minFraction = Math.min(minFraction, real);
          }
          const midi = noteToMidi(note);
          if (midi != null) notes.push({ midi, partIdx });
        }
      }
      if (minFraction === 1) minFraction = 0.25;
      const dt = minFraction * 4 * beatSec;

      const measureIdx =
        cursor.iterator.CurrentMeasureIndex
        ?? cursor.iterator.currentMeasureIndex
        ?? 0;

      tl.push({
        index: tl.length,
        startSec: timeSec,
        durationSec: dt,
        cursorX: x,
        cursorY: y,
        cursorH: h,
        notes,
        measureIdx,
      });
      timeSec += dt;
      try { cursor.next(); } catch { break; }
    }
    try { cursor.reset(); } catch {}
    return tl;
  }

  // ─── Cursor visual update (called from rAF; direct DOM write) ───────────
  // arg: timelineSec OR step idx (when `direct` is true).
  function updateCursorVisual(timelineSec, direct = false) {
    const tl = timelineRef.current;
    const el = cursorElRef.current;
    if (!tl.length || !el) return;
    let idx = currentStepIdxRef.current;
    let interp = false;
    let curSec = 0;
    if (direct) {
      idx = Math.max(0, Math.min(tl.length - 1, timelineSec | 0));
      currentStepIdxRef.current = idx;
      curSec = tl[idx].startSec;
    } else {
      // Move idx to the latest step whose startSec ≤ timelineSec
      while (idx < tl.length - 1 && tl[idx + 1].startSec <= timelineSec) idx++;
      while (idx > 0 && tl[idx].startSec > timelineSec) idx--;
      currentStepIdxRef.current = idx;
      curSec = timelineSec;
      interp = true;
    }

    const curr = tl[idx];
    const next = tl[idx + 1];
    let x = curr.cursorX, y = curr.cursorY, h = curr.cursorH;

    if (interp && next) {
      // Detect line break: if the next step is on a different system (y jumped
      // down by more than half a cursor height) we snap rather than fly across.
      const isLineBreak =
        next.cursorY > curr.cursorY + curr.cursorH * 0.5
        || (next.cursorY > curr.cursorY + 8 && next.cursorX < curr.cursorX - 50);
      if (!isLineBreak) {
        const span = (next.startSec - curr.startSec) || curr.durationSec || 1;
        const tFrac = Math.max(0, Math.min(1, (curSec - curr.startSec) / span));
        x = curr.cursorX + (next.cursorX - curr.cursorX) * tFrac;
        y = curr.cursorY + (next.cursorY - curr.cursorY) * tFrac;
        h = curr.cursorH + (next.cursorH - curr.cursorH) * tFrac;
      }
    }
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    el.style.height = `${h}px`;
    el.style.display = "block";
  }

  // ─── Playback control ───────────────────────────────────────────────────
  function startPlayback() {
    const ctx = ensureAudio();
    if (!ctx) return;
    const tl = timelineRef.current;
    if (!tl.length) return;

    // If cursor is at end, restart from beginning
    const resumeSec = (playbackStartTimelineSecRef.current >= (tl[tl.length - 1].startSec + tl[tl.length - 1].durationSec))
      ? 0
      : playbackStartTimelineSecRef.current;

    if (isAiVocalRef.current) {
      const a = aiAudioRef.current;
      if (a) {
        try { a.currentTime = resumeSec; } catch {}
        a.play().catch((e) => { console.warn("AI audio play failed", e); });
      }
      playbackStartTimelineSecRef.current = resumeSec;
      currentTimelineSecRef.current = resumeSec;
    } else {
      playbackStartCtxTimeRef.current = ctx.currentTime;
      playbackStartTimelineSecRef.current = resumeSec;
      currentTimelineSecRef.current = resumeSec;
      nextScheduleIdxRef.current = findStepIdxAtSec(tl, resumeSec);
    }
    // Cursor + scheduler tick. Two parallel sources keep us robust:
    //   • requestAnimationFrame — smooth 60fps cursor when tab is visible
    //   • setInterval @ ~30Hz   — keeps audio scheduler and cursor advancing
    //                             even when rAF is throttled (background tab,
    //                             headless browser, iOS Safari suspend).
    cancelAnimationFrame(rafIdRef.current);
    clearInterval(tickIntervalRef.current);
    const tickFn = () => {
      playbackTick();
      if (playingRef.current) {
        rafIdRef.current = requestAnimationFrame(tickFn);
      }
    };
    rafIdRef.current = requestAnimationFrame(tickFn);
    tickIntervalRef.current = setInterval(playbackTick, 33);
  }

  function stopPlayback() {
    cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = 0;
    clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = 0;
    // Save where we are so the next start picks up here
    const ctx = audioCtxRef.current;
    if (isAiVocalRef.current && aiAudioRef.current) {
      try {
        playbackStartTimelineSecRef.current = aiAudioRef.current.currentTime;
        currentTimelineSecRef.current = aiAudioRef.current.currentTime;
        aiAudioRef.current.pause();
      } catch {}
    } else if (ctx) {
      const elapsedCtx = ctx.currentTime - playbackStartCtxTimeRef.current;
      const cur = playbackStartTimelineSecRef.current + elapsedCtx / tempoScaleRef.current;
      playbackStartTimelineSecRef.current = cur;
      currentTimelineSecRef.current = cur;
    }
    cancelScheduledFuture(FADE_SEC);
  }

  // ─── Tick: read clock, interpolate cursor, schedule look-ahead ──────────
  // Called from both rAF (smooth 60fps when visible) and setInterval (always,
  // every ~33ms). Idempotent — running twice per frame is harmless because
  // currentTimelineSec is recomputed from the audio clock each call, and the
  // scheduler walks nextScheduleIdxRef monotonically forward.
  function playbackTick() {
    if (!playingRef.current) return;
    const tl = timelineRef.current;
    if (!tl.length) return;

    let cur;
    if (isAiVocalRef.current) {
      const a = aiAudioRef.current;
      if (!a) return;
      cur = a.currentTime;
    } else {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      const elapsedCtx = ctx.currentTime - playbackStartCtxTimeRef.current;
      cur = playbackStartTimelineSecRef.current + elapsedCtx / tempoScaleRef.current;
    }
    currentTimelineSecRef.current = cur;

    const lastStep = tl[tl.length - 1];
    const endSec = lastStep.startSec + lastStep.durationSec;
    if (cur >= endSec) {
      updateCursorVisual(endSec, false);
      // Reset to start so the next Play begins from the top
      currentStepIdxRef.current = 0;
      playbackStartTimelineSecRef.current = 0;
      currentTimelineSecRef.current = 0;
      setPlaying(false);
      onEnd?.();
      return;
    }

    updateCursorVisual(cur, false);

    if (!isAiVocalRef.current && audioOnRef.current) {
      schedulerTick();
    }
    // No re-queue here — both the rAF loop in startPlayback and the setInterval
    // call playbackTick on their own schedules.
  }

  // ─── Look-ahead scheduler ───────────────────────────────────────────────
  function schedulerTick() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const tl = timelineRef.current;
    const now = ctx.currentTime;
    const horizon = now + LOOKAHEAD_SEC;
    while (nextScheduleIdxRef.current < tl.length) {
      const step = tl[nextScheduleIdxRef.current];
      const ctxStart = playbackStartCtxTimeRef.current
        + (step.startSec - playbackStartTimelineSecRef.current) * tempoScaleRef.current;
      if (ctxStart > horizon) break;
      const ctxDuration = step.durationSec * tempoScaleRef.current;
      const ctxEnd = ctxStart + ctxDuration;
      if (ctxEnd > now + 0.005) {
        scheduleStep(step, Math.max(ctxStart, now + 0.005), ctxDuration);
      }
      nextScheduleIdxRef.current++;
    }
  }

  // ─── Schedule one timeline step's notes ─────────────────────────────────
  function scheduleStep(step, ctxStart, ctxDuration) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const useSynth = instrumentStateRef.current === "synth";
    const inst = useSynth ? null : instrumentRef.current;
    ensurePartGains();
    for (const note of step.notes) {
      const partIdx = note.partIdx ?? 0;
      const dest = partGainsRef.current[partIdx] || masterGainRef.current;
      if (!dest) continue;
      if (inst) {
        try {
          const handle = inst.play(note.midi, ctxStart, {
            duration: ctxDuration,
            gain: 0.5,
            destination: dest,
          });
          scheduledVoicesRef.current.push({
            type: "sf", handle, ctxStart, ctxEnd: ctxStart + ctxDuration,
          });
        } catch (e) { /* ignore single-note failures */ }
      } else {
        const freq = 440 * Math.pow(2, (note.midi - 69) / 12);
        const voice = buildVoice(ctx, freq, ctxStart, ctxDuration, dest);
        scheduledVoicesRef.current.push({
          type: "synth", voice, ctxStart, ctxEnd: ctxStart + ctxDuration,
        });
      }
    }
    // Trim played-out entries opportunistically
    if (scheduledVoicesRef.current.length > 256) {
      const cutoff = ctx.currentTime - 0.5;
      scheduledVoicesRef.current = scheduledVoicesRef.current.filter(v => v.ctxEnd > cutoff);
    }
  }

  function buildVoice(ctx, freq, startTime, durationSec, dest) {
    const master = ctx.createGain();
    master.connect(dest);
    const peak = 0.07;
    const attack = 0.09;
    const release = Math.min(0.25, durationSec * 0.4);
    master.gain.setValueAtTime(0, startTime);
    master.gain.linearRampToValueAtTime(peak, startTime + attack);
    master.gain.setValueAtTime(peak, startTime + Math.max(attack + 0.02, durationSec - release));
    master.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 5;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 8;
    lfo.connect(lfoDepth);

    const oscs = HARMONICS.map(({ mult, amp }) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      lfoDepth.connect(osc.detune);
      const hg = ctx.createGain();
      hg.gain.value = amp;
      osc.connect(hg).connect(master);
      return osc;
    });

    oscs.forEach(o => { o.start(startTime); o.stop(startTime + durationSec + 0.12); });
    lfo.start(startTime);
    lfo.stop(startTime + durationSec + 0.12);

    return { oscs, lfo, master };
  }

  // ─── Cancel everything scheduled into the (near) future ─────────────────
  function cancelScheduledFuture(fadeSec) {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    const cutoff = now + (fadeSec || 0);
    const remaining = [];
    for (const sv of scheduledVoicesRef.current) {
      if (sv.ctxEnd < now) continue;
      try {
        if (sv.type === "sf" && sv.handle?.stop) {
          sv.handle.stop(cutoff);
        } else if (sv.type === "synth" && sv.voice) {
          const { oscs, lfo, master } = sv.voice;
          if (master) {
            master.gain.cancelScheduledValues(now);
            master.gain.setValueAtTime(master.gain.value, now);
            master.gain.linearRampToValueAtTime(0, cutoff);
          }
          oscs?.forEach(o => { try { o.stop(cutoff + 0.02); } catch {} });
          if (lfo) { try { lfo.stop(cutoff + 0.02); } catch {} }
        }
      } catch {}
    }
    scheduledVoicesRef.current = remaining;
  }

  // ─── Seek by step / measure / click ─────────────────────────────────────
  function seekToStep(idx) {
    const tl = timelineRef.current;
    if (!tl[idx]) return;
    const wasPlaying = playingRef.current;
    if (wasPlaying) cancelScheduledFuture(FADE_SEC);
    currentStepIdxRef.current = idx;
    const sec = tl[idx].startSec;
    playbackStartTimelineSecRef.current = sec;
    currentTimelineSecRef.current = sec;
    const ctx = audioCtxRef.current;
    if (ctx) playbackStartCtxTimeRef.current = ctx.currentTime + (wasPlaying ? FADE_SEC : 0);
    nextScheduleIdxRef.current = idx;
    if (isAiVocalRef.current && aiAudioRef.current) {
      try { aiAudioRef.current.currentTime = sec; } catch {}
    }
    updateCursorVisual(idx, /*direct=*/true);
  }

  function handleScoreClick(e) {
    if (status !== "ready" || !containerRef.current) return;
    // Only seek on actual notation clicks — avoid eating clicks on overlay widgets
    if (e.target && e.target.closest && e.target.closest("button,input,select,label")) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + containerRef.current.scrollLeft;
    const clickY = e.clientY - rect.top + containerRef.current.scrollTop;
    const tl = timelineRef.current;
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < tl.length; i++) {
      const s = tl[i];
      // Restrict to steps whose cursor vertical span contains the click Y
      const yTop = s.cursorY;
      const yBot = s.cursorY + s.cursorH;
      if (clickY < yTop - 8 || clickY > yBot + 8) continue;
      const d = Math.abs(clickX - s.cursorX);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    if (bestIdx < 0) return; // no step on that line
    seekToStep(bestIdx);
  }

  // ─── Reset to start ─────────────────────────────────────────────────────
  function reset() {
    const wasPlaying = playingRef.current;
    setPlaying(false);
    // Defer the seek to after stopPlayback has run (next tick)
    setTimeout(() => {
      seekToStep(0);
      if (wasPlaying) setPlaying(true);
    }, 60);
  }

  // ─── UI handlers ────────────────────────────────────────────────────────
  const handlePlayToggle = () => {
    ensureAudio();
    setPlaying(p => !p);
  };
  const togglePart = (idx) => {
    setParts(prev => prev.map((p, i) => i === idx ? { ...p, enabled: !p.enabled } : p));
  };
  const setAllParts = (enabled) => {
    setParts(prev => prev.map(p => ({ ...p, enabled })));
  };

  // ─── RENDER ─────────────────────────────────────────────────────────────
  return (
    <div className="sm-player-card" style={{ background: "#fafaf7", border: "1px solid #d5d0c4", padding: "1.5rem 1.5rem 1rem" }}>
      {chrome === "minimal" && (
        <div style={{
          display: "flex", gap: ".75rem", alignItems: "center", justifyContent: "center",
          marginBottom: "1rem", paddingBottom: ".85rem", borderBottom: "1px solid #e5e0d4",
          direction: lang === "fa" ? "rtl" : "ltr",
        }}>
          <button
            onClick={handlePlayToggle}
            disabled={status !== "ready"}
            style={{ ...btnStyle(status === "ready", color, playing), padding: ".75rem 1.6rem", fontSize: ".95rem" }}
          >
            {playing ? `■ ${t.pause}` : `▶ ${t.play}`}
          </button>
          <button onClick={reset} disabled={status !== "ready"} style={btnStyle(status === "ready", "#666", false)}>
            ⟲ {t.reset}
          </button>
          <button
            onClick={() => setAudioOn(a => !a)}
            title={audioOn ? t.muteLabel : t.unmuteLabel}
            style={{ ...btnStyle(true, audioOn ? color : "#999", false), padding: ".7rem 1rem", minWidth: 0 }}
          >
            {audioOn ? "🔊" : "🔇"}
          </button>
        </div>
      )}

      {chrome === "full" && (
        <div className="sm-player-controls" style={{
          display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap",
          marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e0d4",
          direction: lang === "fa" ? "rtl" : "ltr",
        }}>
          <button onClick={handlePlayToggle} disabled={status !== "ready"} style={btnStyle(status === "ready", color, playing)}>
            {playing ? `■ ${t.pause}` : `▶ ${t.play}`}
          </button>
          <button onClick={reset} disabled={status !== "ready"} style={btnStyle(status === "ready", "#666", false)}>
            ⟲ {t.reset}
          </button>
          <button
            onClick={() => setAudioOn(a => !a)}
            title={audioOn ? t.muteLabel : t.unmuteLabel}
            style={{ ...btnStyle(true, audioOn ? color : "#999", false), padding: ".6rem .9rem", minWidth: 0 }}
          >
            {audioOn ? "🔊" : "🔇"}
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontFamily: "Inter,sans-serif", fontSize: ".82rem", color: "#444" }}>
            <span style={{ minWidth: 50 }}>{t.tempo}:</span>
            <input
              type="range"
              min="30" max="180" value={tempo}
              onChange={(e) => setTempo(parseInt(e.target.value, 10))}
              disabled={isAiVocal}
              style={{ width: 160, accentColor: color, opacity: isAiVocal ? 0.5 : 1 }}
            />
            <span style={{ minWidth: 64, fontWeight: 600, color: color }}>{tempo} BPM</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontFamily: "Inter,sans-serif", fontSize: ".82rem", color: "#444" }}>
            <span style={{ minWidth: 50 }}>{t.zoom}:</span>
            <input type="range" min="0.5" max="2" step="0.1" value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))} style={{ width: 100, accentColor: color }} />
            <span style={{ minWidth: 40, fontWeight: 600, color: color }}>{Math.round(zoom * 100)}%</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontFamily: "Inter,sans-serif", fontSize: ".82rem", color: "#444" }}>
            <span style={{ minWidth: 60 }}>{t.instrument}:</span>
            <select
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              disabled={instrumentLoading}
              style={{
                fontFamily: lang === "fa" ? "Vazirmatn,Inter,sans-serif" : "Inter,sans-serif",
                fontSize: ".82rem", padding: ".4rem .6rem",
                border: `1px solid ${color}66`, background: "#fff", color: "#1a1a1a",
                borderRadius: 4, cursor: instrumentLoading ? "wait" : "pointer", minWidth: 140,
              }}
            >
              {INSTRUMENTS.map(i => (
                <option key={i.key} value={i.key} disabled={i.requiresAudio && !aiAudioAvailable}>
                  {i.label[lang]}{i.requiresAudio && !aiAudioAvailable ? " — " + t.aiVocalMissing : ""}
                </option>
              ))}
            </select>
            {instrumentLoading && (
              <span style={{ fontSize: ".72rem", color: color, fontStyle: "italic" }}>{t.instrumentLoading}…</span>
            )}
          </div>

          {parts.length > 1 && (
            <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flexWrap: "wrap", fontFamily: "Inter,sans-serif", fontSize: ".82rem", color: "#444" }}>
              <span style={{ minWidth: 50 }}>{t.voices}:</span>
              {parts.map((p, i) => (
                <label key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: ".3rem",
                  padding: ".3rem .55rem",
                  border: `1px solid ${p.enabled ? color : "#ccc"}`,
                  borderRadius: 4,
                  background: p.enabled ? `${color}11` : "#f5f5f2",
                  color: p.enabled ? "#1a1a1a" : "#999",
                  cursor: isAiVocal ? "not-allowed" : "pointer",
                  opacity: isAiVocal ? 0.4 : 1,
                  userSelect: "none", transition: "all .15s",
                  fontFamily: lang === "fa" ? "Vazirmatn,Inter,sans-serif" : "Inter,sans-serif",
                }}>
                  <input
                    type="checkbox" checked={p.enabled}
                    onChange={() => togglePart(i)}
                    disabled={isAiVocal}
                    style={{ accentColor: color, margin: 0 }}
                  />
                  <span style={{ fontSize: ".8rem" }}>{p.name}</span>
                </label>
              ))}
              <button
                onClick={() => setAllParts(parts.every(p => p.enabled) ? false : true)}
                disabled={isAiVocal}
                title={parts.every(p => p.enabled) ? t.voicesNone : t.voicesAll}
                style={{
                  background: "transparent", border: "1px solid #ddd", color: "#888",
                  padding: ".3rem .55rem", fontSize: ".72rem", cursor: isAiVocal ? "not-allowed" : "pointer",
                  borderRadius: 4, opacity: isAiVocal ? 0.4 : 1,
                  fontFamily: lang === "fa" ? "Vazirmatn,Inter,sans-serif" : "Inter,sans-serif",
                }}
              >
                {parts.every(p => p.enabled) ? t.voicesNone : t.voicesAll}
              </button>
            </div>
          )}
        </div>
      )}

      {audioUrl && <audio ref={aiAudioRef} src={audioUrl} preload="auto" playsInline />}

      <div style={{ position: "relative", minHeight: 240, overflow: "auto", maxHeight: "70vh" }}>
        {status === "loading" && (
          <div style={statusBoxStyle}>
            <p style={{ fontFamily: "Inter,sans-serif", color: "#888" }}>{t.loading}…</p>
          </div>
        )}
        {status === "error" && (
          <div style={statusBoxStyle}>
            <p style={{ fontFamily: "Inter,sans-serif", color: "#b85b3a", marginBottom: ".5rem", fontWeight: 600 }}>{t.errorTitle}</p>
            <p style={{ fontFamily: "Inter,sans-serif", color: "#666", fontSize: ".88rem", maxWidth: 480, margin: "0 auto" }}>{t.errorBody}</p>
            <code style={{ display: "block", marginTop: ".75rem", fontSize: ".78rem", color: "#444", background: "#f0ece2", padding: ".5rem .75rem", direction: "ltr" }}>{musicXmlUrl}</code>
          </div>
        )}
        {status === "missing" && (
          <div style={statusBoxStyle}>
            <p style={{ fontFamily: "Inter,sans-serif", color: "#888", marginBottom: ".5rem" }}>{t.missingTitle}</p>
            <p style={{ fontFamily: "Inter,sans-serif", color: "#aaa", fontSize: ".85rem", maxWidth: 460, margin: "0 auto" }}>{t.missingBody}</p>
          </div>
        )}

        {/* Positioned wrapper. OSMD owns containerRef exclusively (it wipes
            children on render), so the custom cursor div lives as a SIBLING
            inside this wrapper. OSMD's cursor coords are container-relative;
            container sits at (0,0) of the wrapper, so coords carry over 1:1. */}
        <div
          onClick={handleScoreClick}
          style={{
            position: "relative",
            display: status === "ready" ? "block" : "none",
            cursor: status === "ready" ? "pointer" : "default",
          }}
        >
          <div ref={containerRef} />
          <div
            ref={cursorElRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              left: 0, top: 0,
              width: 3,
              height: 40,
              background: color,
              opacity: 0.78,
              pointerEvents: "none",
              borderRadius: 2,
              willChange: "transform",
              transition: "none",
              display: "none",
              zIndex: 5,
              boxShadow: `0 0 6px ${color}66`,
            }}
          />
        </div>
      </div>

      {status === "ready" && chrome !== "none" && (
        <p style={{
          marginTop: ".75rem", fontFamily: "Inter,sans-serif", fontSize: ".72rem", color: "#999",
          fontStyle: "italic", textAlign: lang === "fa" ? "right" : "left",
          direction: lang === "fa" ? "rtl" : "ltr",
        }}>{t.hint}</p>
      )}
    </div>
  );
}

// ─── HELPERS (pure, hoisted) ──────────────────────────────────────────────

function noteToMidi(note) {
  if (note == null) return null;
  if (note.isRestFlag || note.IsRestFlag) return null;
  if (typeof note.halfTone === "number") return note.halfTone;
  if (typeof note.HalfTone === "number") return note.HalfTone;
  const p = note.pitch || note.Pitch;
  if (p && typeof p.frequency === "number") {
    return Math.round(69 + 12 * Math.log2(p.frequency / 440));
  }
  return null;
}

function getPartIndex(ve, osmd) {
  try {
    const sse = ve.ParentSourceStaffEntry || ve.parentSourceStaffEntry;
    const staff = sse?.ParentStaff || sse?.parentStaff;
    const instrument = staff?.ParentInstrument || staff?.parentInstrument;
    const instruments = osmd?.sheet?.Instruments || osmd?.sheet?.instruments || [];
    if (!instrument) return 0;
    const idx = instruments.indexOf(instrument);
    return idx >= 0 ? idx : 0;
  } catch {
    return 0;
  }
}

function getCursorEl(osmd, container) {
  try {
    if (osmd?.cursor?.cursorElement) return osmd.cursor.cursorElement;
    if (osmd?.cursors && osmd.cursors[0]?.cursorElement) return osmd.cursors[0].cursorElement;
  } catch {}
  // Fallback: first img element in the OSMD container (OSMD's cursor img)
  return container ? container.querySelector("img") : null;
}

// Binary search not worth the complexity — timelines are O(hundreds).
function findStepIdxAtSec(tl, sec) {
  if (!tl.length) return 0;
  let i = 0;
  while (i < tl.length && tl[i].startSec < sec) i++;
  // Prefer the step whose interval contains sec
  if (i > 0 && tl[i - 1].startSec + tl[i - 1].durationSec > sec) return i - 1;
  return Math.min(i, tl.length - 1);
}

const btnStyle = (enabled, color, active) => ({
  fontFamily: "Inter,sans-serif",
  fontSize: ".85rem",
  fontWeight: 700,
  padding: ".6rem 1.2rem",
  background: enabled ? (active ? color : "#fff") : "#eee",
  color: enabled ? (active ? "#fff" : color) : "#aaa",
  border: `1px solid ${enabled ? color : "#ddd"}`,
  borderRadius: 4,
  cursor: enabled ? "pointer" : "default",
  letterSpacing: ".05em",
  textTransform: "uppercase",
});

const statusBoxStyle = {
  position: "absolute", inset: 0,
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  textAlign: "center", padding: "2rem",
};

const FALLBACK_STRINGS = {
  fa: {
    play: "پخش", pause: "توقف", reset: "از ابتدا", tempo: "تمپو", zoom: "بزرگ‌نمایی",
    instrument: "ساز", instrumentLoading: "در حال بارگذاری",
    muteLabel: "بی‌صدا کردن", unmuteLabel: "روشن کردن صدا",
    loading: "بارگذاری نت", errorTitle: "خواندن فایل نت ممکن نشد",
    errorBody: "فایل MusicXML در دسترس نیست یا قالب آن قابل خواندن نیست. لطفاً فایل را در پوشه public/scores/ قرار دهید.",
    missingTitle: "فایل نت تعریف نشده",
    missingBody: "برای این موومان فایل MusicXML تعیین نشده است. فیلد sheetUrl را در content/works/*.json پر کنید.",
    hint: "روی پخش کلیک کنید تا نت‌ها شنیده و مکان‌نما همراه با آن‌ها حرکت کند. روی هر میزان کلیک کنید تا به آن نقطه بپرید.",
    voices: "صداها", voicesAll: "همه را روشن کن", voicesNone: "همه را خاموش کن",
    aiVocalMissing: "هنوز اضافه نشده",
  },
  en: {
    play: "Play", pause: "Pause", reset: "Reset", tempo: "Tempo", zoom: "Zoom",
    instrument: "Instrument", instrumentLoading: "loading",
    muteLabel: "Mute audio", unmuteLabel: "Unmute audio",
    loading: "Loading score", errorTitle: "Could not load the score",
    errorBody: "The MusicXML file isn't reachable or can't be parsed. Drop a .musicxml or .xml file into public/scores/.",
    missingTitle: "No score file yet",
    missingBody: "This movement has no MusicXML file assigned. Set the sheetUrl field in content/works/*.json.",
    hint: "Press Play to hear the notes and watch the cursor glide along. Click any measure to jump there.",
    voices: "Voices", voicesAll: "All on", voicesNone: "All off",
    aiVocalMissing: "not yet recorded",
  },
};
