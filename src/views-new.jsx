// ─── NEW VIEWS: Cinematic · Minimal · Editorial · Illuminated · Sheet Music ──
import { useState } from "react";
import { movements, themes, STR } from "./content.js";
import { Modal, ArcSVG, SANS, SERIF, LATIN, isFA, dirFor, alignFor } from "./components.jsx";

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Cinematic (Dramatic & Immersive)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewCinematic({ lang }) {
  const [selected, setSelected] = useState(null);
  const t = STR[lang];
  return (
    <div style={{ background: "#03020a", minHeight: "100vh", overflow: "hidden" }}>
      {/* Hero — fullscreen cinematic */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center", position: "relative", direction: dirFor(lang),
        background: "radial-gradient(ellipse at 50% 40%,rgba(139,30,30,.35),transparent 55%),radial-gradient(ellipse at 50% 80%,rgba(200,152,42,.18),transparent 60%),#03020a" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 50%,transparent 30%,rgba(0,0,0,.7) 100%)", pointerEvents: "none" }} />
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".95rem", letterSpacing: ".4em", color: "#d4a64a", marginBottom: "3rem", position: "relative", textTransform: "uppercase" }}>{t.work}</p>
        <h1 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(3.5rem,11vw,9rem)", lineHeight: 1.05, color: "#f3ead5", marginBottom: "2rem", position: "relative", textShadow: "0 0 80px rgba(212,166,74,.4),0 0 140px rgba(139,30,30,.3)" }}>
          {t.title1}<br />
          <span style={{ background: "linear-gradient(180deg,#d4a64a,#8b1e1e)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{t.title2}</span>
        </h1>
        <div style={{ width: 100, height: 2, background: "linear-gradient(90deg,transparent,#d4a64a,transparent)", margin: "1rem auto 2rem", position: "relative", boxShadow: "0 0 20px #d4a64a" }} />
        <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.45rem", color: "rgba(243,234,213,.85)", maxWidth: 720, lineHeight: 2.05, position: "relative", fontStyle: "italic" }}>{t.blurb}</p>
        <div style={{ position: "absolute", bottom: "2rem", ...SANS(lang), textAlign: "center", fontSize: ".88rem", color: "#d4a64a", letterSpacing: ".3em" }}>{t.scrollHint}</div>
      </div>

      {/* Arc with glow */}
      <div style={{ padding: "8rem 2rem 4rem", maxWidth: 1200, margin: "0 auto", direction: dirFor(lang), position: "relative" }}>
        <div style={{ position: "absolute", inset: "0 -100px", background: "radial-gradient(ellipse at center,rgba(139,30,30,.18),transparent 60%)", pointerEvents: "none" }} />
        <p style={{ ...SANS(lang), fontSize: ".95rem", letterSpacing: ".3em", color: "#d4a64a", marginBottom: "1rem", textTransform: "uppercase", position: "relative" }}>{t.arcEyebrow}</p>
        <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(2.5rem,6vw,4.5rem)", color: "#f3ead5", marginBottom: "1rem", position: "relative" }}>
          {t.arcTitlePre}<span style={{ color: "#8b1e1e", textShadow: "0 0 30px rgba(139,30,30,.6)" }}>{t.arcDark}</span>{t.arcTitlePost}
        </h2>
        <p style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1.22rem", color: "rgba(255,255,255,.7)", marginBottom: "3rem", maxWidth: 700, position: "relative" }}>{t.arcHint}</p>
        <div style={{ height: 320, position: "relative", padding: "2rem", background: "rgba(15,12,8,.5)", border: "1px solid rgba(212,166,74,.2)", boxShadow: "inset 0 0 80px rgba(139,30,30,.15)" }}><ArcSVG selected={selected} onSelect={setSelected} lang={lang} /></div>
      </div>

      {/* Movement cards — large cinematic */}
      <div style={{ padding: "4rem 2rem 8rem", maxWidth: 1300, margin: "0 auto", direction: dirFor(lang) }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: "1.5rem" }}>
          {movements.map(m => {
            const L = m[lang];
            return (
              <div key={m.latin} onClick={() => setSelected(m)}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 20px 60px ${m.color}55,0 0 0 1px ${m.color}88`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,.5),0 0 0 1px ${m.color}33`; }}
                style={{ background: `linear-gradient(135deg,#0a0805 0%,${m.color}15 100%)`, padding: "2.25rem 2rem", cursor: "pointer", boxShadow: `0 4px 20px rgba(0,0,0,.5),0 0 0 1px ${m.color}33`, transition: "all .4s cubic-bezier(.2,.8,.2,1)", direction: dirFor(lang), position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, fontFamily: "'Cinzel',serif", fontSize: "5rem", fontWeight: 600, color: `${m.color}22`, lineHeight: 1, padding: "1rem 1.5rem" }}>{m.num}</div>
                <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".88rem", color: m.color, letterSpacing: ".15em", textTransform: "uppercase", marginBottom: "1rem", direction: "ltr" }}>{m.latin}</p>
                <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "2rem", color: "#f3ead5", lineHeight: 1.2, marginBottom: ".75rem" }}>{L.title}</h3>
                <p style={{ ...SANS(lang), fontSize: ".95rem", color: "rgba(255,255,255,.65)", marginBottom: "1.5rem", lineHeight: 1.65 }}>{L.sub}</p>
                <div style={{ display: "flex", gap: ".75rem", flexWrap: "wrap" }}>
                  <span style={{ background: m.color + "22", color: m.color, padding: ".4rem 1rem", ...SANS(lang), fontSize: ".82rem", border: `1px solid ${m.color}66` }}>{m.mood[lang]}</span>
                  <span style={{ background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.65)", padding: ".4rem 1rem", ...SANS(lang), fontSize: ".82rem" }}>{m.key[lang]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer style={{ textAlign: "center", padding: "3rem", borderTop: "1px solid rgba(212,166,74,.2)", direction: dirFor(lang), background: "rgba(0,0,0,.3)" }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".85rem", letterSpacing: ".3em", color: "#d4a64a" }}>{t.footer}</p>
      </footer>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Minimal (Clean, lots of whitespace)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewMinimal({ lang }) {
  const [selected, setSelected] = useState(null);
  const t = STR[lang];
  return (
    <div style={{ background: "#fdfcf8", minHeight: "100vh", color: "#1a1a1a" }}>
      {/* Hero — extreme whitespace */}
      <div style={{ minHeight: "92vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8rem 2rem 4rem", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".78rem", letterSpacing: ".4em", color: "#999", marginBottom: "4rem", textTransform: "uppercase" }}>{t.work}</p>
        <h1 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 400, fontSize: "clamp(2.5rem,7vw,5rem)", lineHeight: 1.2, color: "#1a1a1a", marginBottom: "1rem", letterSpacing: "-.01em" }}>
          {t.title1}
        </h1>
        <h2 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 400, fontStyle: "italic", fontSize: "clamp(1.5rem,4vw,2.5rem)", color: "#777", marginBottom: "5rem", lineHeight: 1.3 }}>
          {t.title2}
        </h2>
        <div style={{ width: 40, height: 1, background: "#1a1a1a", margin: "0 auto 4rem" }} />
        <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.18rem", color: "#444", maxWidth: 540, lineHeight: 2.05 }}>{t.blurb}</p>
      </div>

      {/* Arc — minimal frame */}
      <div style={{ padding: "5rem 2rem", maxWidth: 1000, margin: "0 auto", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".3em", color: "#999", marginBottom: "2rem", textTransform: "uppercase" }}>{t.arcEyebrow}</p>
        <h2 style={{ ...SERIF(lang), fontWeight: 400, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#1a1a1a", marginBottom: "4rem", lineHeight: 1.3 }}>
          {t.arcTitlePre}{t.arcDark}{t.arcTitlePost}
        </h2>
        <div style={{ height: 280 }}><ArcSVG selected={selected} onSelect={setSelected} lang={lang} light bgColor="#fdfcf8" /></div>
      </div>

      {/* Movement list — extreme minimal */}
      <div style={{ padding: "6rem 2rem 8rem", maxWidth: 760, margin: "0 auto", direction: dirFor(lang) }}>
        {movements.map((m, i) => {
          const L = m[lang];
          return (
            <div key={m.latin} onClick={() => setSelected(m)}
              onMouseEnter={e => e.currentTarget.style.background = "#f6f3ec"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              style={{ padding: "2.5rem 1rem", borderTop: i === 0 ? "1px solid #e5dfd1" : "none", borderBottom: "1px solid #e5dfd1", cursor: "pointer", transition: "background .25s", direction: dirFor(lang), display: "grid", gridTemplateColumns: "60px 1fr auto", gap: "2rem", alignItems: "baseline" }}>
              <span style={{ fontFamily: "'Cinzel',serif", fontSize: "1rem", color: "#999", direction: "ltr" }}>{m.num}</span>
              <div>
                <h3 style={{ ...SERIF(lang), fontWeight: 400, fontSize: "1.75rem", color: "#1a1a1a", lineHeight: 1.25, marginBottom: ".3rem" }}>{L.title}</h3>
                <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".95rem", color: "#888", direction: "ltr", textAlign: alignFor(lang) }}>{m.latin}</p>
              </div>
              <span style={{ ...SANS(lang), fontSize: ".85rem", color: "#aaa", whiteSpace: "nowrap" }}>{m.mood[lang]}</span>
            </div>
          );
        })}
      </div>

      {/* Themes — minimal */}
      <div style={{ padding: "6rem 2rem", maxWidth: 760, margin: "0 auto", borderTop: "1px solid #e5dfd1", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".3em", color: "#999", marginBottom: "2rem", textTransform: "uppercase" }}>{t.themesEyebrow}</p>
        <h2 style={{ ...SERIF(lang), fontWeight: 400, fontSize: "clamp(1.8rem,4vw,2.5rem)", color: "#1a1a1a", marginBottom: "4rem", lineHeight: 1.3 }}>
          {t.themesTitlePre}{t.themesTitleAccent}{t.themesTitlePost}
        </h2>
        {themes.map(th => {
          const Th = th[lang];
          return (
            <div key={th.latin} style={{ padding: "2rem 0", borderBottom: "1px solid #e5dfd1" }}>
              <h3 style={{ ...SERIF(lang), fontWeight: 400, fontStyle: "italic", fontSize: "1.5rem", color: "#1a1a1a", marginBottom: ".5rem" }}>{Th.name}</h3>
              <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".85rem", color: "#999", marginBottom: "1.25rem", direction: "ltr" }}>{th.latin}</p>
              <p style={{ ...SERIF(lang), fontSize: "1.1rem", color: "#444", lineHeight: 2 }}>{Th.desc}</p>
            </div>
          );
        })}
      </div>

      <footer style={{ textAlign: "center", padding: "4rem 2rem", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".78rem", letterSpacing: ".3em", color: "#999" }}>{t.footer}</p>
      </footer>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Editorial (Magazine layout with drop caps + pull quotes)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewEditorial({ lang }) {
  const [selected, setSelected] = useState(null);
  const t = STR[lang];
  return (
    <div style={{ background: "#f8f5ee", minHeight: "100vh", color: "#1a1a1a" }}>
      {/* Magazine cover hero */}
      <div style={{ padding: "5rem 3rem 4rem", borderBottom: "8px double #1a1a1a", direction: dirFor(lang) }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "2rem", alignItems: "baseline" }}>
          <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".25em", color: "#8b3a2a", textTransform: "uppercase" }}>{t.work}</p>
          <h1 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(2.5rem,7vw,5.5rem)", lineHeight: 1, color: "#1a1a1a", letterSpacing: "-.02em" }}>{t.title1}</h1>
          <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".25em", color: "#8b3a2a", textTransform: "uppercase", textAlign: isFA(lang) ? "left" : "right" }}>K. 626 · 1791</p>
        </div>
        <p style={{ ...SERIF(lang), textAlign: "center", fontStyle: "italic", fontSize: "clamp(1.3rem,3vw,2rem)", color: "#555", maxWidth: 800, margin: "2rem auto 0", lineHeight: 1.4 }}>{t.title2}</p>
      </div>

      {/* Editorial opener with drop cap */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "5rem 2rem 3rem", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".25em", color: "#8b3a2a", marginBottom: "2rem", textTransform: "uppercase" }}>{t.prologueEyebrow}</p>
        {t.prologue.map((p, i) => (
          <p key={i} style={{ ...SERIF(lang), fontSize: "1.22rem", color: "#1a1a1a", lineHeight: 2.05, marginBottom: "1.5rem", textAlign: isFA(lang) ? "right" : "justify" }}>
            {i === 0 && !isFA(lang) && (
              <span style={{ float: "left", fontFamily: "'Cormorant Garamond',serif", fontSize: "5.5rem", lineHeight: ".85", fontWeight: 700, color: "#8b3a2a", paddingRight: ".6rem", paddingTop: ".4rem" }}>{p.charAt(0)}</span>
            )}
            {i === 0 && !isFA(lang) ? p.slice(1) : p}
          </p>
        ))}
      </div>

      {/* Arc — editorial frame */}
      <div style={{ padding: "5rem 2rem", maxWidth: 1100, margin: "0 auto", direction: dirFor(lang) }}>
        <div style={{ borderTop: "2px solid #1a1a1a", borderBottom: "2px solid #1a1a1a", padding: "3rem 0" }}>
          <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".25em", color: "#8b3a2a", marginBottom: "1rem", textTransform: "uppercase" }}>{t.arcEyebrow}</p>
          <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(1.8rem,4vw,3rem)", color: "#1a1a1a", marginBottom: "2.5rem" }}>{t.arcTitlePre}<span style={{ fontStyle: "italic", color: "#8b3a2a" }}>{t.arcDark}</span>{t.arcTitlePost}</h2>
          <div style={{ height: 280 }}><ArcSVG selected={selected} onSelect={setSelected} lang={lang} light bgColor="#f8f5ee" /></div>
        </div>
      </div>

      {/* Movement articles with pull quotes */}
      {movements.map((m, idx) => {
        const L = m[lang];
        const pullQuote = L.meaning.split("\n\n")[0].split(/[.。]/)[0];
        const isOdd = idx % 2 === 1;
        return (
          <article key={m.latin} onClick={() => setSelected(m)} style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 2rem", borderTop: idx > 0 ? "1px solid #d5cfc1" : "none", cursor: "pointer", direction: dirFor(lang) }}>
            <div style={{ display: "grid", gridTemplateColumns: isOdd ? "1fr 1.5fr" : "1.5fr 1fr", gap: "3.5rem", alignItems: "start" }}>
              <div style={{ gridColumn: isOdd ? 2 : 1, direction: dirFor(lang) }}>
                <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".25em", color: "#8b3a2a", marginBottom: "1rem", textTransform: "uppercase" }}>{t.movement} · {m.num}</p>
                <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(2rem,4vw,3rem)", color: "#1a1a1a", lineHeight: 1.1, marginBottom: ".5rem" }}>{L.title}</h3>
                <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: "1.05rem", color: "#8b3a2a", marginBottom: "2rem", direction: "ltr", textAlign: alignFor(lang) }}>{m.latin}</p>
                <p style={{ ...SERIF(lang), fontSize: "1.15rem", color: "#1a1a1a", lineHeight: 2.05, marginBottom: "1.5rem" }}>{L.meaning.split("\n\n").map((p, i) => (<span key={i}>{p}{i < L.meaning.split("\n\n").length - 1 && <><br /><br /></>}</span>))}</p>
                {L.note && <p style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1rem", color: "#666", borderTop: "1px solid #d5cfc1", paddingTop: "1.25rem", marginTop: "1.5rem" }}>{L.note}</p>}
              </div>
              <div style={{ gridColumn: isOdd ? 1 : 2, position: "sticky", top: "5rem" }}>
                <div style={{ borderTop: `4px solid ${m.color}`, paddingTop: "1.5rem", marginBottom: "2rem" }}>
                  <p style={{ ...SANS(lang), fontSize: ".75rem", letterSpacing: ".2em", color: "#999", marginBottom: ".4rem", textTransform: "uppercase" }}>{m.key[lang]}</p>
                  <p style={{ ...SANS(lang), fontSize: ".75rem", letterSpacing: ".2em", color: "#999", textTransform: "uppercase" }}>{m.mood[lang]} · {m.author[lang]}</p>
                </div>
                <blockquote style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1.5rem", color: m.color, lineHeight: 1.45, borderTop: `1px solid ${m.color}55`, borderBottom: `1px solid ${m.color}55`, padding: "1.5rem 0", margin: "0 0 1.5rem" }}>
                  &ldquo;{pullQuote}&rdquo;
                </blockquote>
                {m.text[0] && (
                  <div>
                    <p style={{ ...LATIN, fontSize: "1.05rem", color: m.color, lineHeight: 1.75, marginBottom: ".3rem", textAlign: alignFor(lang), whiteSpace: "pre-line" }}>{m.text[0].la}</p>
                    {m.text[0].phon && (
                      <p style={{ fontFamily: "'Inter',sans-serif", fontStyle: "italic", fontSize: ".82rem", color: m.color + "AA", lineHeight: 1.65, marginBottom: ".5rem", direction: "ltr", textAlign: alignFor(lang), letterSpacing: ".02em", whiteSpace: "pre-line" }}>{m.text[0].phon}</p>
                    )}
                    <p style={{ ...SERIF(lang), fontSize: "1.05rem", color: "#444", lineHeight: 1.85, whiteSpace: "pre-line" }}>{m.text[0][lang]}</p>
                  </div>
                )}
              </div>
            </div>
          </article>
        );
      })}

      <footer style={{ borderTop: "8px double #1a1a1a", padding: "3rem 2rem", textAlign: "center", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".78rem", letterSpacing: ".3em", color: "#8b3a2a", textTransform: "uppercase" }}>{t.footer}</p>
      </footer>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Illuminated (Sacred manuscript with gold leaf, jewel tones)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewIlluminated({ lang }) {
  const [selected, setSelected] = useState(null);
  const t = STR[lang];
  return (
    <div style={{ background: "linear-gradient(180deg,#1a0d1a 0%,#0d0a1a 50%,#1a0d0d 100%)", minHeight: "100vh", color: "#f3ead5" }}>
      {/* Hero with ornamental border */}
      <div style={{ padding: "5rem 2rem", direction: dirFor(lang), textAlign: "center", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", border: "1px solid rgba(212,166,74,.4)", padding: "4rem 3rem", position: "relative", background: "radial-gradient(ellipse at center,rgba(60,30,80,.3),transparent 70%)" }}>
          {/* Corner ornaments */}
          {[[0, 0], [0, 1], [1, 0], [1, 1]].map(([r, c]) => (
            <div key={`${r}-${c}`} style={{ position: "absolute", [r ? "bottom" : "top"]: -8, [c ? "right" : "left"]: -8, width: 16, height: 16, border: "1px solid #d4a64a", background: "#1a0d1a", transform: "rotate(45deg)" }} />
          ))}
          <p style={{ ...SANS(lang), textAlign: "center", fontSize: "1.5rem", color: "#d4a64a", marginBottom: "1.5rem" }}>✦ ❦ ✦</p>
          <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".85rem", letterSpacing: ".35em", color: "#d4a64a", marginBottom: "2.5rem", textTransform: "uppercase" }}>{t.work}</p>
          <h1 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(2.5rem,7vw,5rem)", lineHeight: 1.2, marginBottom: "1.5rem",
            background: "linear-gradient(180deg,#f3d978 0%,#d4a64a 50%,#9b6d28 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
            {t.title1}
          </h1>
          <h2 style={{ ...SERIF(lang), textAlign: "center", fontStyle: "italic", fontWeight: 400, fontSize: "clamp(1.3rem,3vw,2rem)", color: "rgba(243,234,213,.85)", marginBottom: "2.5rem" }}>{t.title2}</h2>
          <div style={{ width: 80, height: 1, background: "#d4a64a", margin: "2rem auto" }} />
          <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.2rem", color: "rgba(243,234,213,.85)", maxWidth: 600, margin: "0 auto", lineHeight: 2.05, fontStyle: "italic" }}>{t.blurb}</p>
        </div>
      </div>

      {/* Movement folios — each is an illuminated page */}
      {movements.map(m => {
        const L = m[lang];
        return (
          <div key={m.latin} onClick={() => setSelected(m)} style={{ padding: "3rem 2rem", cursor: "pointer", direction: dirFor(lang) }}>
            <div style={{ maxWidth: 880, margin: "0 auto", border: `1px solid ${m.color}66`, padding: "3rem 2.5rem", background: `radial-gradient(ellipse at 50% 0%,${m.color}22,transparent 60%),rgba(15,8,15,.4)`, position: "relative" }}>
              <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: "#1a0d1a", padding: "0 1.5rem", color: m.color, ...SANS(lang), fontSize: ".82rem", letterSpacing: ".3em" }}>{t.movement} · {m.num}</div>

              {/* Illuminated initial */}
              <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start", marginBottom: "1.5rem" }}>
                <div style={{ flexShrink: 0, width: 80, height: 80, border: `2px solid ${m.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel',serif", fontSize: "2.5rem", color: m.color, background: `linear-gradient(135deg,${m.color}33,transparent)`, boxShadow: `0 0 20px ${m.color}55, inset 0 0 12px ${m.color}33` }}>
                  {L.title.charAt(0)}
                </div>
                <div style={{ flex: 1, paddingTop: ".25rem" }}>
                  <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "2.2rem", lineHeight: 1.2, marginBottom: ".25rem", color: "#f3ead5" }}>{L.title}</h3>
                  <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: "1rem", color: m.color, direction: "ltr", textAlign: alignFor(lang) }}>{m.latin}</p>
                </div>
              </div>

              {m.text[0] && (
                <div style={{ borderTop: `1px solid ${m.color}55`, borderBottom: `1px solid ${m.color}55`, padding: "1.25rem 0", margin: "1.5rem 0", textAlign: "center" }}>
                  <p style={{ ...LATIN, fontSize: "1.18rem", color: "#d4a64a", lineHeight: 1.75, marginBottom: ".3rem", textAlign: "center", whiteSpace: "pre-line" }}>{m.text[0].la}</p>
                  {m.text[0].phon && (
                    <p style={{ fontFamily: "'Inter',sans-serif", fontStyle: "italic", fontSize: ".88rem", color: "rgba(212,166,74,.75)", lineHeight: 1.7, marginBottom: ".6rem", direction: "ltr", textAlign: "center", letterSpacing: ".03em", whiteSpace: "pre-line" }}>{m.text[0].phon}</p>
                  )}
                  <p style={{ ...SERIF(lang), textAlign: "center", fontStyle: "italic", fontSize: "1.15rem", color: "rgba(243,234,213,.88)", lineHeight: 1.9, whiteSpace: "pre-line" }}>{m.text[0][lang]}</p>
                </div>
              )}
              <p style={{ ...SERIF(lang), fontSize: "1.12rem", lineHeight: 2.1, color: "rgba(243,234,213,.85)" }}>{L.meaning.split("\n\n")[0]}</p>
              {L.note && (
                <p style={{ ...SERIF(lang), fontStyle: "italic", marginTop: "1.25rem", paddingTop: "1rem", borderTop: `1px dotted ${m.color}66`, fontSize: ".98rem", color: "rgba(243,234,213,.65)", lineHeight: 1.9 }}>{L.note}</p>
              )}
              <p style={{ textAlign: "center", color: m.color, fontSize: "1.2rem", marginTop: "1.5rem", letterSpacing: ".8rem" }}>✦ ✦ ✦</p>
            </div>
          </div>
        );
      })}

      <footer style={{ textAlign: "center", padding: "4rem 2rem", borderTop: "1px solid rgba(212,166,74,.3)", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".85rem", letterSpacing: ".3em", color: "#d4a64a" }}>{t.footer}</p>
      </footer>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Sheet Music (Sight Reading — scaffold for choir + piano score)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewSheetMusic({ lang }) {
  const [selected, setSelected] = useState(movements[0]);
  const t = STR[lang];
  const L = selected[lang];

  return (
    <div style={{ background: "#fafaf8", minHeight: "100vh", color: "#1a1a1a" }}>
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", minHeight: "100vh", direction: dirFor(lang) }}>
        {/* Sidebar: movement list */}
        <aside style={{ background: "#1a1a1a", color: "#fafaf8", padding: "2rem 0", overflowY: "auto", position: "sticky", top: 0, height: "100vh" }}>
          <div style={{ padding: "0 1.5rem 1.5rem", borderBottom: "1px solid #333" }}>
            <p style={{ ...SANS(lang), fontSize: ".75rem", letterSpacing: ".25em", color: "#b8893a", marginBottom: ".5rem", textTransform: "uppercase" }}>{t.sheetEyebrow}</p>
            <p style={{ ...SERIF(lang), fontSize: "1.15rem", color: "#fafaf8", lineHeight: 1.4 }}>{t.sheetTitle}</p>
          </div>
          <nav style={{ padding: "1rem 0" }}>
            {movements.map(m => {
              const sel = selected?.latin === m.latin;
              const Lm = m[lang];
              return (
                <button key={m.latin} onClick={() => setSelected(m)}
                  style={{ display: "block", width: "100%", textAlign: isFA(lang) ? "right" : "left", padding: ".85rem 1.5rem", background: sel ? "rgba(184,137,58,.15)" : "transparent", border: "none", [isFA(lang) ? "borderRight" : "borderLeft"]: sel ? `3px solid ${m.color}` : "3px solid transparent", cursor: "pointer", transition: "all .2s", color: sel ? "#fafaf8" : "rgba(250,250,248,.65)", direction: dirFor(lang) }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: ".75rem" }}>
                    <span style={{ fontFamily: "'Cinzel',serif", fontSize: ".82rem", color: m.color, minWidth: "2rem" }}>{m.num}</span>
                    <div>
                      <div style={{ ...SERIF(lang), fontSize: "1rem", lineHeight: 1.25 }}>{Lm.title}</div>
                      <div style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".75rem", color: "rgba(250,250,248,.5)", direction: "ltr", textAlign: alignFor(lang) }}>{m.latin}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main: score viewer */}
        <main style={{ padding: "3rem 3rem 5rem", direction: dirFor(lang) }}>
          {/* Header */}
          <div style={{ paddingBottom: "1.5rem", marginBottom: "2rem", borderBottom: "1px solid #d5d0c4" }}>
            <p style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".25em", color: selected.color, marginBottom: ".4rem", textTransform: "uppercase" }}>{t.movement} · {selected.num} · {selected.key[lang]}</p>
            <h1 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(2rem,4vw,3rem)", color: "#1a1a1a", lineHeight: 1.15, marginBottom: ".25rem" }}>{L.title}</h1>
            <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: "1.05rem", color: "#888", direction: "ltr", textAlign: alignFor(lang) }}>{selected.latin}</p>
          </div>

          {/* Tempo / dynamics strip */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
            <span style={{ ...SANS(lang), fontSize: ".82rem", padding: ".5rem 1rem", background: "#1a1a1a", color: "#fafaf8" }}>{selected.mood[lang]}</span>
            <span style={{ ...SANS(lang), fontSize: ".82rem", padding: ".5rem 1rem", background: "#fafaf8", color: "#1a1a1a", border: "1px solid #1a1a1a" }}>{selected.key[lang]}</span>
            <span style={{ ...SANS(lang), fontSize: ".82rem", padding: ".5rem 1rem", background: "#fafaf8", color: "#888", border: "1px solid #d5d0c4" }}>{selected.author[lang]}</span>
          </div>

          {/* Score area (scaffold) */}
          <div style={{ background: "#fafaf8", border: "2px dashed #c9c2b0", padding: "5rem 2rem", textAlign: "center", marginBottom: "2.5rem", minHeight: "60vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            {selected.sheetUrl ? (
              <iframe src={selected.sheetUrl} title={selected.latin} style={{ width: "100%", height: "70vh", border: "none", background: "#fff" }} />
            ) : (
              <>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: "4rem", color: "#d5d0c4", marginBottom: "1.5rem", lineHeight: 1 }}>♪</div>
                <p style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1.2rem", color: "#888", maxWidth: 480, lineHeight: 1.7, textAlign: "center" }}>{t.sheetPlaceholder}</p>
                <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".78rem", color: "#aaa", marginTop: "1.5rem", letterSpacing: ".15em" }}>
                  /public/scores/{selected.latin.toLowerCase().replace(/\s+/g, "-")}.pdf
                </p>
              </>
            )}
          </div>

          {/* Text reference for sight reading — Latin, Phonetics, Translation stacked per line */}
          <div style={{ background: "#fff", padding: "2.25rem", border: "1px solid #d5d0c4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <p style={{ ...SANS(lang), fontSize: ".82rem", letterSpacing: ".25em", color: selected.color, textTransform: "uppercase" }}>{t.latinHeader}</p>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: ".72rem", color: "#999", letterSpacing: ".05em", fontStyle: "italic" }}>{t.phonNote}</p>
            </div>
            {selected.text.map((tx, i) => (
              <div key={i} style={{ marginBottom: i < selected.text.length - 1 ? "2rem" : 0, paddingBottom: i < selected.text.length - 1 ? "2rem" : 0, borderBottom: i < selected.text.length - 1 ? "1px dotted #d5d0c4" : "none" }}>
                <p style={{ ...LATIN, fontSize: "1.4rem", color: selected.color, lineHeight: 1.75, marginBottom: ".5rem", textAlign: "left", whiteSpace: "pre-line", fontWeight: 500 }}>{tx.la}</p>
                {tx.phon && (
                  <p style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", fontSize: "1rem", color: "#2a4a6a", lineHeight: 1.7, marginBottom: ".75rem", direction: "ltr", textAlign: "left", letterSpacing: ".04em", whiteSpace: "pre-line", fontWeight: 500, background: "#f0f4f8", padding: ".5rem .75rem", borderLeft: `3px solid ${selected.color}` }}>{tx.phon}</p>
                )}
                <p style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1.08rem", color: "#666", lineHeight: 1.85, whiteSpace: "pre-line" }}>{tx[lang]}</p>
              </div>
            ))}
          </div>

          <p style={{ ...SERIF(lang), fontSize: "1rem", color: "#666", lineHeight: 1.95, marginTop: "2rem" }}>{t.sheetIntro}</p>
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Performance (Atmospheric — Choir · Hall · Church)
// ══════════════════════════════════════════════════════════════════════════════
// Scaffold for photo-based atmospheric view. Drop real images into /public/perf/
// and replace `src` props in the SCENES + PERF_IMAGES arrays.
// ══════════════════════════════════════════════════════════════════════════════
const SCENES = [
  { key: "choir",
    label: { fa: "گروه کر", en: "The Choir" },
    sub:   { fa: "صداهای انسانی، سکوت سالن", en: "Human voices, the hush of the hall" },
    color: "#c8982a",
    gradient: "radial-gradient(ellipse at 50% 70%,#3a2814 0%,#0a0604 70%)",
    src: "/perf/choir.jpg" },
  { key: "hall",
    label: { fa: "تالار و ارکستر", en: "Hall & Orchestra" },
    sub:   { fa: "چوب، طلا، نور شمع‌مانند", en: "Wood, gilt, candlelit light" },
    color: "#8b1e1e",
    gradient: "radial-gradient(ellipse at 50% 50%,#4a1e0e 0%,#0c0604 75%)",
    src: "/perf/hall.jpg" },
  { key: "church",
    label: { fa: "کلیسا", en: "The Church" },
    sub:   { fa: "سنگ، طاق‌ها، طنین جاودان", en: "Stone, vaults, eternal resonance" },
    color: "#4a6fa5",
    gradient: "radial-gradient(ellipse at 50% 35%,#1a2540 0%,#050810 80%)",
    src: "/perf/church.jpg" },
];

function Scene({ scene, lang }) {
  const [broken, setBroken] = useState(false);
  return (
    <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", borderRadius: 4, background: scene.gradient, cursor: "pointer", transition: "transform .5s" }}
      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.015)"}
      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
      {!broken && (
        <img src={scene.src} alt="" onError={() => setBroken(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "saturate(.85) contrast(1.05)" }} />
      )}
      <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg,transparent 40%,rgba(0,0,0,.85))` }} />
      {broken && (
        <div style={{ position: "absolute", top: "1rem", left: "1rem", fontSize: ".62rem", color: "rgba(255,255,255,.35)", letterSpacing: ".15em", fontFamily: "'Inter',sans-serif" }}>
          {scene.src.replace("/perf/", "")} · placeholder
        </div>
      )}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "1.5rem 1.5rem 1.75rem", direction: dirFor(lang) }}>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: ".7rem", letterSpacing: ".3em", color: scene.color, marginBottom: ".4rem", textTransform: "uppercase" }}>{scene.key}</p>
        <h3 style={{ ...SERIF(lang), textAlign: "inherit", fontWeight: 700, fontSize: "1.55rem", color: "#f3ead5", marginBottom: ".25rem", lineHeight: 1.2 }}>{scene.label[lang]}</h3>
        <p style={{ ...SERIF(lang), textAlign: "inherit", fontStyle: "italic", fontSize: ".92rem", color: "rgba(255,255,255,.65)" }}>{scene.sub[lang]}</p>
      </div>
    </div>
  );
}

export function ViewPerformance({ lang }) {
  const [selected, setSelected] = useState(null);
  const t = STR[lang];
  return (
    <div style={{ background: "#0a0806", minHeight: "100vh" }}>
      {/* Atmospheric hero */}
      <div style={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center", direction: dirFor(lang),
        background: "radial-gradient(ellipse at 50% 60%,#2a1810 0%,#0a0604 70%)" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 30%,rgba(212,166,74,.12),transparent 50%),radial-gradient(circle at 80% 70%,rgba(139,30,30,.1),transparent 50%)", pointerEvents: "none" }} />
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".8rem", letterSpacing: ".4em", color: "#c8982a", marginBottom: "2.5rem", position: "relative", textTransform: "uppercase" }}>{t.perfEyebrow}</p>
        <h1 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(2.8rem,8vw,5.8rem)", lineHeight: 1.1, color: "#f3ead5", marginBottom: "1.75rem", position: "relative", textShadow: "0 0 60px rgba(200,152,42,.25)" }}>
          {t.perfTitle}
        </h1>
        <div style={{ width: 80, height: 1, background: "linear-gradient(90deg,transparent,#c8982a,transparent)", margin: "1rem auto 2.5rem", position: "relative" }} />
        <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.18rem", color: "rgba(243,234,213,.75)", maxWidth: 620, lineHeight: 2, position: "relative", fontStyle: "italic" }}>{t.perfBlurb}</p>
      </div>

      {/* Three scenes */}
      <div style={{ padding: "6rem 2rem", maxWidth: 1400, margin: "0 auto", direction: dirFor(lang) }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: "2rem" }}>
          {SCENES.map(s => <Scene key={s.key} scene={s} lang={lang} />)}
        </div>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".72rem", color: "rgba(255,255,255,.3)", marginTop: "2.5rem", fontStyle: "italic" }}>{t.perfPlaceholder}</p>
      </div>

      {/* Arc */}
      <div style={{ padding: "4rem 2rem 6rem", maxWidth: 1100, margin: "0 auto", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: alignFor(lang), fontSize: ".8rem", letterSpacing: ".2em", color: "#c8982a", marginBottom: ".75rem", textTransform: "uppercase" }}>{t.arcEyebrow}</p>
        <h2 style={{ ...SERIF(lang), textAlign: alignFor(lang), fontWeight: 700, fontSize: "clamp(1.8rem,4vw,2.8rem)", color: "#f3ead5", marginBottom: "2.5rem" }}>{t.arcTitlePre}<span style={{ color: "#8b1e1e" }}>{t.arcDark}</span>{t.arcTitlePost}</h2>
        <div style={{ height: 280 }}><ArcSVG selected={selected} onSelect={setSelected} lang={lang} /></div>
      </div>

      {/* Movement strip with image slots */}
      <div style={{ padding: "0 2rem 6rem", maxWidth: 1400, margin: "0 auto", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: alignFor(lang), fontSize: ".75rem", letterSpacing: ".2em", color: "#c8982a", marginBottom: "1.75rem", textTransform: "uppercase" }}>{t.perfMovementsEyebrow}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1.5rem" }}>
          {movements.map(m => (
            <div key={m.latin} onClick={() => setSelected(m)}
              style={{ background: "#120e0a", border: "1px solid rgba(200,152,42,.15)", cursor: "pointer", transition: "all .3s", overflow: "hidden" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = m.color + "88"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(200,152,42,.15)"; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ aspectRatio: "16/10", background: `linear-gradient(135deg,${m.color}33,${m.color}11),radial-gradient(ellipse at 50% 70%,#2a1a0e,#0a0604)`, position: "relative", display: "flex", alignItems: "flex-end", padding: "1rem" }}>
                <span style={{ fontFamily: "'Cinzel',serif", fontSize: ".7rem", color: m.color, letterSpacing: ".15em" }}>{m.num}</span>
              </div>
              <div style={{ padding: "1rem 1.1rem 1.25rem" }}>
                <h4 style={{ ...SERIF(lang), textAlign: alignFor(lang), fontWeight: 700, fontSize: "1.05rem", color: "#f3ead5", lineHeight: 1.3, marginBottom: ".25rem" }}>{m[lang].title}</h4>
                <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".72rem", color: m.color, opacity: .8, direction: "ltr", textAlign: alignFor(lang) }}>{m.latin}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <footer style={{ background: "#050302", color: "rgba(243,234,213,.4)", padding: "2.5rem 2rem", textAlign: "center", borderTop: "1px solid rgba(200,152,42,.2)" }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".75rem", color: "#c8982a" }}>{t.footer}</p>
      </footer>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}
