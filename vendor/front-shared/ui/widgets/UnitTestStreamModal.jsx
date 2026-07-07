/**
 * Modal con stream SSE de /api/run-unit-test — render Markdown acumulado.
 */
(function () {
  "use strict";
  const React = window.React;
  const MUI = MaterialUI;

  function parseMd(src) {
    if (typeof window.marked?.parse === "function") return window.marked.parse(src);
    return src.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br/>");
  }

  async function consumeSse(url, headers, onEvent, signal) {
    const res = await fetch(url, {
      method: "GET",
      headers: Object.assign({ Accept: "text/event-stream" }, headers || {}),
      signal: signal,
    });
    if (!res.ok) throw new Error("Test unitario falló (" + res.status + ")");
    if (!res.body) throw new Error("Stream no disponible");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buf += dec.decode(chunk.value, { stream: true });
      var parts = buf.split("\n\n");
      buf = parts.pop() || "";
      for (var i = 0; i < parts.length; i++) {
        var block = parts[i];
        var line = block.split("\n").find(function (l) { return l.indexOf("data: ") === 0; });
        if (!line) continue;
        try {
          onEvent(JSON.parse(line.slice(6)));
        } catch (_e) { /* ignore malformed */ }
      }
    }
  }

  function UnitTestStreamModal(props) {
    const open = !!props.open;
    const [md, setMd] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [done, setDone] = React.useState(false);
    const [ok, setOk] = React.useState(null);

    React.useEffect(function () {
      if (!open) {
        setMd("");
        setBusy(false);
        setDone(false);
        setOk(null);
        return;
      }
      var url = typeof props.runUrl === "function" ? props.runUrl() : props.runUrl;
      if (!url) return;
      var ctrl = new AbortController();
      setBusy(true);
      setMd("### Iniciando test unitario…\n\n");
      consumeSse(
        url,
        props.getAuthHeaders ? props.getAuthHeaders() : {},
        function (ev) {
          if (ev && ev.md) setMd(function (prev) { return prev + "\n\n" + ev.md; });
          if (ev && ev.type === "summary") {
            setOk(!!ev.ok);
            setDone(true);
          }
          if (ev && ev.type === "error") {
            setOk(false);
            setDone(true);
          }
        },
        ctrl.signal,
      )
        .catch(function (err) {
          var msg = err instanceof Error ? err.message : String(err);
          setMd(function (prev) { return prev + "\n\n❌ **Error:** " + msg; });
          setOk(false);
          setDone(true);
        })
        .finally(function () { setBusy(false); });
      return function () { ctrl.abort(); };
    }, [open, props.runUrl]);

    return React.createElement(
      MUI.Dialog,
      {
        open: open,
        onClose: busy ? undefined : props.onClose,
        maxWidth: "md",
        fullWidth: true,
        scroll: "paper",
      },
      React.createElement(MUI.DialogTitle, { sx: { py: 1.5 } }, props.title || "Test unitario"),
      React.createElement(
        MUI.DialogContent,
        { dividers: true, sx: { minHeight: 280 } },
        busy && !done
          ? React.createElement(MUI.LinearProgress, { sx: { mb: 2 } })
          : null,
        React.createElement(MUI.Box, {
          className: "isa-unit-test-md",
          sx: {
            "& pre": { overflow: "auto", p: 1, borderRadius: 1, bgcolor: "action.hover" },
            "& code": { fontSize: "0.85em" },
            fontSize: "0.925rem",
            lineHeight: 1.55,
          },
          dangerouslySetInnerHTML: { __html: parseMd(md) },
        }),
      ),
      React.createElement(
        MUI.DialogActions,
        null,
        ok === true
          ? React.createElement(MUI.Chip, { size: "small", color: "success", label: "OK" })
          : ok === false
            ? React.createElement(MUI.Chip, { size: "small", color: "error", label: "Fallos" })
            : null,
        React.createElement(
          MUI.Button,
          { onClick: props.onClose, disabled: busy && !done },
          done ? "Cerrar" : "Cancelar",
        ),
      ),
    );
  }

  window.ISAFront = window.ISAFront || {};
  window.ISAFront.UI = window.ISAFront.UI || {};
  window.ISAFront.UI.UnitTestStreamModal = UnitTestStreamModal;
})();
