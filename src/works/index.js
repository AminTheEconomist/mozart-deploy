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
export const WORK_LIST = [
  {
    slug: "mozart-requiem",
    fa: "سرود روان موتزارت",
    en: "Mozart · Requiem",
    accent: "#b8893a",
  },
  {
    slug: "tora-doost-daram",
    fa: "تو را دوست دارم",
    en: "Tora Doost Daram",
    accent: "#7a1f44",
  },
];

export const DEFAULT_WORK_SLUG = "mozart-requiem";
