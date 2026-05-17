// ─── EXTRA VIEWS: Score-only · Story · Lyrics ─────────────────────────────
// Three focused-mode alternatives to the full Sheet view. Each strips away
// chrome to spotlight one aspect of the work: the notation alone, the
// editorial story behind it, or the full poem text.

import { useState } from "react";
import { useWork } from "./WorkContext.jsx";
import { WORK_LIST } from "./works/index.js";
import { SheetMusicPlayer } from "./SheetMusicPlayer.jsx";
import { isFA, dirFor, alignFor, SANS, SERIF, LATIN } from "./components.jsx";

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Score-only — print-style. Just notation + lyrics. No player controls.
// User flips between sections with the pill strip; one section at a time, no
// playback chrome (no Play, no Tempo, no Voices toggle). For sight-reading
// without the app getting in the way.
// ══════════════════════════════════════════════════════════════════════════════
export function ViewScoreOnly({ lang }) {
  const { movements, STR, slug } = useWork();
  const t = STR[lang];
  const workMeta = WORK_LIST.find(w => w.slug === slug);
  const initIdx = workMeta?.defaultSection === "last" ? movements.length - 1 : 0;
  const [selected, setSelected] = useState(movements[initIdx] || movements[0]);
  const L = selected[lang];

  return (
    <div style={{ background: "#fafaf8", minHeight: "100vh", padding: "5rem 1.25rem 3rem", direction: dirFor(lang) }}>
      {/* Section pill strip */}
      <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap", marginBottom: "1.5rem", justifyContent: "center" }}>
        {movements.map(m => {
          const sel = selected?.latin === m.latin;
          const Lm = m[lang];
          return (
            <button key={m.latin}
              onClick={() => setSelected(m)}
              style={{
                padding: ".4rem .85rem",
                fontSize: ".75rem",
                border: `1px solid ${m.color}55`,
                borderRadius: 100,
                background: sel ? m.color : "transparent",
                color: sel ? "#fff" : m.color,
                cursor: "pointer",
                fontFamily: lang === "fa" ? "Vazirmatn,Inter,sans-serif" : "Inter,sans-serif",
                whiteSpace: "nowrap",
              }}>
              {m.num} · {Lm.title}
            </button>
          );
        })}
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Notation + minimal play button — cursor glides smoothly across notes */}
        <SheetMusicPlayer
          key={selected.latin}
          musicXmlUrl={selected.musicXmlUrl || `/scores/${slug}/${selected.num.toLowerCase()}-${selected.latin.toLowerCase().replace(/\s+/g, "-")}.musicxml`}
          audioUrl={selected.audioUrl || `/audio/${slug}/${selected.num.toLowerCase()}-${selected.latin.toLowerCase().replace(/\s+/g, "-")}.mp3`}
          defaultTempo={80}
          lang={lang}
          color={selected.color}
          chrome="minimal"
        />

        {/* Lyrics — Latin / phonetic / translation, stacked per line */}
        <div style={{ background: "#fff", padding: "2rem", border: "1px solid #d5d0c4", borderTop: "none", marginTop: 0 }}>
          {selected.text.map((tx, i) => (
            <div key={i} style={{
              marginBottom: i < selected.text.length - 1 ? "1.5rem" : 0,
              paddingBottom: i < selected.text.length - 1 ? "1.5rem" : 0,
              borderBottom: i < selected.text.length - 1 ? "1px dotted #d5d0c4" : "none",
            }}>
              <p style={{ ...LATIN, fontSize: "1.2rem", color: selected.color, lineHeight: 1.7, marginBottom: ".4rem", textAlign: "left", whiteSpace: "pre-line", fontWeight: 500 }}>{tx.la}</p>
              {tx.phon && (
                <p style={{ fontFamily: "'Inter',sans-serif", fontStyle: "italic", fontSize: ".85rem", color: "#666", lineHeight: 1.6, marginBottom: ".55rem", direction: "ltr", textAlign: "left", whiteSpace: "pre-line", letterSpacing: ".03em" }}>{tx.phon}</p>
              )}
              <p style={{ ...SERIF(lang), fontSize: "1.05rem", color: "#3a3026", lineHeight: 1.85, whiteSpace: "pre-line" }}>{tx[lang]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Story — narrative read about the music, mood, history
// ══════════════════════════════════════════════════════════════════════════════
export function ViewStory({ lang }) {
  const { movements, STR } = useWork();
  const t = STR[lang];

  return (
    <div style={{ background: "#fdfcf7", minHeight: "100vh", padding: "5rem 1.25rem 4rem", direction: dirFor(lang) }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <p style={{ ...SANS(lang), fontSize: ".75rem", letterSpacing: ".25em", color: "#b8893a", marginBottom: ".6rem", textTransform: "uppercase" }}>{t.prologueEyebrow}</p>
        <h1 style={{ ...SERIF(lang), fontSize: "clamp(2rem,5vw,2.75rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: "1rem", color: "#1a1208" }}>{t.title1} {t.title2}</h1>
        <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".9rem", color: "#888", marginBottom: "2.5rem", direction: "ltr", textAlign: alignFor(lang), letterSpacing: ".05em" }}>{t.subtitleLatin}</p>

        {/* Prologue */}
        {t.prologue?.map((p, i) => (
          <p key={i} style={{ ...SERIF(lang), fontSize: "1.15rem", lineHeight: 1.95, color: "#3a3026", marginBottom: "1.25rem" }}>{p}</p>
        ))}

        <hr style={{ border: "none", borderTop: "1px solid #d5d0c4", margin: "3rem 0" }} />

        {/* Per-section story (movements) */}
        {movements.map(m => {
          const L = m[lang];
          return (
            <article key={m.latin} style={{ marginBottom: "3rem" }}>
              <p style={{ ...SANS(lang), fontSize: ".72rem", letterSpacing: ".2em", color: m.color, textTransform: "uppercase", marginBottom: ".35rem" }}>
                {t.movement} {m.num} · {m.key[lang]} · {m.mood[lang]}
              </p>
              <h2 style={{ ...SERIF(lang), fontSize: "clamp(1.4rem,4vw,1.9rem)", lineHeight: 1.2, marginBottom: ".2rem", color: "#1a1208" }}>{L.title}</h2>
              <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: "1rem", color: "#888", marginBottom: "1rem", direction: "ltr", textAlign: alignFor(lang) }}>{m.latin}</p>
              <p style={{ ...SANS(lang), fontSize: ".95rem", color: "#5a5040", marginBottom: "1.1rem" }}>{L.sub}</p>
              {L.meaning && L.meaning.split("\n\n").map((p, i) => (
                <p key={i} style={{ ...SERIF(lang), fontSize: "1.05rem", lineHeight: 1.9, color: "#3a3026", marginBottom: ".95rem" }}>{p}</p>
              ))}
              {L.note && (
                <div style={{ background: m.color + "10", [isFA(lang) ? "borderRight" : "borderLeft"]: `3px solid ${m.color}`, padding: "1rem 1.25rem", marginTop: "1rem" }}>
                  <p style={{ ...SANS(lang), fontSize: ".7rem", letterSpacing: ".15em", color: m.color, textTransform: "uppercase", marginBottom: ".4rem" }}>{t.noteHeader}</p>
                  <p style={{ ...SERIF(lang), fontSize: "1rem", color: "#3a3026", lineHeight: 1.75 }}>{L.note}</p>
                </div>
              )}
            </article>
          );
        })}

        <hr style={{ border: "none", borderTop: "1px solid #d5d0c4", margin: "3rem 0" }} />

        {/* Closing */}
        <p style={{ ...SERIF(lang), fontSize: "1.3rem", lineHeight: 1.55, fontStyle: "italic", color: "#1a1208", marginBottom: "1.25rem" }}>{t.closingTitle}</p>
        <p style={{ ...SERIF(lang), fontSize: "1.05rem", lineHeight: 1.85, color: "#5a5040" }}>
          {t.concludingA} {t.lacrimosaQuote} {t.concludingB}
        </p>
        <p style={{ ...SANS(lang), fontSize: ".75rem", letterSpacing: ".18em", color: "#a89a82", textTransform: "uppercase", marginTop: "2.5rem" }}>{t.footer}</p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Lyrics — full poem text, all sections, latin / phon / translation
// ══════════════════════════════════════════════════════════════════════════════
export function ViewLyrics({ lang }) {
  const { movements, STR } = useWork();
  const t = STR[lang];

  return (
    <div style={{ background: "#0d0a06", minHeight: "100vh", color: "#f3ead5", padding: "5rem 1.25rem 4rem", direction: dirFor(lang) }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p style={{ ...SANS(lang), fontSize: ".72rem", letterSpacing: ".3em", color: "#b8893a", marginBottom: ".5rem", textTransform: "uppercase" }}>{t.latinHeader}</p>
        <h1 style={{ ...SERIF(lang), fontSize: "clamp(2rem,5vw,2.5rem)", fontWeight: 700, lineHeight: 1.15, marginBottom: ".4rem", color: "#f3ead5" }}>{t.title1} {t.title2}</h1>
        <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".9rem", color: "rgba(245,241,235,.5)", marginBottom: "3rem", direction: "ltr", textAlign: alignFor(lang), letterSpacing: ".05em" }}>{t.subtitleLatin}</p>

        {movements.map(m => {
          const L = m[lang];
          return (
            <section key={m.latin} style={{ marginBottom: "3.25rem" }}>
              <p style={{ ...SANS(lang), fontSize: ".72rem", letterSpacing: ".22em", color: m.color, textTransform: "uppercase", marginBottom: ".25rem" }}>{m.num} · {m.latin}</p>
              <h2 style={{ ...SERIF(lang), fontSize: "1.45rem", fontWeight: 600, lineHeight: 1.2, marginBottom: "1.4rem", color: "#f3ead5" }}>{L.title}</h2>
              {m.text.map((tx, i) => (
                <div key={i} style={{ marginBottom: "1.5rem", [isFA(lang) ? "paddingRight" : "paddingLeft"]: "1rem", [isFA(lang) ? "borderRight" : "borderLeft"]: `2px solid ${m.color}77` }}>
                  <p style={{ fontFamily: "'Cinzel',serif", fontSize: "1.05rem", color: m.color, lineHeight: 1.7, marginBottom: ".35rem", direction: "ltr", textAlign: "left", whiteSpace: "pre-line", fontWeight: 500 }}>{tx.la}</p>
                  {tx.phon && (
                    <p style={{ fontFamily: "'Inter',sans-serif", fontStyle: "italic", fontSize: ".8rem", color: "rgba(245,241,235,.5)", lineHeight: 1.6, marginBottom: ".5rem", direction: "ltr", textAlign: "left", whiteSpace: "pre-line", letterSpacing: ".03em" }}>{tx.phon}</p>
                  )}
                  <p style={{ ...SERIF(lang), fontSize: "1.08rem", color: "rgba(245,241,235,.92)", lineHeight: 1.85, whiteSpace: "pre-line" }}>{tx[lang]}</p>
                </div>
              ))}
            </section>
          );
        })}

        <p style={{ ...SANS(lang), fontSize: ".7rem", letterSpacing: ".18em", color: "rgba(245,241,235,.35)", textTransform: "uppercase", marginTop: "2.5rem", textAlign: "center" }}>{t.footer}</p>
      </div>
    </div>
  );
}
