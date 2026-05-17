import { useState, useEffect } from "react";
import { WorkProvider, useWork } from "./WorkContext.jsx";
import { WORK_LIST, DEFAULT_WORK_SLUG } from "./works/index.js";
import { ViewInteractive, ViewPoetic, ViewMuseum } from "./views-classic.jsx";
import { ViewCinematic, ViewMinimal, ViewEditorial, ViewIlluminated, ViewSheetMusic, ViewPerformance } from "./views-new.jsx";
import { FeedbackWidget } from "./FeedbackWidget.jsx";
import { UpdateBanner } from "./UpdateBanner.jsx";

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

// PRIMARY views shown in the side rail / bottom bar. The other 5 view components
// (poetic, minimal, editorial, illuminated, performance) still exist in VIEWS and
// can be re-surfaced by adding their key here. Hidden for now to reduce clutter.
const VIEW_ORDER = ["sheet", "cinematic", "museum", "interactive"];

// Tiny glyph per view so the vertical rail stays readable when narrow.
const VIEW_ICON = {
  sheet: "♬",
  cinematic: "🎬",
  museum: "🏛",
  interactive: "✦",
  poetic: "✎",
  minimal: "—",
  editorial: "❡",
  illuminated: "✧",
  performance: "🎭",
};

export default function App() {
  return (
    <WorkProvider>
      <AppContent />
    </WorkProvider>
  );
}

// localStorage keys — bumped if we ever change the shape so old values get ignored.
const LS = {
  view: "mozart-deploy:view:v1",
  lang: "mozart-deploy:lang:v1",
  slug: "mozart-deploy:slug:v1",
};
function lsRead(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function lsWrite(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function AppContent() {
  const { slug, setSlug, STR } = useWork();
  // First-visit defaults: Tora Doost Daram + Persian + Sheet view (handled in
  // WorkProvider for slug, here for view/lang). On subsequent visits, restore
  // whatever the user last picked via localStorage.
  const initialWork = WORK_LIST.find(w => w.slug === slug);
  const [view, setViewRaw] = useState(() => lsRead(LS.view) || initialWork?.defaultView || "sheet");
  const [lang, setLangRaw] = useState(() => lsRead(LS.lang) || initialWork?.defaultLang || "fa");

  // Wrap setters to persist immediately.
  const setView = (v) => { setViewRaw(v); lsWrite(LS.view, v); };
  const setLang = (l) => { setLangRaw(l); lsWrite(LS.lang, l); };
  const setSlugPersist = (s) => { setSlug(s); lsWrite(LS.slug, s); };

  // Restore last-picked slug on mount (WorkProvider starts on DEFAULT_WORK_SLUG;
  // if user has visited before, swap to their last choice).
  useEffect(() => {
    const saved = lsRead(LS.slug);
    if (saved && saved !== slug && WORK_LIST.find(w => w.slug === saved)) {
      setSlug(saved);
    }
    // Run once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // NOTE: We deliberately do NOT auto-apply defaultView/defaultLang on work switch.
  // User intent (per the May 2026 nav change): switching works should preserve the
  // current view + language. Defaults apply only on the very first visit, before
  // localStorage has any saved choices.

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
        /* ─── App chrome: left rail (desktop) → bottom bar (mobile) ──────── */
        .app-left-rail { display: flex; }
        .app-bottom-bar { display: none; }
        @media (max-width: 720px) {
          .app-left-rail { display: none !important; }
          .app-bottom-bar { display: flex !important; }
          .app-content { padding-left: 0 !important; padding-bottom: 4.5rem !important; }
        }

        /* ─── Sheet view — phone layout (sidebar → horizontal pill strip) ─── */
        @media (max-width: 720px) {
          .sm-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto 1fr !important;
          }
          .sm-sidebar {
            position: static !important;
            height: auto !important;
            max-height: none !important;
            padding: .85rem .75rem !important;
          }
          .sm-sidebar-header { display: none !important; }
          .sm-sidebar-nav {
            display: flex !important;
            overflow-x: auto !important;
            gap: .4rem !important;
            padding: 0 !important;
            -webkit-overflow-scrolling: touch;
          }
          .sm-sidebar-btn {
            flex-shrink: 0 !important;
            width: auto !important;
            border-radius: 100px !important;
            padding: .5rem .85rem !important;
            border: 1px solid rgba(184,137,58,.25) !important;
            border-left: 1px solid rgba(184,137,58,.25) !important;
            border-right: 1px solid rgba(184,137,58,.25) !important;
          }
          .sm-sidebar-btn-row {
            gap: .4rem !important;
            align-items: center !important;
          }
          .sm-sidebar-btn-title {
            font-size: .85rem !important;
          }
          .sm-sidebar-btn-sub {
            display: none !important;
          }
          .sm-main { padding: 1.25rem .85rem 3rem !important; }
          .sm-header { margin-bottom: 1.25rem !important; padding-bottom: 1rem !important; }
          .sm-header-title { font-size: 1.6rem !important; line-height: 1.15 !important; }
          .sm-header-sub { font-size: .85rem !important; }
          .sm-tags { gap: .4rem !important; margin-bottom: 1.5rem !important; }
          .sm-tags > span { font-size: .72rem !important; padding: .35rem .65rem !important; }
          .sm-text { padding: 1.1rem !important; }
          .sm-text-la { font-size: 1.05rem !important; }
          .sm-text-phon { font-size: .82rem !important; padding: .4rem .55rem !important; }
          .sm-text-trans { font-size: .92rem !important; }
          .sm-player-card { padding: 1rem .85rem .85rem !important; }
          .sm-player-controls { gap: .6rem !important; }
          .sm-player-controls input[type="range"] { width: 110px !important; }
        }
      `}</style>

      {/* ─── TOP CENTER: work switcher + language toggle (compact) ─── */}
      <div style={{ position: "fixed", top: "1rem", left: "50%", transform: "translateX(-50%)", zIndex: 300, display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
        {/* Work switcher */}
        <div style={{ background: "rgba(15,12,8,.92)", backdropFilter: "blur(16px)", border: `1px solid ${accent}66`, borderRadius: 100, padding: ".3rem", display: "flex", gap: ".2rem", boxShadow: "0 8px 32px rgba(0,0,0,.4)" }}>
          {WORK_LIST.map(w => (
            <button
              key={w.slug}
              onClick={() => { setSlugPersist(w.slug); window.scrollTo({ top: 0 }); }}
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

      {/* ─── LEFT VERTICAL RAIL: view switcher (desktop ≥ 721px) ─── */}
      <div className="app-left-rail" style={{
        position: "fixed", top: "50%", left: ".75rem", transform: "translateY(-50%)",
        zIndex: 250,
        flexDirection: "column", gap: ".35rem",
        background: "rgba(15,12,8,.92)", backdropFilter: "blur(16px)",
        border: `1px solid ${accent}66`, borderRadius: 100, padding: ".35rem",
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      }}>
        {VIEW_ORDER.map(v => (
          <button
            key={v}
            onClick={() => { setView(v); window.scrollTo({ top: 0 }); }}
            title={labels[v] || v}
            style={{
              width: "2.5rem", height: "2.5rem",
              border: "none", borderRadius: 100, cursor: "pointer",
              background: view === v ? accent : "transparent",
              color: view === v ? "#1a1208" : "rgba(245,241,235,.7)",
              fontSize: "1.05rem",
              fontWeight: 600,
              transition: "all .25s",
              fontFamily: lang === "fa" ? "Vazirmatn,Tahoma,sans-serif" : "Inter,sans-serif",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {VIEW_ICON[v] || "•"}
          </button>
        ))}
      </div>

      {/* ─── BOTTOM HORIZONTAL BAR: view switcher (mobile ≤ 720px) ─── */}
      <div className="app-bottom-bar" style={{
        position: "fixed", bottom: ".75rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 250,
        gap: ".35rem",
        background: "rgba(15,12,8,.92)", backdropFilter: "blur(16px)",
        border: `1px solid ${accent}66`, borderRadius: 100, padding: ".35rem .5rem",
        boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      }}>
        {VIEW_ORDER.map(v => (
          <button
            key={v}
            onClick={() => { setView(v); window.scrollTo({ top: 0 }); }}
            title={labels[v] || v}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: ".05rem",
              minWidth: "3.6rem",
              border: "none", borderRadius: 100, cursor: "pointer",
              padding: ".4rem .55rem",
              background: view === v ? accent : "transparent",
              color: view === v ? "#1a1208" : "rgba(245,241,235,.7)",
              transition: "all .25s",
              fontFamily: lang === "fa" ? "Vazirmatn,Tahoma,sans-serif" : "Inter,sans-serif",
            }}
          >
            <span style={{ fontSize: ".95rem" }}>{VIEW_ICON[v] || "•"}</span>
            <span style={{ fontSize: ".62rem", letterSpacing: ".02em" }}>{labels[v] || v}</span>
          </button>
        ))}
      </div>

      {/* Main content — left-padded to clear the rail on desktop, no padding on mobile */}
      <div className="app-content" style={{ paddingLeft: "4.5rem" }}>
        {/* Key on slug+view forces the view to remount when either changes, resetting any per-work state. */}
        <ViewComponent key={`${slug}-${view}`} lang={lang} />
      </div>

      <FeedbackWidget lang={lang} view={view} selected={null} />
      <UpdateBanner lang={lang} />
    </>
  );
}
