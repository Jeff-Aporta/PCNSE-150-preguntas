/** LoginGate — pantalla inline o redirección al panel de acceso (usa LoginPageForm compartido). */
import {
  LOGIN_SUBTITLE_DEFAULT,
  loginPageSx,
  loginCardSx,
  LoginHeaderBand,
  resolveLoginUi,
  GLASS_CARD_CLASS,
} from "./login-surface.js";

function loginApi(ns) {
  const bag = typeof window !== "undefined" ? window[ns] || {} : {};
  return bag.Session || bag.Auth;
}

export function createLoginGates(React, MUI, ns, UI, opts = {}) {
  const subtitle = opts.subtitle || LOGIN_SUBTITLE_DEFAULT;
  const accent = opts.accent || "#1e90ff";
  const icon = opts.icon || "mdi:account-key-outline";
  const loginUrl = opts.loginUrl || (typeof window !== "undefined" && (window[ns]?.Session?.LOGIN_URL || window[ns]?.Auth?.LOGIN_URL)) || "";

  function useAuthSync(setOk) {
    React.useEffect(() => {
      const api = loginApi(ns);
      if (!api?.EVENT) return undefined;
      const sync = () => setOk(api.isLoggedIn());
      window.addEventListener(api.EVENT, sync);
      window.addEventListener("storage", sync);
      return () => {
        window.removeEventListener(api.EVENT, sync);
        window.removeEventListener("storage", sync);
      };
    }, [setOk]);
  }

  function LoginGateInline(props) {
    const api = loginApi(ns);
    const [ok, setOk] = React.useState(() => api?.isLoggedIn?.() ?? false);
    useAuthSync(setOk);
    if (ok) return props.children;

    const LoginPageForm = window.ISAFront?.UI?.LoginPageForm;
    if (LoginPageForm && api?.login) {
      return React.createElement(LoginPageForm, {
        ns,
        title: "Iniciar sesión",
        accent,
        icon,
        showRemember: opts.showRemember !== false,
        showPasswordToggle: opts.showPasswordToggle !== false,
        pageSx: { minHeight: "auto", flex: 1 },
        onLogin: (loginId, pass) => api.login(loginId, pass),
        onSuccess: () => setOk(true),
        extraActions: loginUrl
          ? React.createElement(
            MUI.Button,
            { href: loginUrl, target: "_blank", rel: "noreferrer", disabled: false },
            "Abrir panel de acceso",
          )
          : null,
      });
    }

    return React.createElement(
      MUI.Alert,
      { severity: "warning", sx: { m: 2 } },
      "LoginPageForm no cargado — recargue la página.",
    );
  }

  function LoginGateRedirect(props) {
    const api = loginApi(ns);
    const [ok, setOk] = React.useState(() => api?.isLoggedIn?.() ?? false);
    useAuthSync(setOk);
    if (ok) return props.children;

    const message = opts.redirectMessage || subtitle;
    const redirectIcon = opts.redirectIcon || icon;
    const loginUi = resolveLoginUi(ns);
    const panelUrl = loginUrl || api?.LOGIN_URL || "";

    return React.createElement(
      MUI.Box,
      { sx: loginPageSx() },
      React.createElement(
        MUI.Paper,
        { elevation: 0, className: GLASS_CARD_CLASS, sx: loginCardSx({ textAlign: "center" }) },
        LoginHeaderBand(React, MUI, loginUi, { icon: redirectIcon, title: "Inicia sesión", accent, ns }),
        React.createElement(
          MUI.Box,
          { sx: { p: { xs: 2, sm: 2.5, md: 3 } } },
          React.createElement(MUI.Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2.5, lineHeight: 1.6 } }, message),
          React.createElement(
            MUI.Stack,
            { direction: "row", spacing: 1, justifyContent: "center", flexWrap: "wrap", useFlexGap: true },
            panelUrl
              ? React.createElement(
                MUI.Button,
                { variant: "contained", href: panelUrl, target: "_blank", rel: "noreferrer" },
                "Abrir panel de acceso",
              )
              : null,
            React.createElement(
              MUI.Button,
              { variant: "outlined", onClick: () => setOk(api?.isLoggedIn?.() ?? false) },
              "Ya inicié sesión",
            ),
          ),
        ),
      ),
    );
  }

  return {
    LoginGate: LoginGateInline,
    LoginGateRedirect,
  };
}

export function registerLoginGates(ns, opts) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) throw new Error("ISAFront.registerLoginGates requiere React/MUI");
  window[ns] = window[ns] || {};
  const UI = window[ns].UI;
  if (!UI) throw new Error("ISAFront.registerLoginGates requiere UI registrada antes");
  const gates = createLoginGates(React, MUI, ns, UI, typeof opts === "object" ? opts : {});
  Object.assign(window[ns].UI, gates);
}
