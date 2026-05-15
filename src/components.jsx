// ─── SHARED COMPONENTS & STYLE HELPERS ───────────────────────────────────────
import { arcPoints, STR } from "./content.js";

// ─── STYLE HELPERS ───────────────────────────────────────────────────────────
export const isFA = (lang) => lang === "fa";
export const dirFor = (lang) => (isFA(lang) ? "rtl" : "ltr");
export const alignFor = (lang) => (isFA(lang) ? "right" : "left");

// Persian uses Vazirmatn (sans) + Amiri (serif). English uses Inter (sans) + Cormorant Garamond (serif).
export const SANS = (lang) => ({
  fontFamily: isFA(lang)
    ? "'Vazirmatn', 'Tahoma', sans-serif"
    : "'Inter', 'Helvetica Neue', sans-serif",
  direction: dirFor(lang),
  textAlign: alignFor(lang),
});

export const SERIF = (lang) => ({
  fontFamily: isFA(lang)
    ? "'Amiri', 'Vazirmatn', 'Tahoma', serif"
    : "'Cormorant Garamond', 'Georgia', serif",
  direction: dirFor(lang),
  textAlign: alignFor(lang),
});

// Latin text always renders LTR with Cinzel.
export const LATIN = {
  fontFamily: "'Cinzel', serif",
  fontStyle: "italic",
  direction: "ltr",
  textAlign: "left",
};

// ─── MODAL ───────────────────────────────────────────────────────────────────
export function Modal({ m, lang, onClose }) {
  if (!m) return null;
  const L = m[lang];
  const t = STR[lang];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(14px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0f0c08", border: `1px solid ${m.color}55`, maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2.5rem", position: "relative", animation: "slideUp .3s ease", boxShadow: `0 0 80px ${m.color}22`, direction: dirFor(lang) }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1.25rem", [isFA(lang) ? "left" : "right"]: "1.25rem", background: "none", border: "none", color: "rgba(255,255,255,.55)", cursor: "pointer", fontSize: "1.3rem" }}>✕</button>

        <div style={{ ...SANS(lang), fontSize: ".75rem", letterSpacing: ".12em", color: m.color, marginBottom: ".5rem" }}>{t.movement} {m.num} · {m.key[lang]}</div>
        <h2 style={{ ...SERIF(lang), fontSize: "clamp(1.8rem,5vw,2.8rem)", fontWeight: 700, color: "#f3ead5", lineHeight: 1.2, marginBottom: ".3rem" }}>{L.title}</h2>
        <p style={{ fontFamily: "'Cinzel',serif", fontSize: ".95rem", color: "#a07840", marginBottom: ".25rem", direction: "ltr", textAlign: "left" }}>{m.latin}</p>
        <p style={{ ...SANS(lang), fontSize: ".95rem", color: "rgba(255,255,255,.6)", marginBottom: "1.25rem" }}>{L.sub}</p>

        <div style={{ display: "flex", gap: ".75rem", marginBottom: "1.5rem", flexWrap: "wrap", justifyContent: isFA(lang) ? "flex-end" : "flex-start" }}>
          <span style={{ background: m.color + "22", border: `1px solid ${m.color}55`, color: m.color, padding: ".35rem .9rem", ...SANS(lang), fontSize: ".82rem" }}>{m.mood[lang]}</span>
          <span style={{ border: "1px solid rgba(255,255,255,.2)", color: "rgba(255,255,255,.6)", padding: ".35rem .9rem", ...SANS(lang), fontSize: ".82rem" }}>{m.author[lang]}</span>
        </div>

        <div style={{ height: 1, background: `linear-gradient(${isFA(lang) ? 270 : 90}deg,${m.color}88,transparent)`, marginBottom: "1.75rem" }} />

        <div style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".08em", color: "rgba(255,255,255,.55)", marginBottom: "1rem" }}>{t.latinHeader}</div>
        {m.text.map((tx, i) => (
          <div key={i} style={{ marginBottom: "1.75rem", [isFA(lang) ? "paddingRight" : "paddingLeft"]: "1.25rem", [isFA(lang) ? "borderRight" : "borderLeft"]: `2px solid ${m.color}66` }}>
            <p style={{ ...LATIN, fontSize: "1.08rem", color: m.color, lineHeight: 1.75, marginBottom: ".35rem", whiteSpace: "pre-line" }}>{tx.la}</p>
            {tx.phon && (
              <p style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif", fontSize: ".88rem", color: m.color + "BB", lineHeight: 1.7, marginBottom: ".6rem", direction: "ltr", textAlign: "left", letterSpacing: ".03em", whiteSpace: "pre-line", fontStyle: "italic" }}>{tx.phon}</p>
            )}
            <p style={{ ...SERIF(lang), fontSize: "1.22rem", color: "rgba(255,255,255,.92)", lineHeight: 2.1, whiteSpace: "pre-line" }}>{tx[lang]}</p>
          </div>
        ))}
        <p style={{ ...SANS(lang), fontSize: ".7rem", color: "rgba(255,255,255,.4)", marginBottom: "1rem", marginTop: "-.5rem", fontStyle: "italic" }}>{t.phonNote}</p>

        <div style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".08em", color: "rgba(255,255,255,.55)", margin: "1.75rem 0 1rem" }}>{t.meaningHeader}</div>
        {L.meaning.split("\n\n").map((p, i) => (
          <p key={i} style={{ ...SERIF(lang), fontSize: "1.18rem", lineHeight: 2.1, color: "rgba(255,255,255,.85)", marginBottom: "1.15rem" }}>{p}</p>
        ))}

        {L.note && (
          <div style={{ background: m.color + "15", border: `1px solid ${m.color}44`, padding: "1.1rem 1.4rem", marginTop: "1.25rem" }}>
            <div style={{ ...SANS(lang), fontSize: ".78rem", letterSpacing: ".08em", color: m.color, marginBottom: ".5rem" }}>{t.noteHeader}</div>
            <p style={{ ...SERIF(lang), fontSize: "1.1rem", color: "rgba(255,255,255,.82)", lineHeight: 1.95 }}>{L.note}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ARC SVG ─────────────────────────────────────────────────────────────────
export function ArcSVG({ selected, onSelect, lang, light = false, bgColor }) {
  const path = arcPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const tc = light ? "rgba(15,26,46,0.5)" : "rgba(255,255,255,0.45)";
  const bg = bgColor ?? (light ? "#f3ead5" : "#080705");
  const labels = STR[lang].arcLabels;
  return (
    <svg viewBox="0 0 1000 260" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="ag2" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#4a6fa5" /><stop offset="40%" stopColor="#8b1e1e" />
          <stop offset="70%" stopColor="#8b1e1e" /><stop offset="100%" stopColor="#c8982a" />
        </linearGradient>
        <linearGradient id="fg2" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#8b1e1e" stopOpacity=".18" />
          <stop offset="100%" stopColor="#8b1e1e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[[labels.peace, 25], [labels.sorrow, 120], [labels.dread, 215]].map(([l, y]) => (
        <g key={l}>
          <line x1="60" x2="930" y1={y} y2={y} stroke="rgba(128,100,60,0.18)" strokeDasharray="3,4" />
          <text x="52" y={y + 4} textAnchor="end" fill={tc} style={{ fontFamily: "Vazirmatn,Inter,Tahoma,sans-serif", fontSize: 11 }}>{l}</text>
        </g>
      ))}
      <path d={`${path} L ${arcPoints[arcPoints.length - 1].x} 240 L ${arcPoints[0].x} 240 Z`} fill="url(#fg2)" />
      <path d={path} fill="none" stroke="url(#ag2)" strokeWidth="2.2" strokeLinejoin="round" />
      {arcPoints.map((p, i) => {
        const sel = selected?.latin === p.m.latin;
        return (
          <g key={i} onClick={() => onSelect(p.m)} style={{ cursor: "pointer" }}>
            <circle cx={p.x} cy={p.y} r={sel ? 9 : 5} fill={sel ? p.m.color : bg} stroke={p.m.color} strokeWidth="2" style={{ transition: "r .2s,fill .2s" }} />
            <text x={p.x} y={p.y - 13} textAnchor="middle" fill={sel ? p.m.color : tc}
              style={{ fontFamily: "Vazirmatn,Inter,Tahoma,sans-serif", fontSize: 10, pointerEvents: "none" }}>{p.m[lang].title}</text>
          </g>
        );
      })}
    </svg>
  );
}
