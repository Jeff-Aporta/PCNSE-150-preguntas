/** Card en columna flex: el shell limita altura; el body hace scroll. */
export const CARD_SHELL = {
  flex: "1 1 0",
  minHeight: 0,
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
} as const;

export const CARD_SCROLL_BODY = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  WebkitOverflowScrolling: "touch",
  pr: 0.5,
} as const;

/** Scroll con maxHeight fijo (quiz: pregunta/opciones dentro de una card). */
export const CARD_SCROLL = {
  ...CARD_SCROLL_BODY,
  flex: "none",
  maxHeight: { xs: "min(40vh, 420px)", sm: "min(46vh, 480px)" },
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
