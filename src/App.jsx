import { useState, useEffect } from "react";
import { WorkProvider, useWork } from "./WorkContext.jsx";
import { WORK_LIST, DEFAULT_WORK_SLUG } from "./works/index.js";
import { ViewInteractive, ViewPoetic, ViewMuseum } from "./views-classic.jsx";
import { ViewCinematic, ViewMinimal, ViewEditorial, ViewIlluminated, ViewSheetMusic, ViewPerformance } from "./views-new.jsx";
import { FeedbackWidget } from "./FeedbackWidget.jsx";

const VIEWS = {
  interactive: ViewInteractive,
  poetic: ViewPoetic,
  museum: ViewMuseum,
  cinematic: ViewCinematic,
  minimal: ViewMinimal,
  editorial: ViewEditorial,
  illuminated: ViewIlluminated,
  sheet: ViewSheetMusic,
  performance: ViewPerformance,
};

const VIEW_ORDER = ["interactive", "poetic", "museum", "cinematic", "minimal", "editorial", "illuminated", "performance", "sheet"];

export default function App() {
  return (
    <WorkProvider>
      <AppContent />
    </WorkProvider>
  );
}

function AppContent() {
  const { slug, setSlug, STR } = useWork();
  // View defaults to the current work's preferred landing view (sheet for short scored
  // pieces, poetic for big liturgical works). Computed once at mount.
  const initialView = (WORK_LIST.find(w => w.slug === slug)?.defaultView) || "poetic";
  const [view, setView] = useState(initialView);
  const [lang, setLang] = useState("fa");

  // When the user switches works, jump to that work's defaultView automatically.
  useEffect(() => {
    const w = WORK_LIST.find(w => w.slug === slug);
    if (w?.defaultView) setView(w.defaultView);
  }, [slug]);

  const ViewComponent = VIEWS[view];
  const labels = STR[lang].viewLabels;

  // Accent color of the current work (used to tint the switcher pill).
  const currentWork = WORK_LIST.find(w => w.slug === slug);
  const accent = currentWork?.accent || "#b8893a";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;700&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(184,137,58,.4); border-radius: 2px; }
        @keyframes slideUp { from { opacity:0;transform:translateY(20px) } to { opacity:1;transform:translateY(0) } }
        @media (max-width: 880px) {
          .tw-grid { grid-template-columns: 1fr !important; }
          .mu-grid { grid-template-columns: 1fr !important; }
          .spine { display: block !important; }
        }
      `}</style>

      {/* Top bar: work switcher + view switcher + language toggle */}
      <div style={{ position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)", zIndex: 300, display: "flex", gap: ".5rem", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Work switcher — which musical work is being viewed */}
        <div style={{ background: "rgba(15,12,8,.92)", backdropFilter: "blur(16px)", border: `1px solid ${accent}66`, borderRadius: 100, padding: ".3rem", display: "flex", gap: ".2rem", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          {WORK_LIST.map(w => (
            <button
              key={w.slug}
              onClick={() => { setSlug(w.slug); window.scrollTo({ top: 0 }); }}
              title={lang === "fa" ? w.fa : w.en}
              style={{
                fontFamily: lang === "fa" ? "Vazirmatn,Tahoma,sans-serif" : "Inter,sans-serif",
                fontSize: ".7rem",
                padding: ".45rem .9rem",
                border: "none",
                borderRadius: 100,
                cursor: "pointer",
                transition: "all .25s",
                background: slug === w.slug ? w.accent : "transparent",
                color: slug === w.slug ? "#1a1208" : "rgba(245,241,235,.6)",
                fontWeight: slug === w.slug ? 700 : 400,
                whiteSpace: "nowrap",
                letterSpacing: ".02em",
              }}>
              {lang === "fa" ? w.fa : w.en}
            </button>
          ))}
        </div>

        {/* View switcher */}
        <div style={{ background: "rgba(15,12,8,.92)", backdropFilter: "blur(16px)", border: `1px solid ${accent}66`, borderRadius: 24, padding: ".3rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: ".2rem", boxShadow: "0 8px 32px rgba(0,0,0,.4)", maxWidth: "min(80vw, 900px)" }}>
          {VIEW_ORDER.map(v => (
            <button key={v} onClick={() => { setView(v); window.scrollTo({ top: 0 }); }}
              style={{ fontFamily: lang === "fa" ? "Vazirmatn,Tahoma,sans-serif" : "Inter,sans-serif", fontSize: ".7rem", padding: ".45rem .8rem", border: "none", borderRadius: 100, cursor: "pointer", transition: "all .25s", background: view === v ? accent : "transparent", color: view === v ? "#1a1208" : "rgba(245,241,235,.6)", fontWeight: view === v ? 700 : 400, whiteSpace: "nowrap" }}>
              {labels[v]}
            </button>
          ))}
        </div>

        {/* Language toggle */}
        <div style={{ background: "rgba(15,12,8,.92)", backdropFilter: "blur(16px)", border: `1px solid ${accent}66`, borderRadius: 100, padding: ".3rem", display: "flex", gap: ".2rem", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          {["fa", "en"].map(L => (
            <button key={L} onClick={() => setLang(L)}
              style={{ fontFamily: "Inter,sans-serif", fontSize: ".72rem", padding: ".5rem .85rem", border: "none", borderRadius: 100, cursor: "pointer", transition: "all .25s", background: lang === L ? accent : "transparent", color: lang === L ? "#1a1208" : "rgba(245,241,235,.6)", fontWeight: lang === L ? 700 : 400, textTransform: "uppercase", letterSpacing: ".1em" }}>
              {L}
            </button>
          ))}
        </div>
      </div>

      {/* Key on slug forces the view to remount when work changes, resetting any per-work state (e.g. selected movement in sheet view). */}
      <ViewComponent key={`${slug}-${view}`} lang={lang} />

      <FeedbackWidget lang={lang} view={view} selected={null} />
    </>
  );
}
