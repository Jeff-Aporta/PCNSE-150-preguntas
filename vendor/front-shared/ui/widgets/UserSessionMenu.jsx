/**
 * Chip de usuario con menú: entorno (TargetSwitchMenu), test unitario, cerrar sesión.
 */
(function () {
  "use strict";
  const React = window.React;
  const MUI = MaterialUI;

  /** Avatar por nombre — https://ui-avatars.com (misma API que isa-patyia buildUserAvatarUrl). */
  function buildAvatarUrl(name, size) {
    const label = String(name || "").trim() || "Usuario";
    const params = new URLSearchParams({
      name: label,
      size: String(size || 64),
      background: "1e90ff",
      color: "ffffff",
      bold: "true",
      format: "svg",
    });
    return "https://ui-avatars.com/api/?" + params.toString();
  }

  function isLocalHost() {
    const h = window.location?.hostname || "";
    return h === "localhost" || /^127\.0\.0(?:\.|$)/.test(h) || h === "::1" || h === "[::1]";
  }

  function UserSessionMenu(props) {
    const ns = props.ns || "ISA";
    const bag = window[ns] || {};
    const Session = bag.Session;
    const UI = bag.UI || window.ISAFront.UI || {};
    const Icon = UI.Icon;
    const TargetSwitchMenu = UI.TargetSwitchMenu;
    const UnitTestModal = UI.UnitTestStreamModal;
    const ViewAsDialog = UI.ViewAsDialog || window.ISAFront?.UI?.ViewAsDialog;
    const [anchor, setAnchor] = React.useState(null);
    const [testOpen, setTestOpen] = React.useState(false);
    const [viewAsOpen, setViewAsOpen] = React.useState(false);
    const viewAsPendingRef = React.useRef(false);
    const [, authRev] = React.useState(0);
    const open = Boolean(anchor);

    React.useEffect(function () {
      if (!Session?.EVENT) return undefined;
      function onAuth() { authRev(function (n) { return n + 1; }); }
      window.addEventListener(Session.EVENT, onAuth);
      return function () { window.removeEventListener(Session.EVENT, onAuth); };
    }, [Session]);

    React.useEffect(function () {
      function onCaps() { authRev(function (n) { return n + 1; }); }
      window.addEventListener("patyia-apptools:caps-changed", onCaps);
      return function () { window.removeEventListener("patyia-apptools:caps-changed", onCaps); };
    }, []);

    void authRev;

    const fmt = window.ISAFront || {};
    const chipLabel = fmt.formatSessionChipLabel || function (n) { return String(n || "").trim(); };
    const displayNameFmt = fmt.formatSessionDisplayName || function (n) { return String(n || "").trim(); };
    const headerLabelFn = fmt.resolveSessionHeaderLabel || function (dn, un, fb) {
      return chipLabel(dn || un, fb || un || "Usuario");
    };
    const username = props.username || Session?.username?.() || "";
    const sessionDisplayName = props.displayName !== undefined
      ? (props.displayName || "")
      : (Session?.displayName?.() || "");
    const realUsername = props.realUsername || Session?.realUsername?.() || username;
    const viewAsUsername = props.viewAsUsername !== undefined
      ? (props.viewAsUsername || "")
      : (Session?.viewAsUsername?.() || "");
    const sessionRole = String(
      props.role
      || bag.AppSession?.resolveDisplayRole?.()
      || bag.AppSession?.getSession?.()?.role
      || Session?.current?.()?.role
      || "",
    ).trim();
    const canViewAs = props.canViewAs !== undefined
      ? props.canViewAs
      : !!(Session?.can && Session.can("session.view_as"))
        || sessionRole.toLowerCase() === "admin";
    const headerLabel = viewAsUsername
      ? headerLabelFn("", realUsername, realUsername) + " → " + headerLabelFn("", viewAsUsername, viewAsUsername)
      : headerLabelFn(sessionDisplayName, username, username || "Usuario");
    const tooltipLabel = viewAsUsername
      ? displayNameFmt(sessionDisplayName || realUsername) + " → " + displayNameFmt(viewAsUsername)
      : displayNameFmt(sessionDisplayName || username);
    const chipSx = props.chipSx || {};
    const avatarName = viewAsUsername
      ? (displayNameFmt(viewAsUsername) || viewAsUsername)
      : (sessionDisplayName || username);
    const avatarUrl = props.buildAvatarUrl
      ? props.buildAvatarUrl(avatarName, 64)
      : buildAvatarUrl(avatarName, 64);
    const ariaLabel = (tooltipLabel || headerLabel) + (sessionRole ? " · rol " + sessionRole : "");
    const useChipFallback = !Icon && !String(sessionDisplayName || "").trim();

    function closeMenu() { setAnchor(null); }

    function flushViewAsOpen() {
      if (!viewAsPendingRef.current) return;
      viewAsPendingRef.current = false;
      setViewAsOpen(true);
    }

    function openViewAsDialog() {
      if (!ViewAsDialog) {
        toast("error", "Suplantación no disponible. Recarga la página (Ctrl+F5).");
        return;
      }
      viewAsPendingRef.current = true;
      closeMenu();
      window.setTimeout(flushViewAsOpen, 160);
    }

    function handleMenuExited() {
      flushViewAsOpen();
    }

    function toast(kind, message) {
      const fb = bag.Feedback?.toast;
      if (fb?.[kind]) {
        fb[kind](message);
        return;
      }
      const fn = window.ISAFront?.["toast" + kind.charAt(0).toUpperCase() + kind.slice(1)];
      if (typeof fn === "function") fn(message);
    }

    function handleViewAsSelected(uname) {
      if (props.onViewAsSelected) {
        props.onViewAsSelected(uname);
        return;
      }
      window.dispatchEvent(new Event(Session.EVENT));
      toast("success", "Suplantando · " + (uname || Session?.username?.() || ""));
    }

    function handleViewAsCleared() {
      if (props.onViewAsCleared) {
        props.onViewAsCleared();
        return;
      }
      window.dispatchEvent(new Event(Session.EVENT));
      toast("info", "Suplantación finalizada");
    }

    async function handleViewAsClear() {
      closeMenu();
      if (props.onViewAsClear) {
        props.onViewAsClear();
        return;
      }
      if (!Session?.clearViewAs) return;
      try {
        await Session.clearViewAs();
        handleViewAsCleared();
      } catch (e) {
        toast("error", e instanceof Error ? e.message : String(e));
      }
    }

    function envSwitchAllowed() {
      if (props.showTarget === false) return false;
      if (props.showTarget === true) return true;
      if (isLocalHost()) return true;
      const Session = bag.Session;
      return !!(Session && Session.can && Session.can("infra.target.switch"));
    }

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(
        MUI.Box,
        {
          component: "span",
          className: "header-session-wrap",
          sx: { display: "inline-flex", alignItems: "center", flexShrink: 0 },
        },
        React.createElement(
          MUI.Stack,
          { direction: "row", spacing: 0.75, alignItems: "center", className: "header-session-btn" },
          props.signalDot || null,
          React.createElement(
            MUI.Tooltip,
            { title: tooltipLabel || headerLabel, arrow: true },
            useChipFallback
              ? React.createElement(MUI.Chip, {
                size: "small",
                variant: "filled",
                className: "header-session-chip",
                clickable: true,
                label: headerLabel,
                onClick: function (e) { setAnchor(e.currentTarget); },
                sx: Object.assign({ cursor: "pointer" }, chipSx, viewAsUsername ? {
                  bgcolor: "rgba(245, 158, 11, 0.18)",
                  border: "1px solid rgba(245, 158, 11, 0.45)",
                } : {}),
                "aria-label": ariaLabel,
                "aria-haspopup": "true",
                "aria-expanded": open ? "true" : "false",
              })
              : React.createElement(MUI.Chip, {
                size: "small",
                variant: "filled",
                className: "header-session-chip",
                clickable: true,
                icon: Icon
                  ? React.createElement(Icon, { icon: "mdi:account-circle-outline", size: 18 })
                  : React.createElement("img", {
                    className: "header-session-avatar",
                    src: avatarUrl,
                    alt: "",
                    decoding: "async",
                    loading: "lazy",
                    width: 18,
                    height: 18,
                    style: { borderRadius: "50%", margin: 0 },
                  }),
                label: headerLabel,
                onClick: function (e) { setAnchor(e.currentTarget); },
                sx: Object.assign({
                  cursor: "pointer",
                  height: "auto",
                  minHeight: 28,
                  py: 0.375,
                  px: 1.25,
                  "& .MuiChip-label": { px: 0.25, py: 0.25 },
                }, chipSx, viewAsUsername ? {
                  bgcolor: "rgba(245, 158, 11, 0.18)",
                  border: "1px solid rgba(245, 158, 11, 0.45)",
                } : {}),
                "aria-label": ariaLabel,
                "aria-haspopup": "true",
                "aria-expanded": open ? "true" : "false",
              }),
          ),
        ),
      ),
      React.createElement(
        MUI.Menu,
        {
          anchorEl: anchor,
          open: open,
          onClose: closeMenu,
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          transformOrigin: { vertical: "top", horizontal: "right" },
          TransitionProps: { onExited: handleMenuExited },
          slotProps: {
            paper: { sx: { minWidth: 240, maxWidth: 280, mt: 0.5, overflow: "hidden" } },
            transition: { onExited: handleMenuExited },
          },
        },
        React.createElement(
          MUI.Box,
          { sx: { px: 2, py: 1.25 } },
          React.createElement(MUI.Typography, { variant: "subtitle2" }, tooltipLabel),
          sessionRole
            ? React.createElement(MUI.Typography, { variant: "caption", color: "text.secondary" }, "Rol: " + sessionRole)
            : null,
          viewAsUsername
            ? React.createElement(
              MUI.Chip,
              {
                size: "small",
                color: "warning",
                label: "Suplantando · " + viewAsUsername,
                sx: { mt: 0.75, height: 22, fontSize: "0.68rem" },
              },
            )
            : null,
        ),
        React.createElement(MUI.Divider, null),
        canViewAs
          ? React.createElement(
            MUI.MenuItem,
            {
              onClick: openViewAsDialog,
            },
            Icon
              ? React.createElement(
                MUI.ListItemIcon,
                { sx: { minWidth: 32 } },
                React.createElement(Icon, { icon: "mdi:account-switch-outline", size: 18 }),
              )
              : null,
            React.createElement(MUI.ListItemText, { primary: "Suplantación…" }),
          )
          : null,
        viewAsUsername && (props.onViewAsClear || Session?.clearViewAs)
          ? React.createElement(
            MUI.MenuItem,
            {
              onClick: handleViewAsClear,
            },
            Icon
              ? React.createElement(
                MUI.ListItemIcon,
                { sx: { minWidth: 32 } },
                React.createElement(Icon, { icon: "mdi:account-revert-outline", size: 18 }),
              )
              : null,
            React.createElement(MUI.ListItemText, { primary: "Dejar de suplantar" }),
          )
          : null,
        (canViewAs || viewAsUsername) ? React.createElement(MUI.Divider, null) : null,
        envSwitchAllowed() && TargetSwitchMenu
          ? React.createElement(
              MUI.MenuItem,
              {
                disableRipple: true,
                sx: {
                  cursor: "default",
                  width: "100%",
                  maxWidth: "100%",
                  boxSizing: "border-box",
                  pl: 2,
                  pr: 1.5,
                  py: 0,
                  minHeight: 36,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  "&:hover": { bgcolor: "transparent" },
                  "& > .MuiBox-root": { width: "100%", maxWidth: "100%" },
                },
                onClick: function (e) { e.stopPropagation(); },
              },
              React.createElement(TargetSwitchMenu, null),
            )
          : null,
        props.runUnitTestUrl && UnitTestModal
          ? React.createElement(
              MUI.MenuItem,
              {
                onClick: function () {
                  closeMenu();
                  setTestOpen(true);
                },
              },
              Icon
                ? React.createElement(
                    MUI.ListItemIcon,
                    { sx: { minWidth: 32 } },
                    React.createElement(Icon, { icon: "mdi:flask-outline", size: 18 }),
                  )
                : null,
              React.createElement(MUI.ListItemText, { primary: "Ejecutar test unitario" }),
            )
          : null,
        React.createElement(MUI.Divider, null),
        React.createElement(
          MUI.MenuItem,
          {
            onClick: function () {
              closeMenu();
              if (props.onLogout) props.onLogout();
            },
          },
          Icon
            ? React.createElement(
                MUI.ListItemIcon,
                { sx: { minWidth: 32 } },
                React.createElement(Icon, { icon: "mdi:logout", size: 18 }),
              )
            : null,
          React.createElement(MUI.ListItemText, { primary: "Cerrar sesión" }),
        ),
      ),
      UnitTestModal && props.runUnitTestUrl
        ? React.createElement(UnitTestModal, {
            open: testOpen,
            onClose: function () { setTestOpen(false); },
            runUrl: props.runUnitTestUrl,
            getAuthHeaders: props.getAuthHeaders,
            title: props.unitTestTitle || "Test unitario",
          })
        : null,
      canViewAs && ViewAsDialog
        ? React.createElement(ViewAsDialog, {
          ns: ns,
          open: viewAsOpen,
          onClose: function () { setViewAsOpen(false); },
          currentViewAs: viewAsUsername || null,
          onSelected: handleViewAsSelected,
          onCleared: handleViewAsCleared,
        })
        : null,
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.UI = window.ISAFront.UI || {};
  window.ISAFront.UI.UserSessionMenu = UserSessionMenu;
})();
