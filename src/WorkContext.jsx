// ─── WORK CONTEXT ───────────────────────────────────────────────────────────
// Provides the currently-selected work's content to all descendants.
// Replaces the old direct imports from ./content.js — every view now reads
// movements / themes / STR / arcPoints from useWork() instead of importing.

import { createContext, useContext, useMemo, useState } from "react";
import { WORKS, DEFAULT_WORK_SLUG } from "./works/index.js";

const WorkContext = createContext(null);

export function WorkProvider({ children, initialSlug = DEFAULT_WORK_SLUG }) {
  const [slug, setSlug] = useState(initialSlug);

  const value = useMemo(() => {
    const w = WORKS[slug] || WORKS[DEFAULT_WORK_SLUG];
    return {
      slug,
      setSlug,
      movements: w.movements,
      themes: w.themes,
      STR: w.STR,
      arcPoints: w.arcPoints,
    };
  }, [slug]);

  return <WorkContext.Provider value={value}>{children}</WorkContext.Provider>;
}

export function useWork() {
  const ctx = useContext(WorkContext);
  if (!ctx) {
    throw new Error("useWork() must be called inside <WorkProvider>");
  }
  return ctx;
}
