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
  const intervalRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading | ready | error | missing
  const [playing, setPlaying] = useState(false);
  const [tempo, setTempo] = useState(defaultTempo);
  const [zoom, setZoom] = useState(1);

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

  // ─── PLAYBACK CURSOR ───────────────────────────────────────────────────────
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!playing || status !== "ready") return;
    const osmd = osmdRef.current;
    if (!osmd) return;

    // Quarter-note duration in ms at the chosen tempo.
    // The cursor advances one position per step, which corresponds roughly to
    // one "note event" — accurate enough for follow-along when the tempo is set
    // relative to the prevailing note value the singer is reading.
    const beatMs = 60000 / tempo;
    intervalRef.current = setInterval(() => {
      const cursor = osmd.cursor;
      if (cursor.iterator.endReached) {
        setPlaying(false);
        return;
      }
      cursor.next();
    }, beatMs);

    return () => clearInterval(intervalRef.current);
  }, [playing, tempo, status]);

  const reset = () => {
    const osmd = osmdRef.current;
    if (!osmd) return;
    setPlaying(false);
    try { osmd.cursor.reset(); osmd.cursor.show(); } catch {}
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
          onClick={() => setPlaying(p => !p)}
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
    loading: "بارگذاری نت",
    errorTitle: "خواندن فایل نت ممکن نشد",
    errorBody: "فایل MusicXML در دسترس نیست یا قالب آن قابل خواندن نیست. لطفاً فایل را در پوشه public/scores/ قرار دهید.",
    missingTitle: "فایل نت تعریف نشده",
    missingBody: "برای این موومان فایل MusicXML تعیین نشده است. فیلد sheetUrl را در content/works/*.json پر کنید.",
    hint: "روی پخش کلیک کنید تا مکان‌نما با تمپوی تنظیم‌شده در نت حرکت کند. تمپو را تغییر دهید تا سرعت دلخواه را پیدا کنید.",
  },
  en: {
    play: "Play",
    pause: "Pause",
    reset: "Reset",
    tempo: "Tempo",
    zoom: "Zoom",
    loading: "Loading score",
    errorTitle: "Could not load the score",
    errorBody: "The MusicXML file isn't reachable or can't be parsed. Drop a .musicxml or .xml file into public/scores/.",
    missingTitle: "No score file yet",
    missingBody: "This movement has no MusicXML file assigned. Set the sheetUrl field in content/works/*.json.",
    hint: "Press Play to advance the cursor through the score at the chosen tempo. Adjust the slider to find your reading speed.",
  },
};
