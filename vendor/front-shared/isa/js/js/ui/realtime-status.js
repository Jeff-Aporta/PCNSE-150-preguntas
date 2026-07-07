import { REALTIME_STATUS_EVENT, realtimeStatusTip, realtimeDotTone } from "../core/realtime/realtime.js";

/** UI compartida — dot de conexión WebSocket del orquestador (CF Realtime). */
export function createRealtimeStatusUI(React, MUI, ns) {
  const { useState, useEffect, useCallback } = React;
  const { Tooltip, IconButton } = MUI;

  function useRealtimeStatus() {
    const [state, setState] = useState("disconnected");

    useEffect(() => {
      const rt = () => window[ns]?.Realtime;
      const sync = () => setState(rt()?.getConnectionStatus?.() || "disconnected");
      sync();

      function onStatus(e) {
        const detail = e.detail || {};
        if (detail.ns && detail.ns !== ns) return;
        setState(detail.status || "disconnected");
      }

      window.addEventListener(REALTIME_STATUS_EVENT, onStatus);
      const id = setInterval(sync, 2000);
      return () => {
        window.removeEventListener(REALTIME_STATUS_EVENT, onStatus);
        clearInterval(id);
      };
    }, []);

    const reconnect = useCallback(() => {
      const rt = window[ns]?.Realtime;
      if (!rt) return;
      rt.disconnect?.();
      rt.start?.();
    }, []);

    return {
      state,
      tip: realtimeStatusTip(state),
      tone: realtimeDotTone(state),
      reconnect,
    };
  }

  function RealtimeStatusDot({ tone, tip, onReconnect, state: stateProp }) {
    const dotTone = tone || realtimeDotTone(stateProp || "disconnected");

    function onClick(e) {
      e.stopPropagation();
      onReconnect?.();
    }

    return React.createElement(
      Tooltip,
      { title: tip, arrow: true },
      React.createElement(
        IconButton,
        {
          size: "small",
          color: "inherit",
          className: "status-dot-trigger realtime-status-trigger",
          onClick,
          "aria-label": tip,
          sx: { width: 20, height: 20, flexShrink: 0, p: 0, minWidth: 0 },
        },
        React.createElement("span", {
          className: `status-dot status-dot--inline status-dot--${dotTone}`,
          "aria-hidden": true,
        }),
      ),
    );
  }

  return { useRealtimeStatus, RealtimeStatusDot };
}

/** Hook/componente seguros cuando la app no registra realtime (evita crash en LoginButton). */
export function createNoopRealtimeStatusUI(React, MUI, ns) {
  const base = createRealtimeStatusUI(React, MUI, ns);
  function useRealtimeStatus() {
    return {
      state: "disconnected",
      tip: "Notificaciones desconectadas",
      tone: "gray",
      reconnect: () => {},
    };
  }
  return { useRealtimeStatus, RealtimeStatusDot: base.RealtimeStatusDot };
}
