/** Design tokens — isa-patyia chat + tk-doc + swagger viewer. */

export const NEON_COLORS = {
  blue: "#1e90ff",
  cyan: "#00e5ff",
  purple: "#6366f1",
  magenta: "#a855f7",
  green: "#22c55e",
  amber: "#f59e0b",
  red: "#ef4444",
};

export const GLASS_TONES = [
  "default",
  "hi",
  "blue",
  "warn",
  "err",
  "success",
  "purple",
  "node",
  "chip",
];

export const GLASS_GRADIENTS = {
  dark: {
    default:
      "linear-gradient(165deg, rgba(30,144,255,0.12) 0%, rgba(99,102,241,0.07) 38%, rgba(15,34,54,0.26) 100%)",
    hi: "linear-gradient(145deg, rgba(30,144,255,0.20) 0%, rgba(0,229,255,0.08) 45%, rgba(26,58,92,0.32) 100%)",
    blue: "linear-gradient(160deg, rgba(30,144,255,0.14) 0%, rgba(15,34,54,0.22) 100%)",
    warn: "linear-gradient(155deg, rgba(237,108,2,0.14) 0%, rgba(237,108,2,0.05) 40%, rgba(15,34,54,0.24) 100%)",
    err: "linear-gradient(155deg, rgba(244,67,54,0.14) 0%, rgba(244,67,54,0.05) 40%, rgba(15,34,54,0.24) 100%)",
    success: "linear-gradient(155deg, rgba(34,197,94,0.14) 0%, rgba(34,197,94,0.05) 40%, rgba(15,34,54,0.24) 100%)",
    purple: "linear-gradient(160deg, rgba(168,85,247,0.14) 0%, rgba(99,102,241,0.08) 50%, rgba(15,34,54,0.22) 100%)",
    node: "linear-gradient(160deg, rgba(30,144,255,0.09) 0%, rgba(99,102,241,0.05) 50%, rgba(15,34,54,0.20) 100%)",
    chip: "linear-gradient(145deg, rgba(30,144,255,0.14) 0%, rgba(26,58,92,0.28) 100%)",
  },
  light: {
    default:
      "linear-gradient(165deg, rgba(30,144,255,0.04) 0%, rgba(99,102,241,0.025) 38%, rgba(255,255,255,0.84) 100%)",
    hi: "linear-gradient(145deg, rgba(30,144,255,0.05) 0%, rgba(248,252,255,0.88) 55%, rgba(255,255,255,0.92) 100%)",
    blue: "linear-gradient(160deg, rgba(30,144,255,0.04) 0%, rgba(255,255,255,0.86) 100%)",
    warn: "linear-gradient(155deg, rgba(237,108,2,0.04) 0%, rgba(255,255,255,0.84) 100%)",
    err: "linear-gradient(155deg, rgba(244,67,54,0.035) 0%, rgba(255,255,255,0.84) 100%)",
    success: "linear-gradient(155deg, rgba(34,197,94,0.04) 0%, rgba(255,255,255,0.84) 100%)",
    purple: "linear-gradient(160deg, rgba(168,85,247,0.04) 0%, rgba(255,255,255,0.86) 100%)",
    node: "linear-gradient(160deg, rgba(30,144,255,0.03) 0%, rgba(255,255,255,0.86) 100%)",
    chip: "linear-gradient(145deg, rgba(30,144,255,0.04) 0%, rgba(255,255,255,0.88) 100%)",
  },
};

export const PAGE_MESH = {
  fallback: { light: "#eef6fc", dark: "#040a14" },
};

/** Alias retrocompatible */
export const MESH = PAGE_MESH;

export const RADIUS = {
  sm: "0.5rem",
  md: "0.75rem",
  lg: "14px",
};
