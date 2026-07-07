import { GLASS_GRADIENTS } from "./tokens.js";

const { useTheme } = MaterialUI;

export function useGlassColors() {
  const dark = useTheme().palette.mode === "dark";
  return {
    dark,
    pageBg: "transparent",
    cardBg: dark ? "rgba(15, 34, 54, 0.28)" : "rgba(255, 255, 255, 0.82)",
    cardHi: dark ? "rgba(26, 58, 92, 0.38)" : "rgba(255, 255, 255, 0.90)",
    border: dark ? "rgba(30,144,255,0.28)" : "rgba(30,144,255,0.18)",
    text: dark ? "#e8f4ff" : "#0a2540",
    muted: dark ? "#9ec5eb" : "#4a6278",
    preBg: dark ? "rgba(13, 33, 55, 0.45)" : "rgba(232, 238, 245, 0.55)",
    errTint: dark ? "rgba(211,47,47,0.08)" : "rgba(211,47,47,0.06)",
    warnTint: dark ? "rgba(237,108,2,0.08)" : "rgba(237,108,2,0.06)",
  };
}

export function glassGradient(dark, tone = "default") {
  const palette = dark ? GLASS_GRADIENTS.dark : GLASS_GRADIENTS.light;
  return palette[tone] || palette.default;
}

function glassShadow(dark, neon) {
  if (!dark || !neon) {
    return dark
      ? "0 4px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "0 4px 20px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.92)";
  }
  return "0 8px 32px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(30,144,255,0.1)";
}

/** Superficie glass base (panel, card, toolbar). */
export function glassSurfaceSx(c, opts = {}) {
  const {
    tone = "default",
    accent,
    borderColor,
    borderWidth,
    neon = "auto",
    hover = false,
    radius = "0.75rem",
    blur = 16,
    ...extra
  } = opts;
  const dark = c.dark;
  const useNeon = neon === "auto" ? dark : !!neon;
  const accentRgb = accent || c.border;
  const hoverSx =
    hover && useNeon
      ? {
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          "&:hover": {
            transform: { sm: "translateY(-2px)" },
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.35), 0 0 24px ${accentRgb}33`,
          },
        }
      : hover
        ? {
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": { transform: { sm: "translateY(-1px)" } },
          }
        : {};

  return {
    borderRadius: radius,
    overflow: "hidden",
    background: glassGradient(dark, tone),
    backgroundColor: dark ? "transparent" : "rgba(255, 255, 255, 0.78)",
    border: 1,
    borderStyle: "solid",
    borderColor: borderColor || accentRgb || c.border,
    ...(borderWidth != null ? { borderWidth } : {}),
    color: c.text,
    backdropFilter: `blur(${blur}px) saturate(140%)`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(140%)`,
    boxShadow: glassShadow(dark, useNeon),
    ...hoverSx,
    ...extra,
  };
}

export function glassCardSx(c, extra = {}) {
  return glassSurfaceSx(c, { tone: "default", hover: true, ...extra });
}

export function glassInnerSx(c, tone = "node", extra = {}) {
  const dark = c.dark;
  return {
    background: glassGradient(dark, tone),
    backgroundColor: dark ? "transparent" : "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
    ...extra,
  };
}

export function glassHeaderSx(c, accent = "#1e90ff", extra = {}) {
  const dark = c.dark;
  return {
    borderBottom: 1,
    borderColor: c.border,
    borderLeft: 4,
    borderLeftColor: accent,
    ...(dark
      ? {
          background: `linear-gradient(90deg, ${accent}28, transparent 72%)`,
        }
      : {
          background: `${accent}12`,
        }),
    ...extra,
  };
}

export function glassHeroSx(dark, extra = {}) {
  return {
    position: "relative",
    overflow: "hidden",
    borderRadius: "0.75rem",
    color: dark ? "#fff" : undefined,
    background: dark
      ? "linear-gradient(135deg, #0b2e4e 0%, #1e5a8a 38%, #1e90ff 72%, #6366f1 100%)"
      : "linear-gradient(135deg, #dbeafe 0%, #e8f4ff 38%, #f0f7ff 72%, #ffffff 100%)",
    border: dark ? "none" : "1px solid rgba(148, 163, 184, 0.22)",
    boxShadow: dark ? "0 20px 60px rgba(30,144,255,0.25)" : "0 8px 32px rgba(30,144,255,0.12)",
    ...extra,
  };
}

export function meshBodySx(dark) {
  return {
    position: "relative",
    zIndex: 1,
    minHeight: "100%",
    background: dark ? undefined : undefined,
  };
}
