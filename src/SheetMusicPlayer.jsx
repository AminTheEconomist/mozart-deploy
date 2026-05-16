// ─── INTERACTIVE SHEET MUSIC PLAYER ──────────────────────────────────────────
// Renders a MusicXML file as live SVG notation using OpenSheetMusicDisplay,
// with a cursor that advances at a user-set tempo (Drumeo-style follow-along).
//
// Requires the MusicXML file to be reachable at musicXmlUrl (e.g. /scores/...).
// If load fails, shows a friendly placeholder telling the user where to drop the file.

import { useEffect, useRef, useState } from "react";
import { OpenSheetMusicDisplay } from "opensheetmusicdisplay";
import { STR } from "./content.js";

export function SheetMusicPlayer({ musicXmlUrl, defaultTempo = 80, lang = "fa", color = "#b8893a" }) {
  const containerRef = useRef(null);
  const osmdRef = useRef(null);
  const timeoutRef = useRef(null);
  const audioCtxRef = useRef(null);
  const activeNotesRef = useRef([]);

  const [status, setStatus] = useState("loading"); // loading | ready | error | missing
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(defaultTempo);
  const [zoom, setZoom] = useState(1);
  const [audioOn, setAudioOn] = useState(true);

  const t = STR[lang].sheetPlayer || FALLBACK_STRINGS[lang];

  // ─── LOAD + RENDER ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !musicXmlUrl) {
      setStatus("missing");
      return;
    }

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
      cursorsOptions: [{ type: 0, color: color, alpha: 0.45, follow: true }],
    });
    osmdRef.current = osmd;

    osmd.load(musicXmlUrl)
      .then(() => {
        osmd.zoom = zoom;
        osmd.render();
        osmd.cursor.show();
        setStatus("ready");
      })
      .catch((err) => {
        console.warn("OSMD load failed for", musicXmlUrl, err);
        setStatus("error");
      });

    return () => {
      try { osmd.clear(); } catch {}
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [musicXmlUrl, color]);

  // ─── ZOOM CHANGES → RE-RENDER ──────────────────────────────────────────────
  useEffect(() => {
    const osmd = osmdRef.current;
    if (!osmd || status !== "ready") return;
    osmd.zoom = zoom;
    try { osmd.render(); osmd.cursor.show(); } catch {}
  }, [zoom, status]);

  // ─── AUDIO ─────────────────────────────────────────────────────────────────
  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtxRef.current = new AC();
    }
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === "suspended") ctx.resume();
    return ctx;
  };

  const stopActiveNotes = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const now = ctx.currentTime;
    for (const voice of activeNotesRef.current) {
      try {
        const master = voice.master || voice.gain;
        if (master) {
          master.gain.cancelScheduledValues(now);
          master.gain.setValueAtTime(master.gain.value, now);
          master.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
        }
        const oscs = voice.oscs || (voice.osc ? [voice.osc] : []);
        oscs.forEach(o => { try { o.stop(now + 0.08); } catch {} });
        if (voice.lfo) { try { voice.lfo.stop(now + 0.08); } catch {} }
      } catch {}
    }
    activeNotesRef.current = [];
  };

  // Extract MIDI pitch from an OSMD note, handling API variations across versions.
  const noteToMidi = (note) => {
    if (note == null) return null;
    if (note.isRestFlag || note.IsRestFlag) return null;
    // Recent OSMD: note.halfTone is MIDI pitch directly
    if (typeof note.halfTone === "number") return note.halfTone;
    if (typeof note.HalfTone === "number") return note.HalfTone;
    // Fallback via Pitch object
    const p = note.pitch || note.Pitch;
    if (p && typeof p.frequency === "number") {
      return Math.round(69 + 12 * Math.log2(p.frequency / 440));
    }
    return null;
  };

  // Richer synthesis: sum of sine harmonics (organ/voice-like body), unified
  // vibrato LFO across all harmonics, softer attack and release than a pure
  // synth. Each voice has its own master gain so chord summing stays clean.
  const HARMONICS = [
    { mult: 1, amp: 1.00 },   // fundamental
    { mult: 2, amp: 0.35 },   // octave — gives body
    { mult: 3, amp: 0.18 },   // perfect twelfth — warmth
    { mult: 4, amp: 0.08 },   // two octaves
    { mult: 5, amp: 0.04 },   // bright shimmer
  ];

  const buildVoice = (ctx, freq, durationSec) => {
    const now = ctx.currentTime;
    const master = ctx.createGain();
    master.connect(ctx.destination);

    // Soft envelope — feels more like sustained singing/organ than a synth pluck
    const peak = 0.07; // per-note; 4 voices summed ≈ 0.28, well below clipping
    const attack = 0.09;
    const release = Math.min(0.25, durationSec * 0.4);
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(peak, now + attack);
    master.gain.setValueAtTime(peak, now + Math.max(attack + 0.02, durationSec - release));
    master.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

    // 5 Hz vibrato LFO; modulates the detune of every harmonic in unison
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 5;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = 8; // cents (~half a semitone fraction)
    lfo.connect(lfoDepth);

    const oscs = HARMONICS.map(({ mult, amp }) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq * mult;
      lfoDepth.connect(osc.detune);

      const harmonicGain = ctx.createGain();
      harmonicGain.gain.value = amp;
      osc.connect(harmonicGain).connect(master);
      return osc;
    });

    oscs.forEach(o => { o.start(now); o.stop(now + durationSec + 0.12); });
    lfo.start(now);
    lfo.stop(now + durationSec + 0.12);

    return { oscs, lfo, master };
  };

  const playCurrentNotes = (durationSec) => {
    if (!audioOn) return;
    const osmd = osmdRef.current;
    const ctx = ensureAudio();
    if (!osmd || !ctx) return;

    const entries = osmd.cursor.iterator.CurrentVoiceEntries
      || osmd.cursor.iterator.currentVoiceEntries
      || [];

    for (const ve of entries) {
      const notes = ve.Notes || ve.notes || [];
      for (const note of notes) {
        const midi = noteToMidi(note);
        if (midi == null) continue;
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        const voice = buildVoice(ctx, freq, durationSec);
        activeNotesRef.current.push(voice);
      }
    }
  };

  const currentStepDurationMs = () => {
    const osmd = osmdRef.current;
    if (!osmd) return 60000 / tempo;
    const entries = osmd.cursor.iterator.CurrentVoiceEntries
      || osmd.cursor.iterator.currentVoiceEntries
      || [];
    let minFraction = 1; // whole-note fallback
    for (const ve of entries) {
      const notes = ve.Notes || ve.notes || [];
      for (const note of notes) {
        const len = note.length || note.Length;
        const real = len && (len.realValue ?? len.RealValue);
        if (typeof real === "number" && real > 0) {
          minFraction = Math.min(minFraction, real);
        }
      }
    }
    if (minFraction === 1) minFraction = 0.25; // safe default = quarter
    // realValue is fraction of whole note; *4 → quarters; *(60/tempo) → seconds
    return minFraction * 4 * (60000 / tempo);
  };

  // ─── PLAYBACK LOOP ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!playing || status !== "ready") {
      stopActiveNotes();
      return;
    }
    const osmd = osmdRef.current;
    if (!osmd) return;

    const tick = () => {
      const cursor = osmd.cursor;
      if (cursor.iterator.endReached) {
        setPlaying(false);
        return;
      }
      const dtMs = currentStepDurationMs();
      stopActiveNotes();
      playCurrentNotes(dtMs / 1000);
      timeoutRef.current = setTimeout(() => {
        cursor.next();
        tick();
      }, dtMs);
    };
    tick();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      stopActiveNotes();
    };
  }, [playing, tempo, status, audioOn]);

  const reset = () => {
    const osmd = osmdRef.current;
    if (!osmd) return;
    setPlaying(false);
    stopActiveNotes();
    try { osmd.cursor.reset(); osmd.cursor.show(); } catch {}
  };

  const handlePlayToggle = () => {
    ensureAudio(); // unlock audio on user gesture
    setPlaying(p => !p);
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#fafaf7", border: "1px solid #d5d0c4", padding: "1.5rem 1.5rem 1rem" }}>
      {/* Controls */}
      <div style={{
        display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap",
        marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid #e5e0d4",
        direction: lang === "fa" ? "rtl" : "ltr",
      }}>
        <button
          onClick={handlePlayToggle}
          disabled={status !== "ready"}
          style={btnStyle(status === "ready", color, playing)}
        >
          {playing ? `■ ${t.pause}` : `▶ ${t.play}`}
        </button>

        <button
          onClick={reset}
          disabled={status !== "ready"}
          style={btnStyle(status === "ready", "#666", false)}
        >
          ⟲ {t.reset}
        </button>

        <button
          onClick={() => setAudioOn(a => !a)}
          title={audioOn ? t.muteLabel : t.unmuteLabel}
          style={{
            ...btnStyle(true, audioOn ? color : "#999", false),
            padding: ".6rem .9rem",
            minWidth: 0,
          }}
        >
          {audioOn ? "🔊" : "🔇"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontFamily: "Inter,sans-serif", fontSize: ".82rem", color: "#444" }}>
          <span style={{ minWidth: 50 }}>{t.tempo}:</span>
          <input
            type="range"
            min="30" max="180" value={tempo}
            onChange={(e) => setTempo(parseInt(e.target.value, 10))}
            style={{ width: 160, accentColor: color }}
          />
          <span style={{ minWidth: 64, fontWeight: 600, color: color }}>{tempo} BPM</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: ".5rem", fontFamily: "Inter,sans-serif", fontSize: ".82rem", color: "#444" }}>
          <span style={{ minWidth: 50 }}>{t.zoom}:</span>
          <input
            type="range"
            min="0.5" max="2" step="0.1" value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: 100, accentColor: color }}
          />
          <span style={{ minWidth: 40, fontWeight: 600, color: color }}>{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Notation area */}
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
        <div ref={containerRef} style={{ display: status === "ready" ? "block" : "none" }} />
      </div>

      {/* Hint */}
      {status === "ready" && (
        <p style={{
          marginTop: ".75rem", fontFamily: "Inter,sans-serif", fontSize: ".72rem", color: "#999",
          fontStyle: "italic", textAlign: lang === "fa" ? "right" : "left",
          direction: lang === "fa" ? "rtl" : "ltr",
        }}>{t.hint}</p>
      )}
    </div>
  );
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

// Fallback strings if a work's content.js doesn't define sheetPlayer strings
const FALLBACK_STRINGS = {
  fa: {
    play: "پخش",
    pause: "توقف",
    reset: "از ابتدا",
    tempo: "تمپو",
    zoom: "بزرگ‌نمایی",
    muteLabel: "بی‌صدا کردن",
    unmuteLabel: "روشن کردن صدا",
    loading: "بارگذاری نت",
    errorTitle: "خواندن فایل نت ممکن نشد",
    errorBody: "فایل MusicXML در دسترس نیست یا قالب آن قابل خواندن نیست. لطفاً فایل را در پوشه public/scores/ قرار دهید.",
    missingTitle: "فایل نت تعریف نشده",
    missingBody: "برای این موومان فایل MusicXML تعیین نشده است. فیلد sheetUrl را در content/works/*.json پر کنید.",
    hint: "روی پخش کلیک کنید تا نت‌ها شنیده و مکان‌نما همراه با آن‌ها حرکت کند. تمپو و صدا را با دکمه‌های بالا تنظیم کنید.",
  },
  en: {
    play: "Play",
    pause: "Pause",
    reset: "Reset",
    tempo: "Tempo",
    zoom: "Zoom",
    muteLabel: "Mute audio",
    unmuteLabel: "Unmute audio",
    loading: "Loading score",
    errorTitle: "Could not load the score",
    errorBody: "The MusicXML file isn't reachable or can't be parsed. Drop a .musicxml or .xml file into public/scores/.",
    missingTitle: "No score file yet",
    missingBody: "This movement has no MusicXML file assigned. Set the sheetUrl field in content/works/*.json.",
    hint: "Press Play to hear the notes and watch the cursor follow along. Adjust tempo and audio with the buttons above.",
  },
};
