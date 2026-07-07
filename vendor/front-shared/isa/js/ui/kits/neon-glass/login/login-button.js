import { sanitizeUserMessage } from "../../../../core/util/sanitize-user-message.js";
import { formatLocalDateTime, resolveSessionHeaderLabel, normalizeContapymeLoginId, formatContapymeLoginInput } from "../../../../core/util/format.js";
import { readLoginCredentials, saveLoginCredentials } from "../../../../core/auth/login-credentials.js";
import { LoginHeaderBand, loginDialogProps, resolveLoginUi } from "./login-surface.js";
import { createLoginFormFields, createLoginActionButtons, loginFormContentSx } from "./login-form-fields.js";
import { loginWithInsoftAutoRetry, defaultIterceroFromTerceros } from "./login-multiempresa.js";
/**
 * Botón de sesión + modal login (MUI). Usa window[ns].Session → main-orchestrator /api/auth/token.
 * Opciones: showRealtimeDot, showPasswordToggle, showRemember, showExpiryInTooltip.
 */
export function createLoginButton(React, MUI, ns, opts = {}) {
  const { useState, useEffect } = React;
  const {
    Box, Stack, Tooltip, Chip, IconButton, Button,
    Dialog, DialogContent, DialogActions,
    Menu, MenuItem, ListItemIcon, ListItemText, Divider,
  } = MUI;

  const wrapClass = opts.wrapClass || "header-session-wrap";
  const btnClass = opts.btnClass || "header-session-btn";
  const showRealtimeDot = opts.showRealtimeDot !== false;
  const showPasswordToggle = opts.showPasswordToggle !== false;
  const showRemember = opts.showRemember !== false;
  const showExpiryInTooltip = opts.showExpiryInTooltip === true;

  function authApi() {
    const bag = window[ns] || {};
    return bag.AppSession || bag.Session;
  }

  function sessionApi() {
    return window[ns]?.Session;
  }

  function uiBag() {
    return resolveLoginUi(ns);
  }

  function toast(kind, message) {
    const fb = window[ns]?.Feedback?.toast;
    if (fb?.[kind]) {
      fb[kind](message);
      return;
    }
    const fn = window.ISAFront?.[`toast${kind.charAt(0).toUpperCase()}${kind.slice(1)}`];
    if (typeof fn === "function") fn(message);
  }

  function sanitizeLoginError(raw) {
    return sanitizeUserMessage(raw, "No se pudo iniciar sesión");
  }

  function sessionView(auth) {
    const s = auth.getSession?.() ?? auth.current?.();
    if (!s) return null;
    return {
      username: s.username ?? auth.username?.(),
      displayName: s.displayName ?? null,
      role: s.role ?? null,
      expiresAt: s.expiresAt ?? null,
    };
  }

  function LoginButton(props) {
    const auth = authApi();
    if (!auth) throw new Error(`LoginButton: Session no registrado (${ns})`);

    const Icon = uiBag().Icon;
    const authEvt = sessionApi()?.EVENT;
    const [openInternal, setOpenInternal] = useState(false);
    const open = props.loginOpen != null ? props.loginOpen : openInternal;
    const setOpen = props.onLoginOpenChange || setOpenInternal;
    const [user, setUser] = useState("");
    const [pass, setPass] = useState("");
    const [remember, setRemember] = useState(true);
    const [showPass, setShowPass] = useState(false);
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);
    const [terceros, setTerceros] = useState([]);
    const [selectedItercero, setSelectedItercero] = useState("");
    const [, tick] = useState(0);
    const [menuEl, setMenuEl] = useState(null);
    const menuOpen = Boolean(menuEl);

    const ui = uiBag();
    const rtHookFn = ui.useRealtimeStatus;
    const StatusDot = ui.RealtimeStatusDot;
    const rtBag = window[ns]?.Realtime;
    const hasRt = showRealtimeDot
      && rtBag?.isConfigured
      && typeof rtHookFn === "function"
      && typeof StatusDot === "function";
    const rtHook = hasRt ? rtHookFn() : null;
    const realtimeEl = rtHook
      ? React.createElement(StatusDot, {
        state: rtHook.state,
        tone: rtHook.tone,
        tip: rtHook.tip,
        onReconnect: rtHook.reconnect,
      })
      : null;

    useEffect(() => {
      if (!authEvt) return undefined;
      const onAuth = () => tick((n) => n + 1);
      window.addEventListener(authEvt, onAuth);
      return () => window.removeEventListener(authEvt, onAuth);
    }, [authEvt]);

    useEffect(() => {
      const onCaps = () => tick((n) => n + 1);
      window.addEventListener("patyia-apptools:caps-changed", onCaps);
      return () => window.removeEventListener("patyia-apptools:caps-changed", onCaps);
    }, []);

    useEffect(() => {
      if (!open) return;
      const saved = readLoginCredentials();
      setUser(saved.username || "");
      setPass(saved.password || "");
      setRemember(saved.remember !== false);
      setErr("");
      setTerceros([]);
      setSelectedItercero("");
    }, [open]);

    async function submit() {
      if (!user.trim() || !pass) {
        setErr("Usuario y contraseña requeridos");
        return;
      }
      if (terceros.length && !selectedItercero) {
        setErr("Seleccione la empresa para continuar");
        return;
      }
      const loginId = normalizeContapymeLoginId(user);
      setBusy(true);
      setErr("");
      try {
        if (showRemember) saveLoginCredentials(formatContapymeLoginInput(user) || user.trim(), pass, remember);
        const itercero = String(selectedItercero || "").trim();
        const loginOpts = itercero ? { itercero } : {};
        const session = await loginWithInsoftAutoRetry(
          (id, p, o) => auth.login(id, p, o),
          loginId,
          pass,
          loginOpts,
        );
        setPass("");
        setShowPass(false);
        setTerceros([]);
        setSelectedItercero("");
        setOpen(false);
        const sv = sessionView(auth) || session;
        toast("success", "Sesión iniciada");
        props.onLoggedIn?.(sv || session);
      } catch (e) {
        if (e?.code === "MULTI_EMPRESA" && Array.isArray(e.terceros) && e.terceros.length) {
          setTerceros(e.terceros);
          setSelectedItercero(defaultIterceroFromTerceros(e.terceros));
          setErr("");
          return;
        }
        const msg = sanitizeLoginError(e instanceof Error ? e.message : String(e));
        setErr(msg);
        toast("error", msg);
      } finally {
        setBusy(false);
      }
    }

    function logout() {
      auth.logout();
      tick((n) => n + 1);
      toast("info", "Sesión cerrada");
    }

    function openSessionMenu(e) {
      setMenuEl(e.currentTarget);
    }

    function closeSessionMenu() {
      setMenuEl(null);
    }

    function logoutFromMenu() {
      closeSessionMenu();
      logout();
    }

    const session = sessionView(auth);
    const loggedIn = session || (auth.isLoggedIn?.() ? { username: auth.username?.() } : null);

    if (loggedIn?.username) {
      const UserSessionMenu = window.ISAFront?.UI?.UserSessionMenu;
      const Session = sessionApi();
      if (UserSessionMenu) {
        return React.createElement(UserSessionMenu, {
          ns,
          username: Session?.username?.() || loggedIn.username,
          displayName: Session?.displayName?.() || loggedIn.displayName || "",
          role: session?.role || auth.resolveDisplayRole?.() || Session?.current?.()?.role || "",
          signalDot: realtimeEl,
          showTarget: opts.showTarget,
          onLogout: logout,
          runUnitTestUrl: opts.runUnitTestUrl,
          getAuthHeaders: opts.getAuthHeaders,
          unitTestTitle: opts.unitTestTitle,
        });
      }

      const expiryLine = showExpiryInTooltip && session?.expiresAt
        ? `Expira: ${formatLocalDateTime(session.expiresAt)}`
        : null;
      const menuSecondary = [
        session?.role ? `Rol: ${session.role}` : null,
        expiryLine,
      ].filter(Boolean).join(" · ") || undefined;
      return React.createElement(
        Box,
        {
          component: "span",
          className: wrapClass,
          sx: { display: "inline-flex", alignItems: "center", flexShrink: 0, pl: 0.5 },
        },
        React.createElement(
          Stack,
          { direction: "row", spacing: 0.75, alignItems: "center", className: btnClass },
          realtimeEl,
          React.createElement(
            Tooltip,
            { title: "Menú de sesión", arrow: true },
            React.createElement(Chip, {
              size: "small",
              variant: "filled",
              className: "header-session-chip",
              clickable: true,
              onClick: openSessionMenu,
              "aria-haspopup": "true",
              "aria-expanded": menuOpen ? "true" : "false",
              "aria-controls": menuOpen ? `${ns}-session-menu` : undefined,
              icon: Icon
                ? React.createElement(Icon, { icon: "mdi:account-circle-outline", size: 18 })
                : undefined,
              label: resolveSessionHeaderLabel(loggedIn.displayName, loggedIn.username, loggedIn.username),
              sx: {
                pl: 0.75,
                height: "auto",
                minHeight: 28,
                py: 0.375,
                px: 1.25,
                "& .MuiChip-label": { pl: 0.75, py: 0.25 },
              },
            }),
          ),
          React.createElement(
            Menu,
            {
              id: `${ns}-session-menu`,
              anchorEl: menuEl,
              open: menuOpen,
              onClose: closeSessionMenu,
              anchorOrigin: { vertical: "bottom", horizontal: "right" },
              transformOrigin: { vertical: "top", horizontal: "right" },
              slotProps: { paper: { sx: { minWidth: 200 } } },
            },
            React.createElement(
              MenuItem,
              { disabled: true, dense: true, sx: { opacity: 1 } },
              React.createElement(ListItemText, {
                primary: loggedIn.username,
                secondary: menuSecondary,
                primaryTypographyProps: { fontWeight: 600, variant: "body2" },
                secondaryTypographyProps: { variant: "caption" },
              }),
            ),
            React.createElement(Divider, { sx: { my: 0.5 } }),
            React.createElement(
              MenuItem,
              { onClick: logoutFromMenu, dense: true },
              Icon
                ? React.createElement(ListItemIcon, { sx: { minWidth: 32 } }, React.createElement(Icon, { icon: "mdi:logout", size: 18 }))
                : null,
              React.createElement(ListItemText, null, "Cerrar sesión"),
            ),
          ),
        ),
      );
    }

    return React.createElement(
      Box,
      {
        component: "span",
        className: wrapClass,
        sx: { display: "inline-flex", alignItems: "center", flexShrink: 0 },
      },
      React.createElement(
        Stack,
        { direction: "row", spacing: 0.75, alignItems: "center", className: btnClass },
        realtimeEl,
        React.createElement(
          Button,
          {
            size: "small",
            variant: "outlined",
            color: "inherit",
            startIcon: Icon ? React.createElement(Icon, { icon: "mdi:login", size: 18 }) : null,
            onClick: () => setOpen(true),
          },
          "Iniciar sesión",
        ),
      ),
      React.createElement(
        Dialog,
        loginDialogProps({
          open,
          onClose: busy ? undefined : () => { setOpen(false); setShowPass(false); },
        }),
        LoginHeaderBand(React, MUI, uiBag(), { icon: "mdi:account-key-outline", title: "Iniciar sesión", accent: "#1e90ff" }),
        React.createElement(
          DialogContent,
          { sx: loginFormContentSx() },
          createLoginFormFields(React, MUI, uiBag(), {
            user,
            setUser,
            pass,
            setPass,
            remember,
            setRemember,
            showPass,
            setShowPass,
            err,
            showPasswordToggle,
            onEnter: submit,
            terceros,
            selectedItercero,
            setSelectedItercero,
          }),
        ),
        React.createElement(
          DialogActions,
          null,
          ...createLoginActionButtons(React, MUI, {
            busy,
            canSubmit: !!user.trim() && !!pass && (!terceros.length || !!selectedItercero),
            onCancel: () => { setOpen(false); setShowPass(false); },
            onSubmit: submit,
            showCancel: true,
          }),
        ),
      ),
    );
  }

  return { LoginButton };
}

export function registerLoginButton(ns, opts = {}) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) return null;
  const { LoginButton } = createLoginButton(React, MUI, ns, opts);
  window[ns] = window[ns] || {};
  window[ns].UI = window[ns].UI || {};
  window[ns].UI.LoginButton = LoginButton;
  return LoginButton;
}
