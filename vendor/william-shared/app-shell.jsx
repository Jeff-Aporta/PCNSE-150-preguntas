/**
 * AppShell — Layout estándar William Quest (sin login).
 * AppBar + tabs + body. ISA neon-glass.
 * Requiere WilliamFront.registerApp previo (provee Theme + UI).
 */
(function () {
  "use strict";
  const React = window.React;
  const MUI = window.MaterialUI;

  const TOOLBAR_MIN_H = 48;
  const TAB_LABEL_STYLE = { display: "inline-flex", alignItems: "center", gap: "10px" };

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
      shortName: readMetaTag("application-name") || document.title || "William Quest",
      title: document.title || "William Quest",
      icon: readMetaTag("app-icon") || "mdi:shield-lock-outline",
    };
  }

  function resolveBrand(props) {
    const meta = ensureAppMeta();
    return {
      title: props.title != null ? props.title : meta.shortName || meta.title || "App",
      icon: props.icon != null ? props.icon : meta.icon || "mdi:shield-lock-outline",
    };
  }

  function bagUi(ns) {
    const bag = window[ns];
    if (!bag || !bag.UI) throw new Error("AppShell(ns=" + ns + "): registrar WilliamFront primero");
    return bag.UI;
  }

  function NavTabLabel(props) {
    const UI = props.UI || bagUi(props.ns);
    return React.createElement(
      "span",
      { style: TAB_LABEL_STYLE },
      React.createElement(UI.Icon, { icon: props.icon, size: props.iconSize != null ? props.iconSize : 18 }),
      React.createElement("span", null, props.label)
    );
  }

  function NavTabRow(props) {
    const UI = props.UI || bagUi(props.ns);
    const tabs = props.tabs || [];
    const minH = props.minHeight != null ? props.minHeight : 40;
    return React.createElement(
      MUI.Tabs,
      {
        className: props.className || "isa-nav-row isa-nav-row--primary",
        value: props.value,
        onChange: function (e, v) {
          if (v != null && props.onChange) props.onChange(v);
        },
        variant: props.variant || "scrollable",
        sx: Object.assign(
          {
            minHeight: minH,
            flexShrink: 0,
            "& .MuiTabs-scroller": { display: "flex", alignItems: "center", minHeight: minH },
            "& .MuiTabs-list": { alignItems: "center", minHeight: minH },
            "& .MuiTab-root": {
              minHeight: minH,
              height: minH,
              maxHeight: minH,
              textTransform: "none",
              py: 0.75,
              px: 1.5,
              minWidth: 72,
              fontSize: "0.875rem",
              lineHeight: 1.2,
              display: "inline-flex",
              alignItems: "center",
            },
          },
          props.sx || {}
        ),
      },
      tabs.map(function (t) {
        return React.createElement(MUI.Tab, {
          key: t.id,
          value: t.id,
          label: React.createElement(NavTabLabel, {
            UI: UI,
            icon: t.icon,
            label: t.label || t.title || t.id,
            iconSize: 18,
          }),
        });
      })
    );
  }

  function ViewFrame(props) {
    return React.createElement(
      MUI.Box,
      { className: "isa-view-frame", sx: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 } },
      props.navRow
        ? React.createElement(NavTabRow, Object.assign({ minHeight: 40 }, props.navRow, {
            sx: Object.assign(
              { px: 1, borderBottom: 1, borderColor: "divider" },
              props.navRow.sx || {}
            ),
          }))
        : null,
      React.createElement(
        MUI.Box,
        {
          className: props.scroll !== false ? "isa-scroll-panel" : "isa-layout-body",
          sx: Object.assign(
            { flex: 1, minHeight: 0, overflow: props.scroll === false ? "hidden" : "auto" },
            props.bodySx || {}
          ),
        },
        props.children
      )
    );
  }

  function AppShell(props) {
    const bag = window[props.ns];
    if (!bag || !bag.Theme || !bag.UI) {
      throw new Error("AppShell(ns=" + props.ns + "): registrar WilliamFront antes de renderizar");
    }
    const UI = bag.UI;
    const tm = bag.Theme.useThemeMode();
    const brand = resolveBrand(props);
    const showTitle = props.showTitle !== false;
    const showTheme = props.showTheme !== false;
    const navRows = Array.isArray(props.navRows) ? props.navRows : [];
    const toolbarNav = navRows[0] || null;

    const bar = React.createElement(
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
        brand.icon || brand.title
          ? React.createElement(
              MUI.Box,
              {
                className: "isa-app-brand",
                sx: {
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.85,
                  flexShrink: 0,
                  mr: 1.5,
                  borderRadius: 1,
                  px: 0.75,
                  py: 0.35,
                  background:
                    "linear-gradient(120deg, rgba(30,144,255,0.18) 0%, rgba(99,102,241,0.12) 100%)",
                  border: "1px solid rgba(30,144,255,0.28)",
                  boxShadow: "0 0 18px rgba(30,144,255,0.18), inset 0 1px 0 rgba(255,255,255,0.06)",
                },
              },
              React.createElement(UI.Icon, { icon: brand.icon, size: props.iconSize || 22 }),
              showTitle && brand.title
                ? React.createElement(
                    MUI.Typography,
                    {
                      variant: "h6",
                      component: "span",
                      sx: {
                        flexShrink: 0,
                        fontWeight: 700,
                        letterSpacing: 0.3,
                        background: "linear-gradient(90deg, #63b3ff, #00e5ff)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      },
                    },
                    brand.title
                  )
                : null
            )
          : null,
        toolbarNav
          ? React.createElement(
              MUI.Box,
              { sx: { flex: 1, minWidth: 0, display: "flex", alignItems: "center", overflow: "hidden" } },
              React.createElement(NavTabRow, Object.assign({}, toolbarNav, {
                ns: props.ns,
                placement: "toolbar",
                sx: Object.assign({ flex: 1, minWidth: 0 }, toolbarNav.sx || {}),
              }))
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
          showTheme ? React.createElement(UI.ThemeSwitch, { mode: tm.mode, onToggle: tm.toggle }) : null
        )
      )
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
        props.children
      )
    );

    const wrapped = UI.FeedbackProvider ? React.createElement(UI.FeedbackProvider, null, frame) : frame;

    return React.createElement(MUI.ThemeProvider, { theme: tm.theme },
      React.createElement(MUI.CssBaseline, null),
      wrapped
    );
  }

  window.WilliamFront = window.WilliamFront || {};
  window.WilliamFront.Layout = { AppShell: AppShell, NavTabRow: NavTabRow, NavTabLabel: NavTabLabel, ViewFrame: ViewFrame };
})();