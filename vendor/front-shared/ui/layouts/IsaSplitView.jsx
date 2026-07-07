/**
 * Layout recurrente: panel izquierdo redimensionable + contenido principal.
 * kit="neon-glass" (default) u otros vía data-isa-kit en el root.
 * Clic en el título del panel → colapsa a columna de icono.
 */
(function (global) {
  "use strict";
  const React = global.React;
  const MUI = global.MaterialUI;
  if (!React || !MUI) return;

  const { Box, Typography, IconButton, Tooltip } = MUI;
  const useResizablePanel = (global.ISAFront && global.ISAFront.Layout && global.ISAFront.Layout.useResizablePanel)
    || function () { return { width: 380, collapsed: false, dragging: false, toggleCollapsed: function () {} }; };

  const DEFAULT_W = global.ISA_SPLIT_PANEL_DEFAULT_WIDTH || 380;
  const COLLAPSED_W = global.ISA_SPLIT_PANEL_COLLAPSED_WIDTH || 52;

  function resolveIcon(UI, icon) {
    if (!icon || !UI || !UI.Icon) return null;
    return React.createElement(UI.Icon, { icon: icon, size: 20 });
  }

  function IsaSplitView(props) {
    const kit = props.kit || "neon-glass";
    const hideBelow = props.hidePanelBelow || null;
    const drawerMode = Boolean(props.drawerMode);
    const storageKey = props.storageKey || "";
    const defaultWidth = props.defaultWidth != null ? props.defaultWidth : DEFAULT_W;
    const minWidth = props.minWidth;
    const maxWidth = props.maxWidth;
    const panelTitle = props.panelTitle || "";
    const panelIcon = props.panelIcon || "mdi:panel-left";
    const UI = props.UI || (global.ISAFront && global.ISAFront.UI) || global.UI || {};

    const panel = useResizablePanel({
      storageKey: storageKey,
      defaultWidth: defaultWidth,
      minWidth: minWidth,
      maxWidth: maxWidth,
      readPersistedWidth: props.readPersistedWidth,
      writePersistedWidth: props.writePersistedWidth,
    });

    const panelWidth = panel.collapsed ? COLLAPSED_W : panel.width;
    const showResize = !drawerMode && !panel.collapsed;

    function expandPanel() {
      if (panel.collapsed) panel.toggleCollapsed();
    }

    const collapsedRailContent = panel.collapsed && props.collapsedRail
      ? (typeof props.collapsedRail === "function"
        ? props.collapsedRail({ expand: expandPanel, UI: UI })
        : props.collapsedRail)
      : null;

    const headInner = panel.collapsed
      ? React.createElement(
          Tooltip,
          { title: panelTitle || "Expandir panel", placement: "right" },
          React.createElement(
            IconButton,
            {
              size: "small",
              onClick: panel.toggleCollapsed,
              "aria-label": "Expandir panel",
              className: "isa-split-view__collapse-btn",
            },
            resolveIcon(UI, panelIcon),
          ),
        )
      : React.createElement(
          Box,
          {
            className: "isa-split-view__panel-title",
            role: "button",
            tabIndex: 0,
            onClick: panel.toggleCollapsed,
            onKeyDown: function (e) {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                panel.toggleCollapsed();
              }
            },
            "aria-expanded": !panel.collapsed,
            title: "Clic para colapsar",
          },
          resolveIcon(UI, panelIcon),
          panelTitle
            ? React.createElement(Typography, {
              component: "span",
              variant: "subtitle2",
              className: "isa-split-view__panel-title-text",
              noWrap: true,
            }, panelTitle)
            : null,
        );

    const headEnd = !panel.collapsed && props.panelHeaderEnd
      ? React.createElement(
          Box,
          {
            className: "isa-split-view__panel-head-end",
            onClick: function (e) { e.stopPropagation(); },
            onKeyDown: function (e) { e.stopPropagation(); },
          },
          props.panelHeaderEnd,
        )
      : null;

    const panelSx = Object.assign(
      {
        position: "relative",
        width: drawerMode ? "100%" : { xs: "100%", md: panelWidth },
        flexShrink: 0,
        minHeight: 0,
        height: drawerMode ? "100%" : "auto",
        display: hideBelow ? { xs: "none", [hideBelow]: "flex" } : "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
      },
      props.panelSx || {},
    );

    return React.createElement(
      Box,
      {
        className: ["isa-split-view", props.className].filter(Boolean).join(" "),
        "data-isa-kit": kit,
        sx: Object.assign({
          display: "flex",
          flex: "1 1 auto",
          minHeight: 0,
          height: "100%",
          flexDirection: { xs: "column", md: "row" },
          overflow: "hidden",
          position: "relative",
        }, props.sx || {}),
      },
      React.createElement(
        Box,
        {
          className: [
            "isa-split-view__panel",
            panel.collapsed ? "isa-split-view__panel--collapsed" : "",
            props.panelClassName,
          ].filter(Boolean).join(" "),
          sx: panelSx,
        },
        React.createElement(
          Box,
          { className: "isa-split-view__panel-head", sx: { flexShrink: 0 } },
          headInner,
          headEnd,
          props.onClose
            ? React.createElement(
                Tooltip,
                { title: "Cerrar panel" },
                React.createElement(
                  IconButton,
                  { size: "small", onClick: props.onClose, "aria-label": "Cerrar panel" },
                  resolveIcon(UI, "mdi:close"),
                ),
              )
            : null,
        ),
        collapsedRailContent
          ? React.createElement(
            Box,
            {
              className: "isa-split-view__collapsed-rail",
              sx: {
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.5,
                py: 1,
              },
            },
            collapsedRailContent,
          )
          : null,
        !panel.collapsed
          ? React.createElement(
              Box,
              {
                className: "isa-split-view__panel-body",
                sx: { flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" },
              },
              props.panel,
            )
          : null,
        showResize
          ? React.createElement(Box, {
            className: ["isa-split-view__resize-handle", panel.dragging ? "is-dragging" : ""].filter(Boolean).join(" "),
            role: "separator",
            "aria-orientation": "vertical",
            "aria-label": "Redimensionar panel",
            title: "Arrastrar para cambiar ancho",
            onMouseDown: panel.onResizeStart,
          })
          : null,
      ),
      React.createElement(
        Box,
        {
          className: ["isa-split-view__main", props.mainClassName].filter(Boolean).join(" "),
          sx: Object.assign({
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }, props.mainSx || {}),
        },
        props.children,
      ),
    );
  }

  global.ISAFront = global.ISAFront || {};
  global.ISAFront.Layout = global.ISAFront.Layout || {};
  global.ISAFront.Layout.IsaSplitView = IsaSplitView;
})(typeof globalThis !== "undefined" ? globalThis : window);
