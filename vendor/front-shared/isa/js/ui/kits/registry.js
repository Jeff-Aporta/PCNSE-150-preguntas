/**
 * Registro de kits visuales (look & feel). Cada kit vive en ui/kits/<id>/.
 * Hoy: neon-glass. Futuros kits: ui/kits/<otro>/ sin tocar core ni shell.
 */
import { attachNeonGlassToISAFront } from "./neon-glass/register.js";
import { KIT_ID as NEON_GLASS_KIT_ID } from "./neon-glass/kit-meta.js";

export { NEON_GLASS_KIT_ID, attachNeonGlassToISAFront };

/** Kit activo por defecto del ecosistema Jeff-Aporta. */
export function attachDefaultKit() {
  return attachNeonGlassToISAFront();
}
