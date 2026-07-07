/** Icon, ThemeSwitch, TargetSwitch, utilidades UI. */
export function createWidgets(React, MUI, ns, opts = {}) {
  const targetStyle = opts.targetStyle || "chip";
  const cfg = () => window[ns].Config;

  function Icon(props) {
    return React.createElement("iconify-icon", {
      icon: props.icon,
      style: Object.assign(
        { fontSize: props.size || 20, display: "inline-flex", alignItems: "center", verticalAlign: "middle" },
        props.style,
      ),
    });
  }

  function ThemeSwitch(props) {
    const title = props.mode === "dark" ? "Claro" : "Oscuro";
    return React.createElement(
      MUI.Tooltip,
      { title },
      React.createElement(
        MUI.IconButton,
        { color: "inherit", size: "small", onClick: props.onToggle },
        React.createElement(Icon, {
          icon: props.mode === "dark" ? "mdi:weather-sunny" : "mdi:weather-night",
        }),
      ),
    );
  }

  function sessionApi() {
    const bag = window[ns] || {};
    return bag.Session || bag.Auth || null;
  }

  function isLocalHost() {
    const h = window.location?.hostname || "";
    return h === "localhost" || /^127\.0\.0(?:\.|$)/.test(h) || h === "::1" || h === "[::1]";
  }

  function TargetSwitchChip() {
    const { canSwitch, isLocal, setLocal } = useTargetSwitchState();
    const tip = canSwitch
      ? (isLocal ? "Local — clic para producción" : "Producción — clic para local")
      : "Producción (inicia sesión para cambiar el entorno)";

    return React.createElement(
      MUI.Tooltip,
      { title: tip },
      React.createElement(
        MUI.Box,
        { sx: { display: "inline-flex", alignItems: "center", pl: 0.5 } },
        React.createElement(MUI.Chip, {
          size: "small",
          color: isLocal ? "warning" : "primary",
          variant: "outlined",
          disabled: !canSwitch,
          "aria-label": tip,
          icon: React.createElement(Icon, {
            icon: isLocal ? "mdi:laptop" : "mdi:earth",
            size: 16,
          }),
          label: "",
          onClick: canSwitch ? () => setLocal(!isLocal) : undefined,
          sx: {
            cursor: canSwitch ? "pointer" : "default",
            height: 28,
            width: 28,
            minHeight: 28,
            minWidth: 28,
            py: 0.375,
            px: 0.75,
            "& .MuiChip-label": { display: "none", width: 0, p: 0, m: 0 },
            "& .MuiChip-icon": { ml: 0, mr: 0, color: "inherit" },
          },
        }),
      ),
    );
  }

  function TargetSwitchForm() {
    const [local, setLocal] = React.useState(cfg().isLocal());
    React.useEffect(() => {
      const h = () => setLocal(cfg().isLocal());
      window.addEventListener(cfg().EVENT, h);
      return () => window.removeEventListener(cfg().EVENT, h);
    }, []);
    return React.createElement(MUI.FormControlLabel, {
      control: React.createElement(MUI.Switch, {
        size: "small",
        checked: local,
        onChange: (_e, v) => cfg().setLocal(v),
      }),
      label: cfg().label(),
    });
  }

  function useTargetSwitchState() {
    const sess = sessionApi();
    const [loggedIn, setLoggedIn] = React.useState(() => sess?.isLoggedIn?.() ?? false);
    const canSwitch = loggedIn || isLocalHost();
    const [local, setLocal] = React.useState(() => (canSwitch ? cfg().isLocal() : false));

    React.useEffect(() => {
      const onAuth = () => setLoggedIn(sess?.isLoggedIn?.() ?? false);
      const authEvt = sess?.EVENT;
      if (authEvt) window.addEventListener(authEvt, onAuth);
      return () => { if (authEvt) window.removeEventListener(authEvt, onAuth); };
    }, []);

    React.useEffect(() => {
      const onEvt = () => setLocal(canSwitch ? cfg().isLocal() : false);
      window.addEventListener(cfg().EVENT, onEvt);
      return () => window.removeEventListener(cfg().EVENT, onEvt);
    }, [canSwitch]);

    React.useEffect(() => {
      if (!canSwitch) {
        if (cfg().isLocal()) cfg().setLocal(false);
        setLocal(false);
      }
    }, [canSwitch]);

    return { loggedIn, canSwitch, isLocal: canSwitch && local, setLocal: (v) => cfg().setLocal(v) };
  }

  /** Switch de entorno para menú de sesión: icono + etiqueta alineados al resto del menú; switch a la derecha. */
  function TargetSwitchMenu() {
    const { canSwitch, isLocal, setLocal } = useTargetSwitchState();
    const label = isLocal ? "Local" : "Producción";
    const tip = canSwitch
      ? (isLocal ? "Local — activar para producción" : "Producción — activar para local")
      : "Producción (inicia sesión para cambiar el entorno)";

    return React.createElement(
      MUI.Box,
      {
        sx: {
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: "100%",
          minHeight: 24,
          overflow: "hidden",
          boxSizing: "border-box",
        },
      },
      React.createElement(
        MUI.ListItemIcon,
        { sx: { minWidth: 32, mr: 0, alignSelf: "center" } },
        React.createElement(Icon, {
          icon: isLocal ? "mdi:laptop" : "mdi:earth",
          size: 18,
        }),
      ),
      React.createElement(MUI.ListItemText, {
        primary: label,
        sx: { my: 0, flex: "1 1 auto", minWidth: 0, alignSelf: "center", pr: 0.5 },
        primaryTypographyProps: { variant: "body2", noWrap: true, sx: { lineHeight: 1.25 } },
      }),
      React.createElement(MUI.Switch, {
        size: "small",
        checked: isLocal,
        disabled: !canSwitch,
        onChange: (_e, v) => { if (canSwitch) setLocal(v); },
        inputProps: { "aria-label": tip },
        sx: {
          flexShrink: 0,
          ml: "auto",
          mr: 0,
          my: 0,
          alignSelf: "center",
        },
      }),
    );
  }

  function TargetSwitch() {
    return targetStyle === "switch"
      ? React.createElement(TargetSwitchForm, null)
      : React.createElement(TargetSwitchChip, null);
  }

  function Loading(props) {
    const label = props.label || "Cargando…";
    return React.createElement(
      MUI.Box,
      {
        className: "isa-app-boot isa-app-boot--inline",
        sx: { flex: 1, minHeight: 0, width: "100%" },
      },
      React.createElement(
        "div",
        { className: "isa-app-boot__card isa-app-boot__card--compact", role: "status", "aria-live": "polite" },
        React.createElement(
          "div",
          { className: "isa-app-boot__icon-wrap isa-app-boot__icon-wrap--sm" },
          React.createElement(Icon, { icon: "mdi:loading", size: 22, className: "isa-spin" }),
        ),
        React.createElement("p", { className: "isa-app-boot__label" }, label),
        React.createElement(
          "div",
          { className: "isa-app-boot__bar", "aria-hidden": "true" },
          React.createElement("span", { className: "isa-app-boot__bar-fill" }),
        ),
      ),
    );
  }

  function ErrorBox(props) {
    return React.createElement(
      MUI.Alert,
      { severity: "error", sx: { my: 2 } },
      props.message || "Error",
    );
  }

  function humanSize(bytes) {
    if (!bytes && bytes !== 0) return "-";
    const u = ["B", "KB", "MB", "GB"];
    let i = 0;
    let n = bytes;
    while (n >= 1024 && i < u.length - 1) {
      n /= 1024;
      i++;
    }
    return n.toFixed(n < 10 && i > 0 ? 1 : 0) + " " + u[i];
  }

  return { Icon, ThemeSwitch, TargetSwitch, TargetSwitchMenu, Loading, ErrorBox, humanSize };
}

export function registerWidgets(ns, opts) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) throw new Error("ISAFront.registerWidgets requiere React/MUI");
  window[ns] = window[ns] || {};
  window[ns].UI = createWidgets(React, MUI, ns, opts);
}
