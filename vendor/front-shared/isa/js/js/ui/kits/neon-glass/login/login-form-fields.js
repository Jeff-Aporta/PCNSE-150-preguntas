/**
 * Campos y layout de login compartidos — modal (LoginButton) y página (system-login, LoginGate).
 */
import {
  LOGIN_REMEMBER_LABEL,
  loginPageSx,
  loginCardSx,
  LoginHeaderBand,
  contapymeLoginTextFieldProps,
  createLoginIcon,
  resolveLoginUi,
  GLASS_CARD_CLASS,
} from "./login-surface.js";
import { readLoginCredentials, saveLoginCredentials } from "../../../../core/auth/login-credentials.js";
import { normalizeContapymeLoginId, formatContapymeLoginInput } from "../../../../core/util/format.js";
import { loginWithInsoftAutoRetry, defaultIterceroFromTerceros } from "./login-multiempresa.js";

export function loginFormActionsSx() {
  return {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 1,
    px: { xs: 2, sm: 2.5 },
    py: 1.5,
    borderTop: 1,
    borderColor: (t) => (t.palette.mode === "dark" ? "rgba(99,102,241,0.2)" : "divider"),
  };
}

export function loginFormContentSx() {
  return { pt: 2, px: { xs: 2, sm: 2.5, md: 3 }, pb: 1 };
}

/** Campo contraseña con ojo (MUI 9 slotProps + icono estándar). */
export function createLoginPasswordField(React, MUI, UI, opts = {}) {
  const {
    pass,
    setPass,
    showPass,
    setShowPass,
    showPasswordToggle = true,
    onEnter,
    busy,
  } = opts;
  const { TextField, InputAdornment, IconButton, Tooltip } = MUI;
  const Icon = UI?.Icon || createLoginIcon(React);
  const htmlInput = { spellCheck: false, autoCorrect: "off", autoCapitalize: "none" };
  const field = {
    label: "Contraseña",
    type: showPasswordToggle && showPass ? "text" : "password",
    value: pass,
    onChange: (e) => setPass(e.target.value),
    fullWidth: true,
    size: "small",
    autoComplete: "current-password",
    disabled: busy,
    onKeyDown: (e) => { if (e.key === "Enter" && onEnter) { e.preventDefault(); onEnter(e); } },
    slotProps: { htmlInput },
    inputProps: htmlInput,
  };
  if (!showPasswordToggle) return React.createElement(TextField, field);
  const endAdornment = React.createElement(
    InputAdornment,
    { position: "end" },
    React.createElement(
      Tooltip,
      { title: showPass ? "Ocultar contraseña" : "Mostrar contraseña", arrow: true },
      React.createElement(
        IconButton,
        {
          size: "small",
          edge: "end",
          tabIndex: -1,
          disabled: busy,
          "aria-label": showPass ? "Ocultar contraseña" : "Mostrar contraseña",
          onClick: () => setShowPass((v) => !v),
        },
        React.createElement(Icon, { icon: showPass ? "mdi:eye-off-outline" : "mdi:eye-outline", size: 20 }),
      ),
    ),
  );
  return React.createElement(TextField, {
    ...field,
    slotProps: {
      htmlInput,
      input: { endAdornment },
    },
  });
}

/** Stack Usuario + Contraseña + Empresa + Recordarme + errores (cuerpo del modal estándar). */
export function createLoginFormFields(React, MUI, UI, opts = {}) {
  const {
    user,
    setUser,
    pass,
    setPass,
    remember,
    setRemember,
    showPass,
    setShowPass,
    err,
    busy,
    showRemember = true,
    showPasswordToggle = true,
    onEnter,
    terceros,
    selectedItercero,
    setSelectedItercero,
  } = opts;
  const { Stack, TextField, FormControlLabel, Checkbox, Alert, MenuItem } = MUI;
  const fieldDisabled = busy;
  const empresaOptions = Array.isArray(terceros) ? terceros : [];
  const needsEmpresa = empresaOptions.length > 0;

  return React.createElement(
    Stack,
    { spacing: 2 },
    err
      ? React.createElement(Alert, { severity: "error" }, String(err))
      : null,
    needsEmpresa
      ? React.createElement(Alert, { severity: "info" }, "Seleccione la empresa con la que desea ingresar.")
      : null,
    React.createElement(TextField, contapymeLoginTextFieldProps({
      value: user,
      onChange: (e) => setUser(e.target.value),
      onBlur: () => {
        const formatted = formatContapymeLoginInput(user);
        if (formatted && formatted !== user) setUser(formatted);
      },
      fullWidth: true,
      autoFocus: !fieldDisabled && !needsEmpresa,
      size: "small",
      disabled: fieldDisabled,
      onKeyDown: (e) => { if (e.key === "Enter" && onEnter && !fieldDisabled) { e.preventDefault(); onEnter(e); } },
    })),
    createLoginPasswordField(React, MUI, UI, {
      pass,
      setPass,
      showPass,
      setShowPass,
      showPasswordToggle,
      onEnter,
      busy: fieldDisabled,
    }),
    needsEmpresa
      ? React.createElement(TextField, {
        select: true,
        label: "Empresa",
        value: selectedItercero || "",
        onChange: (e) => setSelectedItercero?.(e.target.value),
        fullWidth: true,
        size: "small",
        disabled: fieldDisabled,
        autoFocus: !fieldDisabled,
        helperText: "El correo está asociado a varias empresas.",
        onKeyDown: (e) => { if (e.key === "Enter" && onEnter && !fieldDisabled) { e.preventDefault(); onEnter(e); } },
      }, empresaOptions.map((t) => React.createElement(
        MenuItem,
        { key: t.itercero, value: t.itercero },
        t.ntercero ? `${t.ntercero} (${t.itercero})` : t.itercero,
      )))
      : null,
    showRemember
      ? React.createElement(FormControlLabel, {
        control: React.createElement(Checkbox, {
          checked: remember,
          onChange: (e) => setRemember(!!e.target.checked),
          size: "small",
          disabled: fieldDisabled,
        }),
        label: LOGIN_REMEMBER_LABEL,
      })
      : null,
  );
}

/** Botones Cancelar + Entrar (reutilizable en DialogActions o pie de página). */
export function createLoginActionButtons(React, MUI, opts = {}) {
  const {
    busy,
    canSubmit,
    onCancel,
    onSubmit,
    submitLabel = "Entrar",
    cancelLabel = "Cancelar",
    showCancel = false,
    fullWidthSubmit = false,
    submitViaForm = false,
    extraActions = null,
  } = opts;
  const { Button } = MUI;
  const buttons = [];
  if (extraActions) buttons.push(...(Array.isArray(extraActions) ? extraActions : [extraActions]));
  if (showCancel && onCancel) {
    buttons.push(React.createElement(Button, { key: "cancel", onClick: onCancel, disabled: busy }, cancelLabel));
  }
  buttons.push(React.createElement(
    Button,
    {
      key: "submit",
      type: submitViaForm ? "submit" : (onSubmit ? "button" : "submit"),
      variant: "contained",
      disabled: busy || canSubmit === false,
      ...(submitViaForm ? {} : { onClick: onSubmit }),
      fullWidth: fullWidthSubmit,
    },
    busy ? "Entrando…" : submitLabel,
  ));
  return buttons;
}

/** Pie Cancelar + Entrar (mismo layout que DialogActions del modal). */
export function createLoginFormActions(React, MUI, opts = {}) {
  const { Box } = MUI;
  return React.createElement(
    Box,
    { sx: loginFormActionsSx() },
    ...createLoginActionButtons(React, MUI, opts),
  );
}

/**
 * Tarjeta login página completa — visual idéntico al modal (header + campos + pie).
 * @param {Function} getUI () => window[ns].UI con Icon
 */
export function createLoginPageFormComponent(React, MUI, defaultNs) {
  const { Box, Paper } = MUI;

  return function LoginPageForm(props) {
    const ns = props.ns || defaultNs;
    const UI = resolveLoginUi(ns);
    const [user, setUser] = React.useState("");
    const [pass, setPass] = React.useState("");
    const [remember, setRemember] = React.useState(true);
    const [showPass, setShowPass] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState("");
    const [terceros, setTerceros] = React.useState([]);
    const [selectedItercero, setSelectedItercero] = React.useState("");

    const title = props.title || "Iniciar sesión";
    const accent = props.accent || "#1e90ff";
    const icon = props.icon || "mdi:account-key-outline";

    React.useEffect(() => {
      const saved = readLoginCredentials();
      setUser(saved.username || "");
      setPass(saved.password || "");
      setRemember(saved.remember !== false);
    }, []);

    const submitLock = React.useRef(false);

    async function submit(ev) {
      if (ev?.preventDefault) ev.preventDefault();
      if (submitLock.current || busy) return;
      if (!user.trim() || !pass) {
        setErr("Usuario y contraseña requeridos");
        return;
      }
      if (terceros.length && !selectedItercero) {
        setErr("Seleccione la empresa para continuar");
        return;
      }
      if (typeof props.onLogin !== "function") {
        setErr("Login no configurado");
        return;
      }
      const loginId = normalizeContapymeLoginId(user);
      submitLock.current = true;
      setBusy(true);
      setErr("");
      try {
        if (props.showRemember !== false) saveLoginCredentials(formatContapymeLoginInput(user) || user.trim(), pass, remember);
        const loginOpts = { remember };
        if (selectedItercero) loginOpts.itercero = selectedItercero;
        await loginWithInsoftAutoRetry(
          (id, p, o) => props.onLogin(id, p, o),
          loginId,
          pass,
          loginOpts,
        );
        setTerceros([]);
        setSelectedItercero("");
        props.onSuccess?.();
      } catch (e) {
        if (e?.code === "MULTI_EMPRESA" && Array.isArray(e.terceros) && e.terceros.length) {
          setTerceros(e.terceros);
          setSelectedItercero(defaultIterceroFromTerceros(e.terceros));
          setErr("");
          return;
        }
        setErr(e?.message || String(e));
      } finally {
        submitLock.current = false;
        setBusy(false);
      }
    }

    return React.createElement(
      Box,
      { sx: loginPageSx(props.pageSx) },
      React.createElement(
        Paper,
        {
          className: `isa-login-card ${GLASS_CARD_CLASS}`,
          elevation: 0,
          sx: loginCardSx(props.cardSx),
          component: "form",
          onSubmit: submit,
        },
        LoginHeaderBand(React, MUI, UI, { icon, title, accent }),
        React.createElement(
          Box,
          { sx: loginFormContentSx() },
          createLoginFormFields(React, MUI, UI, {
            user,
            setUser,
            pass,
            setPass,
            remember,
            setRemember,
            showPass,
            setShowPass,
            err: props.error || err,
            busy,
            showRemember: props.showRemember !== false,
            showPasswordToggle: props.showPasswordToggle !== false,
            onEnter: submit,
            terceros,
            selectedItercero,
            setSelectedItercero,
          }),
        ),
        createLoginFormActions(React, MUI, {
          busy,
          canSubmit: !!user.trim() && !!pass && (!terceros.length || !!selectedItercero),
          submitViaForm: true,
          fullWidthSubmit: props.fullWidthSubmit === true,
          showCancel: false,
          extraActions: props.extraActions,
        }),
      ),
    );
  };
}

export function registerLoginPageForm(ns) {
  const React = window.React;
  const MUI = window.MaterialUI;
  if (!React || !MUI) return null;
  const Comp = createLoginPageFormComponent(React, MUI, ns);
  window.ISAFront = window.ISAFront || {};
  window.ISAFront.UI = window.ISAFront.UI || {};
  window.ISAFront.UI.LoginPageForm = Comp;
  window.ISAFront.createLoginFormFields = createLoginFormFields;
  window.ISAFront.createLoginPasswordField = createLoginPasswordField;
  window.ISAFront.createLoginFormActions = createLoginFormActions;
  window.ISAFront.resolveLoginUi = resolveLoginUi;
  window.ISAFront.createLoginIcon = createLoginIcon;
  return Comp;
}
