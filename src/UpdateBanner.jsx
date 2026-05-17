// ─── UPDATE BANNER ──────────────────────────────────────────────────────────
// Detects when a newer build has been deployed (the index.html on the server
// references a different bundle hash than the one currently loaded in this tab)
// and shows a small banner offering a one-click reload. Trigger checks happen
// when the tab becomes visible again (most common cause of staleness: user left
// the tab open through a deploy) and every 2 minutes while focused.
//
// Why this exists: Vercel's edge cache occasionally returns stale HTML despite
// the `cache-control: no-store` headers we send. Without this check, the user
// can see an old bundle indefinitely until they remember to hard-refresh.

import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 120_000; // every 2 minutes while focused

function getCurrentBundleHash() {
  const src = document.querySelector('script[type="module"]')?.src || "";
  const m = src.match(/index-([a-f0-9]+)\.js/);
  return m ? m[1] : null;
}

async function fetchLatestBundleHash() {
  try {
    // Cache-busting query param + no-store ensures we hit the origin and not
    // a stale CDN edge cache.
    const res = await fetch(`/?_v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const html = await res.text();
    const m = html.match(/index-([a-f0-9]+)\.js/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

export function UpdateBanner({ lang = "fa" }) {
  const [hasUpdate, setHasUpdate] = useState(false);
  const current = getCurrentBundleHash();

  useEffect(() => {
    if (!current) return;
    let cancelled = false;

    const check = async () => {
      const latest = await fetchLatestBundleHash();
      if (cancelled) return;
      if (latest && latest !== current) setHasUpdate(true);
    };

    // Check now (catches the case where the tab was open during a deploy).
    check();

    // Check whenever the tab becomes visible again.
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);

    // Periodic check while open.
    const iv = setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      clearInterval(iv);
    };
  }, [current]);

  if (!hasUpdate) return null;

  const t = lang === "fa"
    ? { msg: "نسخه جدید سایت آماده است", btn: "بارگذاری مجدد", dismiss: "✕" }
    : { msg: "A newer version of this site is ready", btn: "Reload", dismiss: "✕" };

  return (
    <div style={{
      position: "fixed",
      bottom: "1rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 400,
      background: "#1a1208",
      color: "#f3ead5",
      border: "1px solid #b8893a",
      borderRadius: 100,
      padding: ".55rem 1rem .55rem 1.25rem",
      display: "flex",
      alignItems: "center",
      gap: ".75rem",
      fontFamily: lang === "fa" ? "Vazirmatn,Inter,Tahoma,sans-serif" : "Inter,sans-serif",
      fontSize: ".82rem",
      boxShadow: "0 8px 32px rgba(0,0,0,.4)",
      direction: lang === "fa" ? "rtl" : "ltr",
    }}>
      <span>{t.msg}</span>
      <button
        onClick={() => location.reload()}
        style={{
          background: "#b8893a",
          color: "#1a1208",
          border: "none",
          borderRadius: 100,
          padding: ".4rem .9rem",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: ".78rem",
          letterSpacing: ".03em",
          fontFamily: "inherit",
        }}
      >
        {t.btn}
      </button>
      <button
        onClick={() => setHasUpdate(false)}
        title="Dismiss"
        style={{
          background: "transparent",
          color: "rgba(245,241,235,.5)",
          border: "none",
          cursor: "pointer",
          fontSize: ".95rem",
          padding: 0,
          lineHeight: 1,
        }}
      >
        {t.dismiss}
      </button>
    </div>
  );
}
