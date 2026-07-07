/**
 * Tarjeta glass neon — degradados internos (login, paneles).
 * Para componentes React (GlassCard, GlassPanel…) usar ISAFront.Glass.glassCardSx(c, extra).
 * Este módulo exporta glassCardSx(extra) con callbacks de tema MUI (login / Paper simple).
 */

export const GLASS_CARD_CLASS = "isa-glass-card";

/** Degradados radiales internos (oscuro / claro). */
export const glassCardMesh = {
  dark:
    "radial-gradient(ellipse 90% 55% at 15% -8%, rgba(99,102,241,0.22), transparent 52%), "
    + "radial-gradient(ellipse 70% 45% at 92% 5%, rgba(0,229,255,0.1), transparent 48%), "
    + "radial-gradient(ellipse 50% 30% at 50% 100%, rgba(30,144,255,0.08), transparent 55%)",
  light:
    "radial-gradient(ellipse 90% 55% at 15% -8%, rgba(30,144,255,0.14), transparent 52%), "
    + "radial-gradient(ellipse 70% 45% at 92% 5%, rgba(99,102,241,0.08), transparent 48%)",
};

/** sx MUI — misma superficie que .isa-glass-card (usar className + sx layout). */
export function glassCardSx(extra = {}) {
  return {
    borderRadius: 2.5,
    overflow: "hidden",
    border: 1,
    borderColor: (t) => (t.palette.mode === "dark" ? "rgba(99,102,241,0.35)" : "rgba(30,144,255,0.22)"),
    bgcolor: (t) => (t.palette.mode === "dark" ? "rgba(15,23,42,0.72)" : "rgba(255,255,255,0.82)"),
    backdropFilter: "blur(14px) saturate(150%)",
    WebkitBackdropFilter: "blur(14px) saturate(150%)",
    backgroundImage: (t) => (t.palette.mode === "dark" ? glassCardMesh.dark : glassCardMesh.light),
    boxShadow: (t) => (t.palette.mode === "dark"
      ? "0 0 0 1px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.45), 0 0 48px rgba(30,144,255,0.12)"
      : "0 8px 32px rgba(15,23,42,0.07), 0 0 24px rgba(30,144,255,0.08)"),
    ...extra,
  };
}

/** Login / modal — ancho estándar sobre glassCardSx. */
export function loginCardSx(extra = {}) {
  return glassCardSx({ width: "100%", maxWidth: 440, ...extra });
}

/** Props Paper MUI con clase + sx glass estándar. */
export function glassCardPaperProps(extraSx = {}, extra = {}) {
  const { sx: sxExtra, className, ...rest } = extra;
  return {
    elevation: 0,
    className: [GLASS_CARD_CLASS, className].filter(Boolean).join(" "),
    sx: glassCardSx({ ...(sxExtra || {}), ...(typeof extraSx === "object" ? extraSx : {}) }),
    ...rest,
  };
}
