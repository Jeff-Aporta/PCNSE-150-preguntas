/** Estilo login alineado con driver JSX de tickets (gradiente + tarjeta glass neon). */
import {
  GLASS_CARD_CLASS,
  glassCardMesh,
  glassCardSx,
  loginCardSx,
  glassCardPaperProps,
} from "../glass-card-surface.js";

export { GLASS_CARD_CLASS, glassCardMesh, glassCardSx, loginCardSx, glassCardPaperProps };

export const LOGIN_SUBTITLE_DEFAULT =
  "Use su usuario y contraseña de la organización. La misma sesión sirve en todas las aplicaciones.";

export const CONTAPYME_LOGIN_ID_HELPER = "Puede omitir @contapyme.com; se envía en minúsculas.";

export const LOGIN_REMEMBER_LABEL = "Recordarme";

/** Props comunes del campo Usuario en modales de login Jeff-Aporta. */
export function contapymeLoginTextFieldProps(extra = {}) {
  const { inputProps: extraInputProps, slotProps: extraSlotProps, ...rest } = extra;
  const htmlInput = {
    spellCheck: false,
    autoCorrect: "off",
    autoCapitalize: "none",
    ...extraInputProps,
    ...(extraSlotProps?.htmlInput || {}),
  };
  return {
    label: "Usuario",
    autoComplete: "username",
    ...rest,
    inputProps: htmlInput,
    slotProps: {
      ...(extraSlotProps || {}),
      htmlInput,
    },
  };
}

/** Icono iconify estándar login (no depende de registerWidgets). */
export function createLoginIcon(React) {
  return function LoginIcon(props) {
    return React.createElement("iconify-icon", {
      icon: props.icon,
      style: {
        fontSize: props.size || 20,
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "middle",
        ...(props.style || {}),
      },
    });
  };
}

/** UI de login con Icon garantizado (window[ns].UI o fallback). */
export function resolveLoginUi(ns) {
  const React = typeof window !== "undefined" ? window.React : null;
  const src = (ns && typeof window !== "undefined" && window[ns]?.UI) ? window[ns].UI : {};
  const Icon = src.Icon || (React ? createLoginIcon(React) : null);
  return { ...src, Icon };
}

export function loginPageSx(extra = {}) {
  return {
    flex: 1,
    minHeight: "100vh",
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    p: { xs: 2, sm: 3 },
    background: (t) =>
      t.palette.mode === "dark"
        ? "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(99,102,241,0.18), transparent 55%), linear-gradient(180deg, #0b1220 0%, #0f172a 100%)"
        : "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(30,144,255,0.12), transparent 55%), linear-gradient(180deg, #f0f6ff 0%, #f8fafc 100%)",
    ...extra,
  };
}

/** Re-exportado desde glass-card-surface.js — loginCardSx({ maxWidth: 440, … }). */

export function loginHeaderBandSx(accent = "#1e90ff") {
  return {
    px: { xs: 2, sm: 2.5 },
    py: 2,
    minHeight: 64,
    display: "flex",
    alignItems: "center",
    borderBottom: 1,
    borderColor: (t) => (t.palette.mode === "dark" ? "rgba(99,102,241,0.25)" : "divider"),
    background: (t) =>
      t.palette.mode === "dark"
        ? `linear-gradient(90deg, ${accent}44, rgba(99,102,241,0.12) 45%, transparent 75%)`
        : `linear-gradient(90deg, ${accent}1f, transparent 70%)`,
    borderLeft: 4,
    borderLeftColor: accent,
    boxShadow: (t) =>
      t.palette.mode === "dark" ? `inset 0 -1px 0 rgba(0,229,255,0.08)` : "none",
  };
}

export function loginHeaderTitleSx() {
  return {
    fontWeight: 700,
    letterSpacing: -0.35,
    fontSize: { xs: "1.35rem", sm: "1.5rem" },
    lineHeight: 1.15,
  };
}

export function loginIconBoxSx(accent = "#1e90ff") {
  return {
    width: 42,
    height: 42,
    borderRadius: 1.75,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
    color: "#fff",
    boxShadow: (t) =>
      t.palette.mode === "dark"
        ? `0 4px 16px ${accent}66, 0 0 20px rgba(0,229,255,0.15)`
        : `0 4px 12px ${accent}44`,
  };
}

/** Banda superior estilo SectionCard (tk JSX). */
export function LoginHeaderBand(React, MUI, UI, { icon, title, accent, ns }) {
  const color = accent || "#1e90ff";
  const Icon = UI?.Icon || createLoginIcon(React);
  return React.createElement(
    MUI.Box,
    { sx: loginHeaderBandSx(color) },
    React.createElement(
      MUI.Stack,
      { direction: "row", spacing: 1.25, alignItems: "center" },
      React.createElement(
        MUI.Box,
        { sx: loginIconBoxSx(color) },
        React.createElement(Icon, { icon: icon || "mdi:shield-key-outline", size: 24 }),
      ),
      React.createElement(MUI.Typography, {
        variant: "h5",
        component: "h2",
        sx: loginHeaderTitleSx(),
      }, title),
    ),
  );
}

export function loginDialogBackdropSx() {
  return {
    backdropFilter: "blur(6px)",
    WebkitBackdropFilter: "blur(6px)",
    backgroundColor: "rgba(11,18,32,0.55)",
  };
}

/** Props MUI Dialog compartidas (modal login Jeff-Aporta). */
export function loginDialogProps(extra = {}) {
  const { PaperProps, slotProps, ...rest } = extra;
  return {
    maxWidth: "xs",
    fullWidth: true,
    className: "isa-login-dialog",
    slotProps: {
      backdrop: { sx: loginDialogBackdropSx() },
      ...(slotProps || {}),
    },
    PaperProps: {
      className: `isa-login-card ${GLASS_CARD_CLASS}`,
      sx: loginCardSx({ maxWidth: 440, m: 1 }),
      ...(PaperProps || {}),
    },
    ...rest,
  };
}
