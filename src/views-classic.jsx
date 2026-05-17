// ─── CLASSIC VIEWS: Interactive (dark) · Poetic (parchment) · Museum (cream) ─
import { useState } from "react";
import { useWork } from "./WorkContext.jsx";
import { Modal, ArcSVG, SANS, SERIF, LATIN, isFA, dirFor, alignFor } from "./components.jsx";

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Interactive (Dark)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewInteractive({ lang }) {
  const [selected, setSelected] = useState(null);
  const [openTheme, setOpenTheme] = useState(null);
  const { movements, themes, STR } = useWork();
  const t = STR[lang];

  return (
    <div style={{ background: "#080705", minHeight: "100vh" }}>
      {/* Hero */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center", background: "radial-gradient(ellipse at 50% 30%,rgba(139,30,30,.2),transparent 65%)", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".82rem", letterSpacing: ".05em", color: "#b8893a", marginBottom: "2rem" }}>{t.workFull}</p>
        <h1 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(2.5rem,8vw,6rem)", lineHeight: 1.15, color: "#f3ead5", marginBottom: "1.5rem" }}>
          {t.title1}<br />
          <span style={{ color: "#b8893a" }}>{t.title2}</span>
        </h1>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: ".82rem", letterSpacing: ".4em", color: "rgba(255,255,255,.5)", marginBottom: "3rem", direction: "ltr" }}>{t.subtitleLatin}</p>
        <div style={{ width: 200, height: 1, background: "linear-gradient(90deg,transparent,#b8893a,transparent)", margin: "0 auto 2rem", position: "relative" }}>
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#080705", padding: "0 1rem", color: "#b8893a" }}>✦</span>
        </div>
        <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.25rem", color: "rgba(255,255,255,.72)", maxWidth: 620, lineHeight: 2, marginBottom: "3rem" }}>{t.blurb}</p>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".82rem", color: "#b8893a" }}>{t.scrollHint}</p>
      </div>

      {/* Arc */}
      <div style={{ padding: "5rem 2rem 3rem", maxWidth: 1100, margin: "0 auto", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), fontSize: ".82rem", color: "#b8893a", marginBottom: ".75rem" }}>{t.arcEyebrow}</p>
        <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(1.8rem,4vw,3rem)", color: "#f3ead5", marginBottom: ".75rem" }}>
          {t.arcTitlePre}<span style={{ color: "#8b1e1e" }}>{t.arcDark}</span>{t.arcTitlePost}
        </h2>
        <p style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1.12rem", color: "rgba(255,255,255,.6)", marginBottom: "2.5rem", maxWidth: 620 }}>{t.arcHint}</p>
        <div style={{ height: 270 }}><ArcSVG selected={selected} onSelect={setSelected} lang={lang} /></div>
      </div>

      {/* Movement grid */}
      <div style={{ padding: "2rem 2rem 6rem", maxWidth: 1100, margin: "0 auto", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), fontSize: ".82rem", color: "#b8893a", marginBottom: "2rem" }}>{t.moveEyebrow}</p>
        <div className="tw-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 1, background: "rgba(255,255,255,.05)" }}>
          {movements.map(m => {
            const sel = selected?.latin === m.latin;
            const L = m[lang];
            return (
              <div key={m.latin} onClick={() => setSelected(m)}
                onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "#1a1612"; }}
                onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "#0f0e0b"; }}
                style={{ background: sel ? m.color + "18" : "#0f0e0b", padding: "1.75rem 1.4rem", cursor: "pointer", borderTop: sel ? `2px solid ${m.color}` : "2px solid transparent", transition: "all .25s", direction: dirFor(lang), position: "relative" }}>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: ".78rem", color: m.color, marginBottom: ".5rem", direction: "ltr" }}>{m.num}</div>
                <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "1.35rem", color: "#f3ead5", lineHeight: 1.25, marginBottom: ".3rem" }}>{L.title}</h3>
                <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".75rem", color: "rgba(255,255,255,.5)", direction: "ltr", marginBottom: ".5rem" }}>{m.latin}</p>
                <p style={{ ...SANS(lang), fontSize: ".82rem", color: m.color, opacity: .9 }}>{m.mood[lang]}</p>
                <div style={{ position: "absolute", bottom: 0, right: 0, left: 0, height: 2, background: `linear-gradient(${isFA(lang) ? 270 : 90}deg,${m.color}66,transparent)` }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Themes */}
      <div style={{ background: "#0a0906", padding: "5rem 2rem", borderTop: "1px solid rgba(255,255,255,.06)", direction: dirFor(lang) }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ ...SANS(lang), fontSize: ".82rem", color: "#b8893a", marginBottom: ".75rem" }}>{t.themesEyebrow}</p>
          <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(1.8rem,4vw,3rem)", color: "#f3ead5", marginBottom: "2.5rem" }}>
            {t.themesTitlePre}<span style={{ color: "#b8893a" }}>{t.themesTitleAccent}</span>{t.themesTitlePost}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 1, background: "rgba(255,255,255,.04)" }}>
            {themes.map(th => {
              const open = openTheme?.latin === th.latin;
              const Th = th[lang];
              return (
                <div key={th.latin} onClick={() => setOpenTheme(open ? null : th)}
                  onMouseEnter={e => { if (!open) e.currentTarget.style.background = "#110f0a"; }}
                  onMouseLeave={e => { if (!open) e.currentTarget.style.background = "#0a0906"; }}
                  style={{ background: open ? "rgba(184,137,58,.1)" : "#0a0906", padding: "1.9rem", cursor: "pointer", borderTop: open ? "2px solid #b8893a" : "2px solid transparent", transition: "all .25s" }}>
                  <div style={{ fontSize: "1.6rem", color: "#b8893a", marginBottom: ".75rem" }}>{th.icon}</div>
                  <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "1.22rem", color: "#b8893a", marginBottom: ".4rem" }}>{Th.name}</h3>
                  <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".82rem", color: "rgba(255,255,255,.5)", marginBottom: open ? "1rem" : 0, direction: "ltr" }}>{th.latin}</p>
                  {open && <p style={{ ...SERIF(lang), fontSize: "1.08rem", color: "rgba(255,255,255,.82)", lineHeight: 2.1, borderTop: "1px solid rgba(255,255,255,.1)", paddingTop: "1rem" }}>{Th.desc}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "2.5rem", borderTop: "1px solid rgba(184,137,58,.22)", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".82rem", color: "#b8893a" }}>{t.footer}</p>
      </div>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Poetic (Parchment)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewPoetic({ lang }) {
  const [selected, setSelected] = useState(null);
  const { movements, themes, STR } = useWork();
  const t = STR[lang];
  return (
    <div style={{ background: "#f3ead5", minHeight: "100vh", backgroundImage: "radial-gradient(ellipse at 20% 10%,rgba(184,137,58,.08),transparent 50%),radial-gradient(ellipse at 80% 60%,rgba(107,31,31,.05),transparent 50%)" }}>
      {/* Hero */}
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center", background: "radial-gradient(ellipse at center,rgba(15,26,46,.93),rgba(7,13,28,.98))", color: "#f3ead5", position: "relative", direction: dirFor(lang) }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%,rgba(212,166,74,.15),transparent 60%)" }} />
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".85rem", color: "#d4a64a", marginBottom: "2.5rem", position: "relative" }}>{t.work}</p>
        <h1 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(2.8rem,8vw,5.5rem)", lineHeight: 1.2, marginBottom: "1.5rem", position: "relative" }}>
          {t.title1}<br />
          <span style={{ color: "#d4a64a" }}>{t.title2}</span>
        </h1>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: ".85rem", letterSpacing: ".35em", color: "rgba(243,234,213,.65)", marginBottom: "3rem", position: "relative", direction: "ltr" }}>{t.subtitleEn}</p>
        <div style={{ width: 200, height: 1, background: "linear-gradient(90deg,transparent,#b8893a,transparent)", margin: "0 auto 2rem", position: "relative" }}>
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "#070d1c", padding: "0 1rem", color: "#d4a64a" }}>✦</span>
        </div>
        <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.25rem", color: "rgba(243,234,213,.9)", maxWidth: 600, lineHeight: 2, position: "relative" }}>{t.blurb}</p>
      </div>

      {/* Prologue */}
      <div style={{ padding: "6rem 2rem 4rem", maxWidth: 760, margin: "0 auto", textAlign: "center", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".85rem", color: "#b8893a", marginBottom: "1.5rem" }}>{t.prologueEyebrow}</p>
        <h2 style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(1.6rem,4vw,2.4rem)", color: "#0f1a2e", marginBottom: "2rem", lineHeight: 1.45 }}>{t.closingTitle}</h2>
        {t.prologue.map((p, i) => (
          <p key={i} style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.18rem", color: "rgba(15,26,46,.88)", marginBottom: "1.5rem", lineHeight: 2.05 }}>{p}</p>
        ))}
      </div>

      {/* Arc */}
      <div style={{ padding: "4rem 2rem 3rem", maxWidth: 1100, margin: "0 auto", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), fontSize: ".85rem", color: "#b8893a", marginBottom: ".75rem" }}>{t.arcEyebrow}</p>
        <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(2rem,5vw,3.5rem)", color: "#0f1a2e", marginBottom: ".75rem" }}>
          {t.arcTitlePre}<span style={{ color: "#6b1f1f" }}>{t.arcDark}</span>{t.arcTitlePost}
        </h2>
        <p style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1.12rem", color: "rgba(15,26,46,.7)", marginBottom: "2.5rem" }}>{t.arcHint}</p>
        <div style={{ height: 270 }}><ArcSVG selected={selected} onSelect={setSelected} lang={lang} light /></div>
      </div>

      {/* Spine */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "3rem 2rem 6rem", position: "relative", direction: dirFor(lang) }}>
        <div style={{ position: "absolute", right: "50%", top: 0, bottom: 0, width: 1, background: "linear-gradient(180deg,transparent,#b8893a 5%,#b8893a 95%,transparent)", opacity: .28, transform: "translateX(50%)" }} />
        {movements.map((m, idx) => {
          const isRightSide = idx % 2 === 0;
          const sideCol = isFA(lang) ? (isRightSide ? 1 : 3) : (isRightSide ? 1 : 3);
          const oppCol = isFA(lang) ? (isRightSide ? 3 : 1) : (isRightSide ? 3 : 1);
          const L = m[lang];
          return (
            <div key={m.latin} className="spine" onClick={() => setSelected(m)} style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: "2rem", alignItems: "start", marginBottom: "4.5rem", cursor: "pointer" }}>
              <div style={{ gridColumn: sideCol, gridRow: 1, textAlign: isRightSide ? (isFA(lang) ? "right" : "left") : (isFA(lang) ? "left" : "right"), direction: dirFor(lang) }}>
                <h3 style={{ ...SERIF(lang), textAlign: "inherit", fontWeight: 700, fontSize: "2.1rem", color: "#0f1a2e", lineHeight: 1.2, marginBottom: ".3rem" }}>{L.title}</h3>
                <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".88rem", color: "#b8893a", marginBottom: ".75rem", direction: "ltr", textAlign: "inherit" }}>{m.latin}</p>
                {m.text[0] && (
                  <div style={{ borderTop: "1px solid #b8893a", borderBottom: "1px solid #b8893a", padding: ".85rem 0", margin: ".75rem 0" }}>
                    <p style={{ ...SERIF(lang), textAlign: "inherit", fontSize: "1.14rem", color: "#6b1f1f", lineHeight: 1.9, marginBottom: ".4rem" }}>{m.text[0][lang].split("\n")[0]}</p>
                    <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".82rem", color: "rgba(15,26,46,.65)", direction: "ltr", textAlign: "inherit", marginBottom: ".25rem" }}>{m.text[0].la.split("\n")[0]}</p>
                    {m.text[0].phon && (
                      <p style={{ fontFamily: "'Inter',sans-serif", fontStyle: "italic", fontSize: ".75rem", color: "#8b6f3a", direction: "ltr", textAlign: "inherit", letterSpacing: ".02em" }}>{m.text[0].phon.split("\n")[0]}</p>
                    )}
                  </div>
                )}
                <p style={{ ...SERIF(lang), textAlign: "inherit", fontSize: "1.1rem", lineHeight: 2.1, color: "rgba(15,26,46,.88)" }}>{L.meaning.split("\n\n")[0]}</p>
                {L.note && <p style={{ marginTop: ".85rem", ...SERIF(lang), textAlign: "inherit", fontSize: ".98rem", color: "rgba(15,26,46,.68)", borderTop: "1px dotted #b8893a", paddingTop: ".85rem" }}>{L.note}</p>}
              </div>
              <div style={{ gridColumn: 2, gridRow: 1, width: 52, height: 52, borderRadius: "50%", background: "#f3ead5", border: `1px solid #b8893a`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cinzel',serif", fontSize: ".82rem", color: "#b8893a", boxShadow: "0 0 0 6px #f3ead5", margin: "0 auto", alignSelf: "start", marginTop: ".5rem" }}>{m.num}</div>
              <div style={{ gridColumn: oppCol, gridRow: 1 }} />
            </div>
          );
        })}
      </div>

      {/* Themes dark band */}
      <div style={{ background: "#0f1a2e", padding: "6rem 2rem", direction: dirFor(lang) }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ ...SANS(lang), fontSize: ".85rem", color: "#d4a64a", marginBottom: ".75rem" }}>{t.themesEyebrowAlt}</p>
          <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(1.8rem,4vw,3rem)", color: "#f3ead5", marginBottom: "3rem" }}>
            {t.themesTitlePre}<span style={{ color: "#d4a64a" }}>{t.themesTitleAccent}</span>{t.themesTitlePost}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "2rem" }}>
            {themes.map(th => {
              const Th = th[lang];
              return (
                <div key={th.latin} style={{ border: "1px solid rgba(184,137,58,.35)", padding: "2rem 1.75rem", background: "rgba(7,13,28,.4)", transition: "all .4s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4a64a"; e.currentTarget.style.transform = "translateY(-4px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,137,58,.35)"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ fontSize: "1.9rem", color: "#d4a64a", marginBottom: "1rem" }}>{th.icon}</div>
                  <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "1.28rem", color: "#d4a64a", marginBottom: ".75rem" }}>{Th.name}</h3>
                  <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".82rem", color: "#b8893a", marginBottom: "1rem", direction: "ltr" }}>{th.latin}</p>
                  <p style={{ ...SERIF(lang), fontSize: "1.02rem", color: "rgba(243,234,213,.82)", lineHeight: 2.05 }}>{Th.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conclusion */}
      <div style={{ padding: "7rem 2rem", maxWidth: 760, margin: "0 auto", textAlign: "center", direction: dirFor(lang) }}>
        <p style={{ color: "#b8893a", fontSize: "1.6rem", letterSpacing: "1rem", marginBottom: "2rem" }}>✦ · ✦ · ✦</p>
        <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.38rem", lineHeight: 2, color: "#0f1a2e", marginBottom: "1.5rem" }}>{t.concludingA} <span style={{ color: "#6b1f1f" }}>{t.lacrimosaQuote}</span></p>
        <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.38rem", lineHeight: 2, color: "#0f1a2e" }}>{t.concludingB}<span style={{ color: "#6b1f1f" }}>{t.notWord}</span>{t.soulPassage}<span style={{ color: "#6b1f1f" }}>{t.isWord}</span>.</p>
        <div style={{ marginTop: "3rem", ...SERIF(lang), textAlign: "center", fontSize: "1.45rem", color: "#6b1f1f", lineHeight: 1.9 }}>
          <div>{t.finalPrayerFa1}</div>
          <div>{t.finalPrayerFa2}</div>
          <div style={{ marginTop: ".75rem", fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: "1.05rem", color: "rgba(15,26,46,.5)", direction: "ltr" }}>{t.finalPrayerLa1}<br />{t.finalPrayerLa2}</div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "2.5rem", borderTop: "1px solid rgba(184,137,58,.35)", direction: dirFor(lang) }}>
        <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".82rem", color: "#b8893a" }}>{t.footer}</p>
      </div>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VIEW: Museum (Cream)
// ══════════════════════════════════════════════════════════════════════════════
export function ViewMuseum({ lang }) {
  const [selected, setSelected] = useState(null);
  const { movements, themes, STR } = useWork();
  const t = STR[lang];
  return (
    <div style={{ background: "#f5f1eb", minHeight: "100vh" }}>
      <div style={{ background: "#1c1816", padding: ".75rem 2rem", display: "flex", justifyContent: "space-between", fontSize: ".78rem", letterSpacing: ".15em", borderBottom: "1px solid #8a6a2f", direction: dirFor(lang) }}>
        <span style={{ ...SANS(lang), color: "#b8893a" }}>{t.galleryBar}</span>
        <span style={{ ...SANS(lang), color: "rgba(245,241,235,.6)" }}>{t.galleryHall}</span>
      </div>

      {/* Title wall */}
      <div className="mu-grid" style={{ minHeight: "88vh", background: "#1c1816", color: "#faf7f1", padding: "5rem 3rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5rem", alignItems: "center", position: "relative", direction: dirFor(lang) }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 20% 30%,rgba(184,137,58,.12),transparent 50%),radial-gradient(circle at 80% 70%,rgba(107,31,31,.08),transparent 50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <div style={{ ...SANS(lang), fontSize: ".82rem", color: "#b8893a", marginBottom: "2rem" }}>{t.exhibitionLabel}</div>
          <h1 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(2.5rem,6vw,5rem)", lineHeight: 1.1, marginBottom: "2rem" }}>
            {t.title1}<br /><span style={{ color: "#b8893a" }}>{t.title2}</span>
          </h1>
          <p style={{ ...SERIF(lang), fontSize: "1.45rem", color: "rgba(250,247,241,.85)", marginBottom: "3rem", lineHeight: 1.75 }}>{t.titleWallLine}</p>
          <p style={{ ...SANS(lang), fontSize: ".82rem", color: "#b8893a", paddingTop: "2rem", borderTop: "1px solid rgba(184,137,58,.35)" }}>{t.titleWallMeta}</p>
        </div>
        <div style={{ position: "relative", [isFA(lang) ? "borderRight" : "borderLeft"]: "1px solid rgba(184,137,58,.35)", [isFA(lang) ? "paddingRight" : "paddingLeft"]: "4rem" }}>
          {t.titleWallText.map((p, i) => (
            <p key={i} style={{ ...SERIF(lang), fontSize: "1.18rem", lineHeight: 1.95, color: "rgba(250,247,241,.88)", marginBottom: "1.5rem" }}>{p}</p>
          ))}
        </div>
      </div>

      {/* Arc room */}
      <div style={{ padding: "6rem 3rem", background: "#faf7f1", borderBottom: "1px solid #c9bfa9", direction: dirFor(lang) }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <p style={{ ...SANS(lang), fontSize: ".82rem", color: "#8a6a2f", marginBottom: ".75rem" }}>{t.galleryFirst}</p>
          <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: "#1a1a1a", marginBottom: ".75rem" }}>{t.arcRoom} <span style={{ color: "#8b3a2a" }}>{t.arcEmotional}</span></h2>
          <p style={{ ...SERIF(lang), fontStyle: "italic", fontSize: "1.18rem", color: "#4a4540", marginBottom: "3rem", maxWidth: 720 }}>{t.arcHintMuseum}</p>
          <div style={{ background: "#f5f1eb", border: "1px solid #c9bfa9", padding: "3rem 2rem", position: "relative" }}>
            <div style={{ position: "absolute", top: -10, right: "2rem", background: "#faf7f1", padding: "0 .75rem", ...SANS(lang), fontSize: ".78rem", color: "#8a6a2f" }}>{t.figure}</div>
            <div style={{ height: 280 }}><ArcSVG selected={selected} onSelect={setSelected} lang={lang} light bgColor="#f5f1eb" /></div>
          </div>
        </div>
      </div>

      {/* Gallery rooms */}
      {movements.map((m, idx) => {
        const even = idx % 2 === 0;
        const L = m[lang];
        return (
          <div key={m.latin} onClick={() => setSelected(m)} style={{ padding: "4rem 3rem", borderBottom: "1px solid #c9bfa9", background: even ? "#faf7f1" : "#f5f1eb", cursor: "pointer", transition: "background .2s", direction: dirFor(lang) }}
            onMouseEnter={e => e.currentTarget.style.background = even ? "#f0ece2" : "#ece8de"}
            onMouseLeave={e => e.currentTarget.style.background = even ? "#faf7f1" : "#f5f1eb"}>
            <div className="mu-grid" style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "200px 1fr", gap: "3.5rem", alignItems: "start" }}>
              <div style={{ direction: dirFor(lang) }}>
                <p style={{ ...SANS(lang), fontSize: ".82rem", color: "#8a6a2f", marginBottom: ".6rem" }}>{t.movement} {m.num}</p>
                <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "1.85rem", color: "#1a1a1a", lineHeight: 1.2, marginBottom: ".4rem" }}>{L.title}</h3>
                <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", fontSize: ".92rem", color: "#8a8278", marginBottom: ".4rem", direction: "ltr", textAlign: alignFor(lang) }}>{m.latin}</p>
                <p style={{ ...SERIF(lang), fontSize: "1.05rem", color: "#8a8278", marginBottom: "1.5rem" }}>{L.sub}</p>
                <div style={{ borderTop: "1px solid #c9bfa9", paddingTop: "1rem" }}>
                  {[[t.fieldKey, m.key[lang]], [t.fieldMood, m.mood[lang]], [t.fieldAuthor, m.author[lang]]].map(([k, v]) => (
                    <div key={k} style={{ paddingBottom: ".55rem", marginBottom: ".55rem", borderBottom: "1px dotted #c9bfa9" }}>
                      <p style={{ ...SANS(lang), fontSize: ".78rem", color: "#8a8278", marginBottom: ".18rem" }}>{k}</p>
                      <p style={{ ...SERIF(lang), fontSize: "1rem", color: "#1a1a1a" }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ direction: dirFor(lang) }}>
                <div style={{ [isFA(lang) ? "borderRight" : "borderLeft"]: "3px solid #8b3a2a", padding: "1.25rem 1.5rem", background: "rgba(255,255,255,.55)", marginBottom: "2rem" }}>
                  <p style={{ ...SANS(lang), fontSize: ".78rem", color: "#8a6a2f", marginBottom: ".75rem" }}>{t.latinHeader}</p>
                  {m.text.map((tx, i) => (
                    <div key={i} style={{ marginBottom: "1.2rem" }}>
                      <p style={{ ...LATIN, fontSize: "1.02rem", color: "#8b3a2a", lineHeight: 1.7, marginBottom: ".25rem", textAlign: alignFor(lang), whiteSpace: "pre-line" }}>{tx.la}</p>
                      {tx.phon && (
                        <p style={{ fontFamily: "'Inter',sans-serif", fontStyle: "italic", fontSize: ".82rem", color: "#8b6f3a", lineHeight: 1.6, marginBottom: ".4rem", direction: "ltr", textAlign: alignFor(lang), letterSpacing: ".02em", whiteSpace: "pre-line" }}>{tx.phon}</p>
                      )}
                      <p style={{ ...SERIF(lang), fontSize: "1.18rem", color: "#2a1a0a", lineHeight: 2, whiteSpace: "pre-line" }}>{tx[lang]}</p>
                    </div>
                  ))}
                </div>
                <p style={{ ...SANS(lang), fontSize: ".78rem", color: "#8a6a2f", marginBottom: ".75rem" }}>{t.meaningHeader}</p>
                {L.meaning.split("\n\n").map((p, i) => (
                  <p key={i} style={{ ...SERIF(lang), fontSize: "1.15rem", lineHeight: 2.1, color: "#4a4540", marginBottom: ".95rem" }}>{p}</p>
                ))}
                {L.note && (
                  <div style={{ background: "rgba(184,137,58,.08)", border: "1px solid rgba(184,137,58,.35)", padding: ".95rem 1.2rem", marginTop: "1rem" }}>
                    <p style={{ ...SANS(lang), fontSize: ".78rem", color: "#8a6a2f", marginBottom: ".4rem" }}>{t.noteHeader}</p>
                    <p style={{ ...SERIF(lang), fontSize: "1.05rem", color: "#4a4540", lineHeight: 2 }}>{L.note}</p>
                  </div>
                )}
                <p style={{ ...SANS(lang), marginTop: "1.5rem", fontSize: ".82rem", color: "rgba(138,98,47,.7)" }}>{t.clickDetails}</p>
              </div>
            </div>
          </div>
        );
      })}

      {/* Vitrines */}
      <div style={{ background: "#1c1816", padding: "6rem 3rem", position: "relative", direction: dirFor(lang) }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 25% 30%,rgba(184,137,58,.1),transparent 50%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
          <p style={{ ...SANS(lang), fontSize: ".82rem", color: "#b8893a", marginBottom: ".75rem" }}>{t.themesEyebrowMuseum}</p>
          <h2 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "clamp(1.8rem,3.5vw,2.8rem)", color: "#faf7f1", marginBottom: "3rem" }}>
            {t.themesTitlePre}<span style={{ color: "#b8893a" }}>{t.themesTitleAccent}</span>{t.themesTitlePost}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: "1.75rem" }}>
            {themes.map(th => {
              const Th = th[lang];
              return (
                <div key={th.latin} style={{ border: "1px solid rgba(184,137,58,.35)", padding: "2.25rem 2rem", background: "rgba(0,0,0,.15)", transition: "all .4s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#b8893a"; e.currentTarget.style.background = "rgba(184,137,58,.08)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(184,137,58,.35)"; e.currentTarget.style.background = "rgba(0,0,0,.15)"; }}>
                  <p style={{ ...SANS(lang), fontSize: ".78rem", color: "#b8893a", marginBottom: ".85rem" }}>{t.fieldTheme}</p>
                  <h3 style={{ ...SERIF(lang), fontWeight: 700, fontSize: "1.55rem", color: "#faf7f1", marginBottom: ".4rem" }}>{Th.name}</h3>
                  <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", color: "#b8893a", marginBottom: "1.25rem", direction: "ltr", fontSize: ".82rem" }}>{th.latin}</p>
                  <p style={{ ...SERIF(lang), fontSize: "1.05rem", color: "rgba(250,247,241,.82)", lineHeight: 2.05 }}>{Th.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Exit wall */}
      <div style={{ background: "#faf7f1", padding: "7rem 3rem", textAlign: "center", direction: dirFor(lang) }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <p style={{ ...SANS(lang), textAlign: "center", fontSize: ".82rem", color: "#8a6a2f", marginBottom: "2rem" }}>{t.exitWall}</p>
          <p style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(1.3rem,2.5vw,1.7rem)", lineHeight: 1.95, marginBottom: "2rem", color: "#1a1a1a" }}>{t.concludingA} <span style={{ color: "#8b3a2a" }}>{t.lacrimosaQuote}</span></p>
          <p style={{ ...SERIF(lang), textAlign: "center", fontWeight: 700, fontSize: "clamp(1.3rem,2.5vw,1.7rem)", lineHeight: 1.95, color: "#1a1a1a" }}>{t.concludingB}<span style={{ color: "#8b3a2a" }}>{t.notWord}</span>{t.soulPassage}<span style={{ color: "#8b3a2a" }}>{t.isWord}</span>.</p>
          <div style={{ marginTop: "4rem", paddingTop: "3rem", borderTop: "1px solid #c9bfa9" }}>
            <p style={{ ...SERIF(lang), textAlign: "center", fontSize: "1.45rem", color: "#8b3a2a", lineHeight: 2 }}>{t.finalPrayerFa1}<br />{t.finalPrayerFa2}</p>
            <p style={{ fontFamily: "'Cinzel',serif", fontStyle: "italic", marginTop: "1rem", fontSize: "1rem", color: "#4a4540", direction: "ltr" }}>{t.finalPrayerLa1}<br />{t.finalPrayerLa2}</p>
          </div>
        </div>
      </div>

      <footer style={{ background: "#1c1816", color: "rgba(250,247,241,.5)", padding: "2.5rem 2rem", textAlign: "center", borderTop: "1px solid #8a6a2f", direction: dirFor(lang), ...SANS(lang) }}>
        <span style={{ color: "#b8893a" }}>{t.composer}</span> · {t.footerLong.split("·").slice(1).join("·")}
      </footer>
      <Modal m={selected} lang={lang} onClose={() => setSelected(null)} />
    </div>
  );
}
