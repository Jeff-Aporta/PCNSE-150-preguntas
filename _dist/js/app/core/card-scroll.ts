/** Scroll interno en CardContent cuando el contenido desborda. */
export const CARD_SCROLL = {
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  maxHeight: { xs: "min(40vh, 420px)", sm: "min(46vh, 480px)" },
  pr: 0.5,
} as const;

export const CARD_SCROLL_TALL = {
  ...CARD_SCROLL,
  maxHeight: { xs: "min(52vh, 520px)", sm: "min(58vh, 580px)" },
} as const;

export const CHIP_PAD = {
  height: "auto",
  px: 0.5,
  py: 0.25,
  "& .MuiChip-label": { px: 1.1, py: 0.45, lineHeight: 1.35 },
  "& .MuiChip-icon": { ml: 0.85, mr: -0.15 },
} as const;
