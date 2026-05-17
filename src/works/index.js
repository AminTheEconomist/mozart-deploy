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
export const WORK_LIST = [
  {
    slug: "mozart-requiem",
    fa: "سرود روان موتزارت",
    en: "Mozart · Requiem",
    accent: "#b8893a",
    defaultView: "poetic",
  },
  {
    slug: "tora-doost-daram",
    fa: "تو را دوست دارم",
    en: "Tora Doost Daram",
    accent: "#7a1f44",
    defaultView: "sheet",
  },
];

export const DEFAULT_WORK_SLUG = "mozart-requiem";
