// ─── WORKS REGISTRY ─────────────────────────────────────────────────────────
// Each work module exports the same shape: { movements, themes, STR, arcPoints }.
// To add a new work: create src/works/<slug>.js, then add it here.

import * as mozartRequiem from "./mozart-requiem.js";
import * as toraDoostDaram from "./tora-doost-daram.js";

export const WORKS = {
  "mozart-requiem": mozartRequiem,
  "tora-doost-daram": toraDoostDaram,
};

// Order shown in the work switcher.
// `defaultView` is the view the user lands on when this work is selected
// (sheet music for short scored pieces, poetic hero for big liturgical works).
// `defaultLang` is the language the UI switches to when this work is selected.
// Both works default to Persian — this is an Iranian-Canadian project and the
// contemplative framing is built in Persian first; users can toggle to English
// via the FA/EN pill.
export const WORK_LIST = [
  {
    slug: "mozart-requiem",
    fa: "سرود روان موتزارت",
    en: "Mozart · Requiem",
    accent: "#b8893a",
    defaultView: "sheet",     // user wants scores-first landing for both works
    defaultLang: "fa",
    defaultSection: "first",  // Introit — the entrance to the Mass
  },
  {
    slug: "tora-doost-daram",
    fa: "تو را دوست دارم",
    en: "Tora Doost Daram",
    accent: "#7a1f44",
    defaultView: "sheet",
    defaultLang: "fa",
    defaultSection: "last",  // Climax — the "tora doost daram" affirmation
  },
];

// First-time landing work (when no localStorage state exists). Tora opens the
// site because the choral arrangement is short, scored, and immediately playable —
// a stronger first impression than Mozart's hero. After the first visit, the
// user's last choice is remembered via localStorage.
export const DEFAULT_WORK_SLUG = "tora-doost-daram";
