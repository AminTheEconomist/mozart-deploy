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
    defaultView: "poetic",
    defaultLang: "fa",
  },
  {
    slug: "tora-doost-daram",
    fa: "تو را دوست دارم",
    en: "Tora Doost Daram",
    accent: "#7a1f44",
    defaultView: "sheet",
    defaultLang: "fa",
  },
];

export const DEFAULT_WORK_SLUG = "mozart-requiem";
