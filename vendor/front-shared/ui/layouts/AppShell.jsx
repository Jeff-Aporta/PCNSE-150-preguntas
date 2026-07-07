/**
 * Layout estándar Jeff-Aporta: AppBar + filas de tabs + body sin scroll global.
 * El switch Local/Producción en barra solo si no hay UserSessionMenu en toolbarEnd/Extra.
 * Requiere ISAFront.registerApp previo (ns con Theme, UI, Auth/Session opcional).
 */
(function () {
  "use strict";
  const MUI = MaterialUI;
  const React = window.React;

  const TAB_LABEL_STYLE = { display: "inline-flex", alignItems: "center", gap: "10px" };
  const TOOLBAR_MIN_H = 48;
  const TOOLBAR_TAB_H = 36;
  const SUB_NAV_TAB_H = 26;
  const BRAND_HOME_EVENT = "isa:brand-home";

  function readMetaTag(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? String(el.getAttribute("content") || "").trim() : "";
  }

  function ensureAppMeta() {
    if (typeof globalThis.AppMeta !== "undefined") {
      if (globalThis.AppMeta.cfg) return globalThis.AppMeta.cfg;
      if (typeof globalThis.AppMeta.initFromDocument === "function") {
        return globalThis.AppMeta.initFromDocument();
      }
    }
    return {
      shortName: readMetaTag("application-name") || document.title || "App",
      title: document.title || "App",
      icon: readMetaTag("app-icon") || "mdi:application-outline",
    };
  }

  function resolveBrand(props) {
    const meta = ensureAppMeta();
    return {
      title: props.title != null ? props.title : (meta.shortName || meta.title || "App"),
      icon: props.icon != null ? props.icon : (meta.icon || "mdi:application-outline"),
    };
  }

  function defaultBrandClick() {
    if (window.ISAFront && typeof window.ISAFront.goBrandHome === "function") {
      window.ISAFront.goBrandHome();
      return;
    }
    window.dispatchEvent(new CustomEvent(BRAND_HOME_EVENT, { bubbles: true }));
  }

  function resolveBrandClick(props) {
    if (props.onBrandClick === false || props.brandClick === false) return null;
    if (typeof props.onBrandClick === "function") return props.onBrandClick;
    return defaultBrandClick;
  }

  function navTabRowSx(minH, opts) {
    const compact = opts && opts.compact;
    return {
      minHeight: minH,
      flexShrink: 0,
      "& .MuiTabs-scroller": { display: "flex", alignItems: "center", minHeight: minH },
      "& .MuiTabs-list": { alignItems: "center", minHeight: minH },
      "& .MuiTab-root": {
        minHeight: minH,
        height: minH,
        maxHeight: minH,
        textTransform: "none",
        py: compact ? 0 : 0.75,
        px: compact ? 1 : 1.5,
        minWidth: compact ? 64 : 72,
        fontSize: compact ? "0.75rem" : "0.875rem",
        lineHeight: 1.2,
        display: "inline-flex",
        alignItems: "center",
      },
    };
  }

  /** @param {{ tier?: string, compact?: boolean, minHeight?: number }} row @param {"toolbar"|"sub"} placement */
  function resolveNavRowLayout(row, placement) {
    const tier = row.tier || (placement === "toolbar" ? "primary" : "secondary");
    const secondary = tier === "secondary" || row.compact === true;
    return {
      tier: secondary ? "secondary" : "primary",
      minHeight: row.minHeight != null ? row.minHeight : secondary ? SUB_NAV_TAB_H : TOOLBAR_TAB_H,
      iconSize: row.iconSize != null ? row.iconSize : secondary ? 13 : 18,
      className: secondary ? "isa-nav-row isa-nav-row--secondary" : "isa-nav-row isa-nav-row--primary",
      compact: secondary,
    };
  }

  function bagUi(ns) {
    const bag = window[ns];
    if (!bag?.UI) throw new Error("NavTabRow: registrar ISAFront para " + ns);
    return bag.UI;
  }

  function openTabInNewWindow(tabHref, tabId, e) {
    if (typeof tabHref !== "function") return false;
    const mod = e && (e.ctrlKey || e.metaKey || e.button === 1);
    if (!mod) return false;
    const url = tabHref(tabId);
    if (!url) return false;
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
    window.open(url, "_blank", "noopener,noreferrer");
    return true;
  }

  function NavTabLabel(props) {
    const UI = props.UI || bagUi(props.ns);
    const icon = props.locked ? "mdi:lock-outline" : props.icon;
    const size = props.iconSize != null ? props.iconSize : 18;
    return React.createElement(
      "span",
      { style: Object.assign({}, TAB_LABEL_STYLE, props.compact ? { gap: "6px" } : null) },
      React.createElement(UI.Icon, { icon: icon, size: size }),
      React.createElement("span", null, props.label),
    );
  }

  function renderNavTab(UI, props, t) {
    const tabEl = React.createElement(MUI.Tab, {
      key: t.id,
      value: t.id,
      disabled: Boolean(t.disabled),
      label: React.createElement(NavTabLabel, {
        UI: UI,
        icon: t.icon,
        label: t.label || t.title || t.id,
        locked: Boolean(t.disabled),
        iconSize: props.iconSize,
        compact: props.compact,
      }),
      onClick: function (e) {
        if (t.disabled) {
          if (e.preventDefault) e.preventDefault();
          if (e.stopPropagation) e.stopPropagation();
          return;
        }
        openTabInNewWindow(props.tabHref, t.id, e);
      },
      onAuxClick: function (e) {
        if (t.disabled) return;
        if (e.button === 1) openTabInNewWindow(props.tabHref, t.id, e);
      },
    });
    const title = t.disabledTitle || (t.disabled ? "No disponible" : "");
    if (t.disabled && title) {
      return React.createElement(
        MUI.Tooltip,
        { key: t.id, title: title, arrow: true },
        React.createElement("span", { style: { display: "inline-flex" } }, tabEl),
      );
    }
    return tabEl;
  }

  /** Fila de tabs con icono + etiqueta (estilo jagudeloe). */
  function NavTabRow(props) {
    const UI = props.UI || bagUi(props.ns);
    const layout = resolveNavRowLayout(props, props.placement || (props.tier === "primary" ? "toolbar" : "sub"));
    const minH = props.minHeight != null ? props.minHeight : layout.minHeight;
    const tabs = props.tabs || [];
    return React.createElement(
      MUI.Tabs,
      {
        className: props.className || layout.className,
        value: props.value,
        onChange: function (e, v) {
          if (e && (e.ctrlKey || e.metaKey)) return;
          if (v != null && props.onChange) props.onChange(v);
        },
        variant: props.variant || "scrollable",
        sx: Object.assign(navTabRowSx(minH, { compact: layout.compact }), props.sx || {}),
      },
      tabs.map(function (t) {
        return renderNavTab(
          UI,
          Object.assign({}, props, { iconSize: props.iconSize != null ? props.iconSize : layout.iconSize, compact: layout.compact }),
          t,
        );
      }),
    );
  }

  /** Contenedor de vista con fila de tabs inferior opcional y área scroll interna. */
  function ViewFrame(props) {
    return React.createElement(
      MUI.Box,
      { className: "isa-view-frame", sx: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 } },
      props.navRow
        ? React.createElement(NavTabRow, Object.assign({ minHeight: 40 }, props.navRow, {
            sx: Object.assign(
              { px: 1, borderBottom: 1, borderColor: "divider" },
              props.navRow.sx || {},
            ),
          }))
        : null,
      React.createElement(
        MUI.Box,
        {
          className: props.scroll !== false ? "isa-scroll-panel" : "isa-layout-body",
          sx: Object.assign({ flex: 1, minHeight: 0, overflow: props.scroll === false ? "hidden" : "auto" }, props.bodySx || {}),
        },
        props.children,
      ),
    );
  }

  /** Media query sin ThemeProvider (AppShell es la raíz del theme). */
  var BREAKPOINT_MAX = { xs: 599.95, sm: 899.95, md: 1199.95, lg: 1535.95, xl: 1e6 };

  function useMatchDown(breakpoint) {
    var max = BREAKPOINT_MAX[breakpoint] != null ? BREAKPOINT_MAX[breakpoint] : BREAKPOINT_MAX.md;
    var query = "(max-width: " + max + "px)";
    var get = function () { return typeof window !== "undefined" && window.matchMedia(query).matches; };
    var _a = React.useState(get), compact = _a[0], setCompact = _a[1];
    React.useEffect(function () {
      if (typeof window === "undefined") return undefined;
      var mql = window.matchMedia(query);
      function onChange() { setCompact(mql.matches); }
      onChange();
      if (mql.addEventListener) mql.addEventListener("change", onChange);
      else mql.addListener(onChange);
      return function () {
        if (mql.removeEventListener) mql.removeEventListener("change", onChange);
        else mql.removeListener(onChange);
      };
    }, [query]);
    return compact;
  }

  function AppShell(props) {
    const bag = window[props.ns];
    if (!bag?.Theme || !bag?.UI) {
      throw new Error("AppShell: registrar ISAFront para " + props.ns + " antes de renderizar");
    }
    const UI = bag.UI;
    const tm = bag.Theme.useThemeMode();
    const Auth = bag.Auth;
    const Session = bag.Session;
    function isLocalHost() {
      const h = window.location?.hostname || "";
      return h === "localhost" || /^127\.0\.0(?:\.|$)/.test(h) || h === "::1" || h === "[::1]";
    }
    function targetSwitchAllowed() {
      if (props.showTarget === false) return false;
      if (props.showTarget === true) return true;
      if (isLocalHost()) return true;
      return !!(Session && Session.can && Session.can("infra.target.switch"));
    }
    /** Chip suelto en barra: solo si no hay sesión en toolbarEnd/Extra (ahí va TargetSwitchMenu). */
    function targetSwitchChipInBar() {
      if (props.showTarget === false) return false;
      if (props.toolbarEnd || props.toolbarExtra) return props.showTarget === true;
      return targetSwitchAllowed();
    }
    const showTarget = targetSwitchAllowed();
    const showTargetChip = targetSwitchChipInBar();
    const showTheme = props.showTheme !== false;
    const showAuthChip = props.showAuthChip === true && Auth?.isLoggedIn?.();
    const showLogout = props.showLogout === true && Auth?.isLoggedIn?.();
    const navRows = Array.isArray(props.navRows) ? props.navRows : [];
    const chromeless = props.chromeless === true;
    const toolbarNav = navRows[0] || null;
    const subNavRows = navRows.slice(1);
    const FP = UI.FeedbackProvider;
    const brand = resolveBrand(props);
    const brandClick = resolveBrandClick(props);
    const showTitle = props.showTitle !== false;
    const mobileNavEnabled = !chromeless && props.mobileNav !== false && navRows.length > 0;
    /** Drawer/hamburger solo en viewport estrecho; las tabs del toolbar siempre visibles. */
    const drawerBreakpoint = props.mobileBreakpoint || props.mobileDrawerBreakpoint || "xs";
    const drawerNav = mobileNavEnabled && useMatchDown(drawerBreakpoint);
    const showToolbarTabs = Boolean(toolbarNav);
    const [drawerOpen, setDrawerOpen] = React.useState(false);

    const menuButton = drawerNav
      ? React.createElement(
          MUI.IconButton,
          {
            edge: "start",
            color: "inherit",
            "aria-label": "Abrir menú de navegación",
            onClick: function () { setDrawerOpen(true); },
            sx: { mr: 0.25, flexShrink: 0 },
          },
          React.createElement(UI.Icon, { icon: "mdi:menu", size: 22 }),
        )
      : null;

    const mobileNavDrawer = drawerNav
      ? React.createElement(
          MUI.Drawer,
          {
            anchor: "left",
            open: drawerOpen,
            onClose: function () { setDrawerOpen(false); },
            ModalProps: { keepMounted: true },
            PaperProps: {
              className: "isa-mobile-nav-drawer",
              sx: {
                width: "min(300px, calc(100vw - 12px))",
                maxWidth: "100%",
                height: "100%",
                maxHeight: "100%",
                boxSizing: "border-box",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              },
            },
          },
          React.createElement(
            MUI.Box,
            {
              sx: {
                display: "flex",
                alignItems: "center",
                gap: 1,
                px: 2,
                py: 1.5,
                borderBottom: 1,
                borderColor: "divider",
                flexShrink: 0,
              },
            },
            brand.icon
              ? React.createElement(UI.Icon, { icon: brand.icon, size: 22 })
              : null,
            React.createElement(
              MUI.Typography,
              { variant: "subtitle1", sx: { flex: 1, fontWeight: 700 } },
              brand.title || "Menú",
            ),
            React.createElement(
              MUI.IconButton,
              {
                size: "small",
                "aria-label": "Cerrar menú",
                onClick: function () { setDrawerOpen(false); },
              },
              React.createElement(UI.Icon, { icon: "mdi:close", size: 20 }),
            ),
          ),
          React.createElement(
            MUI.Box,
            { sx: { flex: 1, minHeight: 0, overflow: "auto" } },
            navRows.map(function (row, rowIdx) {
              return React.createElement(
              MUI.List,
              {
                key: row.id || "drawer-nav-" + rowIdx,
                dense: true,
                sx: { py: 0.5 },
              },
              (row.tabs || []).map(function (t) {
                const blocked = Boolean(t.disabled);
                const item = React.createElement(
                  MUI.ListItemButton,
                  {
                    key: t.id,
                    selected: row.value === t.id,
                    disabled: blocked,
                    onClick: function (e) {
                      if (blocked) return;
                      if (openTabInNewWindow(row.tabHref, t.id, e)) return;
                      if (row.onChange) row.onChange(t.id);
                      setDrawerOpen(false);
                    },
                    onAuxClick: function (e) {
                      if (blocked) return;
                      if (e.button === 1) openTabInNewWindow(row.tabHref, t.id, e);
                    },
                    sx: { py: 1, px: 2 },
                  },
                  React.createElement(
                    MUI.ListItemIcon,
                    { sx: { minWidth: 36 } },
                    React.createElement(UI.Icon, {
                      icon: blocked ? "mdi:lock-outline" : t.icon,
                      size: 20,
                    }),
                  ),
                  React.createElement(MUI.ListItemText, {
                    primary: t.label || t.title || t.id,
                    primaryTypographyProps: { fontWeight: row.value === t.id ? 700 : 500 },
                  }),
                );
                if (blocked && t.disabledTitle) {
                  return React.createElement(
                    MUI.Tooltip,
                    { key: t.id, title: t.disabledTitle, arrow: true },
                    React.createElement("span", { style: { display: "block" } }, item),
                  );
                }
                return item;
              }),
              );
            }),
          ),
        )
      : null;

    const bar = chromeless ? null : React.createElement(
      MUI.AppBar,
      {
        position: "static",
        color: "default",
        elevation: 0,
        sx: { borderBottom: 1, borderColor: "divider", flexShrink: 0 },
      },
      React.createElement(
        MUI.Toolbar,
        {
          variant: "dense",
          sx: {
            gap: 1,
            minHeight: TOOLBAR_MIN_H,
            px: { xs: 1, sm: 2 },
            flexWrap: "nowrap",
            alignItems: "center",
          },
        },
        menuButton,
        brand.icon || brand.title
          ? React.createElement(
              MUI.Box,
              {
                className: brandClick ? "isa-app-brand isa-app-brand--clickable" : "isa-app-brand",
                onClick: brandClick || undefined,
                onKeyDown:
                  brandClick
                    ? function (e) {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          brandClick();
                        }
                      }
                    : undefined,
                role: brandClick ? "button" : undefined,
                tabIndex: brandClick ? 0 : undefined,
                title: brandClick ? "Inicio" : undefined,
                sx: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  flexShrink: 0,
                  mr: 1,
                  borderRadius: 1,
                  px: brandClick ? 0.5 : 0,
                  py: brandClick ? 0.25 : 0,
                  cursor: brandClick ? "pointer" : "default",
                  "&:hover": brandClick ? { bgcolor: "action.hover" } : {},
                },
              },
              brand.icon
                ? React.createElement(UI.Icon, { icon: brand.icon, size: props.iconSize || 24 })
                : null,
              showTitle && brand.title
                ? React.createElement(MUI.Typography, {
                    variant: "h6",
                    component: "span",
                    sx: { flexShrink: 0, display: drawerNav ? { xs: "none", sm: "inline" } : "inline" },
                  }, brand.title)
                : null,
            )
          : null,
        showToolbarTabs
          ? React.createElement(
              MUI.Box,
              { sx: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", overflow: "hidden" } },
              React.createElement(NavTabRow, Object.assign({}, toolbarNav, {
                ns: props.ns,
                placement: "toolbar",
                tier: toolbarNav.tier || "primary",
                sx: Object.assign({ flex: 1, minWidth: 0 }, toolbarNav.sx || {}),
              })),
            )
          : React.createElement(MUI.Box, { sx: { flex: 1 } }),
        React.createElement(
          MUI.Stack,
          {
            direction: "row",
            spacing: { xs: 0.5, sm: 1 },
            alignItems: "center",
            sx: { flexShrink: 0 },
          },
          props.toolbarExtra || null,
          showAuthChip && Auth
            ? (window.ISAFront.UI?.UserSessionMenu
              ? React.createElement(window.ISAFront.UI.UserSessionMenu, {
                  ns: props.ns,
                  username: Session?.username?.() || Auth.username(),
                  displayName: Session?.displayName?.() || "",
                  role: Auth.role?.() || Session?.current?.()?.role || "",
                  onLogout: function () { Auth.logout(); },
                  showTarget: showTarget,
                  runUnitTestUrl: props.runUnitTestUrl,
                  getAuthHeaders: props.getAuthHeaders,
                  unitTestTitle: props.unitTestTitle,
                })
              : React.createElement(MUI.Chip, { size: "small", label: Auth.username(), variant: "outlined" }))
            : null,
          showTargetChip && !showAuthChip ? React.createElement(UI.TargetSwitch, null) : null,
          props.toolbarActions || null,
          showLogout && Auth
            ? React.createElement(MUI.Button, { size: "small", onClick: function () { Auth.logout(); } }, "Salir")
            : null,
          props.toolbarEnd || null,
          showTheme ? React.createElement(UI.ThemeSwitch, { mode: tm.mode, onToggle: tm.toggle }) : null,
        ),
      ),
      subNavRows.length
        ? subNavRows.map(function (row, i) {
            return React.createElement(NavTabRow, Object.assign({ key: row.id || "nav-" + i, ns: props.ns, placement: "sub" }, row, {
              tier: row.tier || "secondary",
              sx: Object.assign({ px: 0.75, borderTop: 1, borderColor: "divider" }, row.sx || {}),
            }));
          })
        : null,
      props.headerSub
        ? React.createElement(
            MUI.Box,
            {
              className: "isa-header-sub",
              sx: {
                borderTop: 1,
                borderColor: "divider",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                minHeight: 26,
                maxHeight: 30,
                px: 0.75,
                overflow: "hidden",
              },
            },
            props.headerSub,
          )
        : null,
    );

    const bodyOverflow = props.bodyScroll === true ? "auto" : "hidden";
    const frame = React.createElement(
      MUI.Box,
      { className: "isa-layout-root", sx: { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" } },
      bar,
      React.createElement(
        MUI.Box,
        {
          className: "isa-layout-body",
          sx: { flex: 1, minHeight: 0, overflow: bodyOverflow, display: "flex", flexDirection: "column" },
        },
        props.children,
      ),
    );

    const gated = props.loginGate && UI.LoginGate ? React.createElement(UI.LoginGate, null, frame) : frame;
    const wrapped = FP ? React.createElement(FP, null, gated) : gated;

    return React.createElement(
      MUI.ThemeProvider,
      { theme: tm.theme },
      React.createElement(MUI.CssBaseline, null),
      mobileNavDrawer,
      wrapped,
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.Layout = window.ISAFront.Layout || {};
  window.ISAFront.Layout.NavTabLabel = NavTabLabel;
  window.ISAFront.Layout.NavTabRow = NavTabRow;
  window.ISAFront.Layout.ViewFrame = ViewFrame;
  window.ISAFront.Layout.goBrandHome = defaultBrandClick;
  window.ISAFront.Layout.AppShell = AppShell;
})();
