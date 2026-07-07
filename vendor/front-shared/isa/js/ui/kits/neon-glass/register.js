/**
 * Registra kit neon-glass en ISAFront.Glass (+ alias ISAGlass, ISAFront.Kits.neonGlass).
 */
import { registerNeonGlass } from "./index.js";
import { KIT_ID } from "./kit-meta.js";
import { ensureKitCss } from "../kit-assets.js";

export function attachNeonGlassToISAFront(ns = "ISAGlass") {
  ensureKitCss(KIT_ID);
  const api = { ...registerNeonGlass(ns), kitId: KIT_ID };
  if (typeof window !== "undefined") {
    window.ISAFront = window.ISAFront || {};
    window.ISAFront.Glass = api;
    window.ISAFront.Kits = window.ISAFront.Kits || {};
    window.ISAFront.Kits.neonGlass = api;
    window.ISAFront.activeKit = KIT_ID;
  }
  return api;
}
