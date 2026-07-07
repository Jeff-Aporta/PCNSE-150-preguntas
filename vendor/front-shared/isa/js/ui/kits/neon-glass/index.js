export { NEON_COLORS, GLASS_TONES, GLASS_GRADIENTS, PAGE_MESH, MESH, RADIUS } from "./tokens.js";

export {
  useGlassColors,
  glassGradient,
  glassSurfaceSx,
  glassCardSx,
  glassInnerSx,
  glassHeaderSx,
  glassHeroSx,
  meshBodySx,
} from "./glassSurface.js";

export { GlassSurface } from "./surfaces/GlassSurface.jsx";
export { GlassCard } from "./surfaces/GlassCard.jsx";
export { GlassPanel } from "./surfaces/GlassPanel.jsx";
export { GlassSection } from "./surfaces/GlassSection.jsx";
export { GlassHero } from "./surfaces/GlassHero.jsx";
export { GlassToolbar } from "./surfaces/GlassToolbar.jsx";
export { GlassInner } from "./surfaces/GlassInner.jsx";
export { GlassTableWrap } from "./surfaces/GlassTableWrap.jsx";
export { GlassPageSurface, glassPageSurfaceSx, glassPageRootSx } from "./surfaces/GlassPageSurface.jsx";
export { NeonGlassCatalog } from "./catalog/NeonGlassCatalog.jsx";

import * as tokens from "./tokens.js";
import * as glassSurface from "./glassSurface.js";
import { GlassSurface } from "./surfaces/GlassSurface.jsx";
import { GlassCard } from "./surfaces/GlassCard.jsx";
import { GlassPanel } from "./surfaces/GlassPanel.jsx";
import { GlassSection } from "./surfaces/GlassSection.jsx";
import { GlassHero } from "./surfaces/GlassHero.jsx";
import { GlassToolbar } from "./surfaces/GlassToolbar.jsx";
import { GlassInner } from "./surfaces/GlassInner.jsx";
import { GlassTableWrap } from "./surfaces/GlassTableWrap.jsx";
import { GlassPageSurface, glassPageSurfaceSx, glassPageRootSx } from "./surfaces/GlassPageSurface.jsx";
import { NeonGlassCatalog } from "./catalog/NeonGlassCatalog.jsx";

/** Registro global — usar attachNeonGlassToISAFront() desde front-shared index.js. */
export function registerNeonGlass(ns = "ISAGlass") {
  const api = {
    ...tokens,
    ...glassSurface,
    GlassSurface,
    GlassCard,
    GlassPanel,
    GlassSection,
    GlassHero,
    GlassToolbar,
    GlassInner,
    GlassTableWrap,
    GlassPageSurface,
    glassPageSurfaceSx,
    glassPageRootSx,
    NeonGlassCatalog,
  };
  globalThis[ns] = api;
  return api;
}
