/**
 * William Quest — Front minimal (sin login, sin backend).
 * Solo Theme + UI base + helpers. Sin Auth, sin Session, sin Form controllers.
 */
(function () {
  "use strict";

  // ─────────────────────────────────────────────
  // Theme — neon glass dark / light
  // ─────────────────────────────────────────────
  const DODGER = "#1e90ff";
  const NEON = {
    blue: DODGER,
    cyan: "#00e5ff",
    purple: "#6366f1",
    magenta: "#a855f7",
  };

  function makeDodgerTheme(MUI, mode) {
    const dark = mode === "dark";
    return MUI.createTheme({
      palette: {
        mode,
        primary: { main: NEON.blue, light: "#63b3ff", dark: "#1565c0" },
        secondary: { main: NEON.purple, light: "#818cf8", dark: "#4f46e5" },
        info: { main: NEON.cyan, contrastText: "#042a3a" },
        success: { main: "#10b981", light: "#34d399", contrastText: "#fff" },
        error: { main: "#ef4444", light: "#f87171", contrastText: "#fff" },
        warning: { main: "#f59e0b", light: "#fbbf24", contrastText: "#1a1a1a" },
        background: dark
          ? { default: "#060d18", paper: "#0f2236" }
          : { default: "#eef4ff", paper: "#ffffff" },
        text: dark
          ? { primary: "#e8f4ff", secondary: "#9ec5eb" }
          : { primary: "#0a2540", secondary: "#4a6278" },
        divider: dark ? "rgba(30,144,255,0.18)" : "rgba(10,37,64,0.1)",
      },
      shape: { borderRadius: 12 },
      typography: {
        fontFamily: '"IBM Plex Sans", "Space Grotesk", system-ui, sans-serif',
        h3: { fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif', fontWeight: 700, letterSpacing: -0.5 },
        h4: { fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif', fontWeight: 700, letterSpacing: -0.5 },
        h5: { fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif', fontWeight: 700 },
        h6: { fontFamily: '"Space Grotesk", "IBM Plex Sans", sans-serif', fontWeight: 600 },
        button: { fontWeight: 600, letterSpacing: 0.2 },
      },
      components: {
        MuiCssBaseline: {
          styleOverrides: {
            body: ({ theme }) =>
              theme.palette.mode === "dark"
                ? {
                    background:
                      "radial-gradient(ellipse 90% 55% at 15% -8%, rgba(99,102,241,0.22), transparent 52%), " +
                      "radial-gradient(ellipse 70% 45% at 92% 5%, rgba(0,229,255,0.10), transparent 48%), " +
                      "radial-gradient(ellipse 50% 30% at 50% 100%, rgba(30,144,255,0.08), transparent 55%), " +
                      "linear-gradient(180deg, #060d18 0%, #0a1628 45%, #0f172a 100%)",
                    backgroundAttachment: "fixed",
                    color: "#e8f4ff",
                  }
                : {
                    background:
                      "radial-gradient(ellipse 90% 55% at 15% -8%, rgba(30,144,255,0.14), transparent 52%), " +
                      "radial-gradient(ellipse 70% 45% at 92% 5%, rgba(99,102,241,0.08), transparent 48%), " +
                      "linear-gradient(180deg, #eef4ff 0%, #f5f9ff 50%, #f8fafc 100%)",
                    backgroundAttachment: "fixed",
                    color: "#0a2540",
                  },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: { textTransform: "none", borderRadius: 10 },
            containedPrimary: {
              boxShadow: "0 0 20px rgba(30,144,255,0.35)",
              "&:hover": { boxShadow: "0 0 28px rgba(30,144,255,0.55)" },
            },
            outlinedPrimary: {
              borderColor: "rgba(30,144,255,0.55)",
              "&:hover": {
                borderColor: "rgba(0,229,255,0.85)",
                backgroundColor: "rgba(30,144,255,0.08)",
                boxShadow: "0 0 18px rgba(30,144,255,0.25)",
              },
            },
          },
        },
        MuiAppBar: {
          styleOverrides: {
            root: ({ theme }) =>
              theme.palette.mode === "dark"
                ? {
                    background:
                      "linear-gradient(90deg, rgba(6,13,24,0.92) 0%, rgba(15,35,70,0.88) 48%, rgba(35,18,65,0.94) 100%)",
                    backdropFilter: "blur(14px) saturate(160%)",
                    WebkitBackdropFilter: "blur(14px) saturate(160%)",
                    borderBottom: "1px solid rgba(30,144,255,0.32)",
                    boxShadow:
                      "0 4px 32px rgba(30,144,255,0.12), inset 0 -1px 0 rgba(0,229,255,0.10)",
                    color: theme.palette.text.primary,
                  }
                : {
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(240,247,255,0.92) 50%, rgba(248,250,255,0.96) 100%)",
                    backdropFilter: "blur(12px) saturate(160%)",
                    borderBottom: "1px solid rgba(30,144,255,0.22)",
                    boxShadow: "0 4px 24px rgba(30,144,255,0.08)",
                    color: theme.palette.text.primary,
                  },
          },
        },
        MuiPaper: {
          styleOverrides: {
            root: ({ theme }) => ({
              backgroundImage: "none",
              ...(theme.palette.mode === "dark" ? { backdropFilter: "blur(10px)" } : {}),
            }),
            outlined: ({ theme }) =>
              theme.palette.mode === "dark"
                ? {
                    background: "linear-gradient(145deg, rgba(15,34,54,0.78), rgba(11,18,32,0.9))",
                    borderColor: "rgba(30,144,255,0.22)",
                    boxShadow:
                      "0 8px 32px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)",
                  }
                : {
                    background: "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(240,247,255,0.88))",
                    borderColor: "rgba(30,144,255,0.16)",
                    boxShadow: "0 8px 28px rgba(15,23,42,0.06)",
                  },
          },
        },
        MuiCard: {
          styleOverrides: {
            root: ({ theme }) =>
              theme.palette.mode === "dark"
                ? {
                    background:
                      "linear-gradient(145deg, rgba(15,34,54,0.72) 0%, rgba(11,18,32,0.88) 100%)",
                    border: "1px solid rgba(30,144,255,0.22)",
                    backdropFilter: "blur(14px) saturate(150%)",
                    WebkitBackdropFilter: "blur(14px) saturate(150%)",
                    boxShadow:
                      "0 8px 32px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 28px rgba(30,144,255,0.08)",
                  }
                : {
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(240,247,255,0.92) 100%)",
                    border: "1px solid rgba(30,144,255,0.18)",
                    backdropFilter: "blur(12px) saturate(150%)",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
                  },
          },
        },
        MuiTab: {
          styleOverrides: {
            root: {
              textTransform: "none",
              transition: "color 0.2s, text-shadow 0.2s",
              "&.Mui-selected": { textShadow: "0 0 14px rgba(30,144,255,0.55)" },
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              height: 3,
              borderRadius: 2,
              background: "linear-gradient(90deg, #1e90ff, #6366f1, #00e5ff)",
              boxShadow: "0 0 14px rgba(30,144,255,0.75)",
            },
          },
        },
        MuiIconButton: {
          styleOverrides: {
            root: {
              transition: "box-shadow 0.2s, background-color 0.2s",
              "&:hover": { boxShadow: "0 0 14px rgba(30,144,255,0.30)" },
            },
          },
        },
        MuiDialog: {
          styleOverrides: {
            paper: ({ theme }) => ({
              backgroundImage: "none",
              borderRadius: 14,
              ...(theme.palette.mode === "dark"
                ? {
                    background:
                      "linear-gradient(145deg, rgba(15,34,54,0.96), rgba(11,18,32,0.98))",
                    border: "1px solid rgba(30,144,255,0.32)",
                    boxShadow:
                      "0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 60px rgba(30,144,255,0.10)",
                    color: theme.palette.text.primary,
                  }
                : {
                    background:
                      "linear-gradient(145deg, rgba(255,255,255,0.98), rgba(240,247,255,0.94))",
                    border: "1px solid rgba(30,144,255,0.22)",
                    boxShadow: "0 12px 32px rgba(15,23,42,0.10)",
                    color: theme.palette.text.primary,
                  }),
            }),
          },
        },
      },
    });
  }

  const themeStores = new Map();

  function readStoredMode(lsKey) {
    try {
      const v = localStorage.getItem(lsKey);
      if (v === "light" || v === "dark") return v;
    } catch (e) {}
    return "dark";
  }

  function applyDomColorScheme(mode) {
    try {
      document.documentElement.setAttribute("data-mui-color-scheme", mode);
      document.documentElement.style.colorScheme = mode;
    } catch (e) {}
  }

  function getThemeStore(lsKey) {
    if (!themeStores.has(lsKey)) {
      let mode = readStoredMode(lsKey);
      const listeners = new Set();
      applyDomColorScheme(mode);
      themeStores.set(lsKey, {
        getMode: () => mode,
        subscribe(fn) {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
        setMode(next) {
          if (next !== "light" && next !== "dark") return;
          if (next === mode) return;
          mode = next;
          try {
            localStorage.setItem(lsKey, mode);
          } catch (e) {}
          applyDomColorScheme(mode);
          listeners.forEach((fn) => {
            try {
              fn(mode);
            } catch (e) {}
          });
        },
        toggle() {
          this.setMode(mode === "dark" ? "light" : "dark");
        },
      });
    }
    return themeStores.get(lsKey);
  }

  function createThemeApi(React, MUI, lsKey) {
    function useThemeMode() {
      const store = getThemeStore(lsKey);
      const [mode, setMode] = React.useState(() => store.getMode());
      React.useEffect(() => store.subscribe(setMode), [store]);
      const toggle = React.useCallback(() => store.toggle(), [store]);
      const theme = React.useMemo(() => makeDodgerTheme(MUI, mode), [mode]);
      return { mode, toggle, theme };
    }
    return { makeTheme: (mode) => makeDodgerTheme(MUI, mode), useThemeMode, DODGER };
  }

  // ─────────────────────────────────────────────
  // Icon component — usa <iconify-icon> ya cargado
  // ─────────────────────────────────────────────
  function createIcon(React) {
    return function Icon({ icon, size = 18, color, style, ...rest }) {
      const styleObj =
        style && typeof style === "object" && !Array.isArray(style)
          ? { ...style, ...(color ? { color } : {}) }
          : color
          ? { color }
          : undefined;
      return React.createElement("iconify-icon", {
        icon: icon,
        width: typeof size === "number" ? `${size}px` : size,
        height: typeof size === "number" ? `${size}px` : size,
        ...(styleObj ? { style: styleObj } : {}),
        ...rest,
      });
    };
  }

  // ─────────────────────────────────────────────
  // Locale — ES/EN
  // ─────────────────────────────────────────────
  const localeStores = new Map();

  function readStoredLocale(lsKey) {
    try {
      const v = localStorage.getItem(lsKey);
      if (v === "en" || v === "es") return v;
    } catch (e) {}
    return "es";
  }

  function applyDomLang(locale) {
    try {
      document.documentElement.lang = locale === "en" ? "en" : "es";
    } catch (e) {}
  }

  function getLocaleStore(lsKey) {
    if (!localeStores.has(lsKey)) {
      let locale = readStoredLocale(lsKey);
      const listeners = new Set();
      applyDomLang(locale);
      localeStores.set(lsKey, {
        getLocale: () => locale,
        subscribe(fn) {
          listeners.add(fn);
          return () => listeners.delete(fn);
        },
        setLocale(next) {
          if (next !== "en" && next !== "es") return;
          if (next === locale) return;
          locale = next;
          try {
            localStorage.setItem(lsKey, locale);
          } catch (e) {}
          applyDomLang(locale);
          listeners.forEach((fn) => {
            try {
              fn(locale);
            } catch (e) {}
          });
        },
        toggle() {
          this.setLocale(locale === "es" ? "en" : "es");
        },
      });
    }
    return localeStores.get(lsKey);
  }

  function createLocaleApi(React, MUI, lsKey) {
    function useAppLocale() {
      const store = getLocaleStore(lsKey);
      const [locale, setLocaleState] = React.useState(() => store.getLocale());
      React.useEffect(() => store.subscribe(setLocaleState), [store]);
      const toggle = React.useCallback(() => store.toggle(), [store]);
      const setLocale = React.useCallback((l) => store.setLocale(l), [store]);
      return { locale, toggle, setLocale };
    }
    return {
      useAppLocale,
      getLocale: () => getLocaleStore(lsKey).getLocale(),
      setLocale: (l) => getLocaleStore(lsKey).setLocale(l),
      toggle: () => getLocaleStore(lsKey).toggle(),
    };
  }

  function createLangSwitch(React, MUI) {
    return function LangSwitch({ locale, onChange }) {
      return React.createElement(
        MUI.ToggleButtonGroup,
        {
          size: "small",
          exclusive: true,
          value: locale,
          onChange: function (_e, v) {
            if (v) onChange(v);
          },
          "aria-label": "Idioma / Language",
          sx: {
            "& .MuiToggleButton-root": {
              px: 1,
              py: 0.35,
              minWidth: 36,
              fontWeight: 700,
              fontSize: "0.72rem",
              letterSpacing: 0.4,
              borderColor: "rgba(30,144,255,0.35)",
              color: "text.secondary",
              "&.Mui-selected": {
                color: "#7dd3fc",
                backgroundColor: "rgba(30,144,255,0.18)",
                borderColor: "rgba(30,144,255,0.55)",
              },
            },
          },
        },
        React.createElement(MUI.ToggleButton, { value: "es", "aria-label": "Español", title: "Español" }, "ES"),
        React.createElement(MUI.ToggleButton, { value: "en", "aria-label": "English", title: "English" }, "EN")
      );
    };
  }

  // ─────────────────────────────────────────────
  // ThemeSwitch — botón con iconos sol/luna
  // ─────────────────────────────────────────────
  function createThemeSwitch(React, MUI) {
    return function ThemeSwitch({ mode, onToggle }) {
      const next = mode === "dark" ? "light" : "dark";
      return React.createElement(
        MUI.IconButton,
        {
          size: "small",
          onClick: onToggle,
          "aria-label": `Cambiar a modo ${next}`,
          title: `Cambiar a modo ${next}`,
        },
        React.createElement("iconify-icon", {
          icon: mode === "dark" ? "mdi:weather-sunny" : "mdi:weather-night",
          width: "1.25em",
          height: "1.25em",
        })
      );
    };
  }

  // ─────────────────────────────────────────────
  // FeedbackProvider + toast simple (sin UI por ahora)
  // ─────────────────────────────────────────────
  function createFeedbackApi(React) {
    const listeners = new Set();
    function toast(msg, opts = {}) {
      const event = new CustomEvent("william:toast", { detail: { message: msg, ...opts } });
      window.dispatchEvent(event);
      listeners.forEach((fn) => {
        try {
          fn({ message: msg, ...opts });
        } catch (e) {}
      });
    }
    function show(msg, kind = "info") {
      toast(msg, { kind });
    }
    const FeedbackProvider = function FeedbackProvider({ children }) {
      const [snack, setSnack] = React.useState(null);
      React.useEffect(() => {
        const handler = (e) => {
          setSnack({ message: e.detail.message, kind: e.detail.kind || "info", key: Date.now() });
        };
        window.addEventListener("william:toast", handler);
        return () => window.removeEventListener("william:toast", handler);
      }, []);
      React.useEffect(() => {
        if (!snack) return;
        const t = setTimeout(() => setSnack(null), 3500);
        return () => clearTimeout(t);
      }, [snack]);
      return React.createElement(
        React.Fragment,
        null,
        children,
        snack
          ? React.createElement(
              "div",
              {
                key: snack.key,
                style: {
                  position: "fixed",
                  bottom: 24,
                  left: "50%",
                  transform: "translateX(-50%)",
                  zIndex: 9999,
                  padding: "12px 22px",
                  borderRadius: 12,
                  background:
                    snack.kind === "error"
                      ? "linear-gradient(145deg, rgba(239,68,68,0.95), rgba(185,28,28,0.95))"
                      : snack.kind === "success"
                      ? "linear-gradient(145deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))"
                      : snack.kind === "warning"
                      ? "linear-gradient(145deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))"
                      : "linear-gradient(145deg, rgba(30,144,255,0.95), rgba(99,102,241,0.95))",
                  color: "#fff",
                  boxShadow:
                    "0 12px 32px rgba(0,0,0,0.4), 0 0 24px rgba(30,144,255,0.4), inset 0 1px 0 rgba(255,255,255,0.18)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  letterSpacing: 0.2,
                  animation: "william-toast-pop 0.3s ease-out",
                },
              },
              snack.message
            )
          : null,
        React.createElement("style", null, `
          @keyframes william-toast-pop {
            0% { opacity: 0; transform: translateX(-50%) translateY(12px) scale(0.96); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
        `)
      );
    };
    return { FeedbackProvider, toast, show, subscribe: (fn) => listeners.add(fn) };
  }

  // ─────────────────────────────────────────────
  // WilliamFront — registro simplificado
  // ─────────────────────────────────────────────
  function registerApp(ns) {
    if (!ns) throw new Error("WilliamFront.registerApp: ns requerido");
    if (!window.React || !window.MaterialUI) {
      throw new Error("WilliamFront: cargar stack.mjs antes de registerApp");
    }
    const React = window.React;
    const MUI = window.MaterialUI;
    const lsKey = (globalThis.AppMeta && globalThis.AppMeta.cfg && globalThis.AppMeta.cfg.theme && globalThis.AppMeta.cfg.theme.lsKey) ||
      ns.toLowerCase() + ":theme";
    const localeKey = ns.toLowerCase() + ":locale";
    const bag = window[ns] = window[ns] || {};
    bag.Theme = createThemeApi(React, MUI, lsKey);
    bag.Locale = createLocaleApi(React, MUI, localeKey);
    bag.UI = {
      Icon: createIcon(React),
      ThemeSwitch: createThemeSwitch(React, MUI),
      LangSwitch: createLangSwitch(React, MUI),
      ...createFeedbackApi(React),
    };
    bag.WilliamFront = { registerApp, ns };
    return bag;
  }

  window.WilliamFront = { registerApp };
})();