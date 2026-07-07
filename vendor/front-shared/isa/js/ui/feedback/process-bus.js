/**
 * Estado de procesos multi-paso — bus + runner imperativo.
 * Usado por SqlExec, guardados batch, etc.
 */

/** @type {Map<string, object>} */
const processes = new Map();

/** @type {Set<(snap: object) => void>} */
const processListeners = new Set();

export const FEEDBACK_PROCESS_EVENT = "isa:feedback:process";

function emitProcess() {
  const list = [...processes.values()].sort((a, b) => b.startedAt - a.startedAt);
  const snap = { active: list.filter((p) => p.status === "running"), recent: list.slice(0, 8) };
  processListeners.forEach((fn) => fn(snap));
  window.dispatchEvent(new CustomEvent(FEEDBACK_PROCESS_EVENT, { detail: snap }));
  return snap;
}

export function subscribeProcesses(fn) {
  processListeners.add(fn);
  fn(emitProcess());
  return () => processListeners.delete(fn);
}

function upsert(id, patch) {
  const prev = processes.get(id) || { id, steps: [], startedAt: Date.now() };
  processes.set(id, { ...prev, ...patch, updatedAt: Date.now() });
  emitProcess();
  return processes.get(id);
}

export function processStart(opts = {}) {
  const id = opts.id || `proc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const steps = (opts.steps || []).map((s, i) => ({
    id: s.id || `step-${i}`,
    label: s.label || s,
    status: "pending",
    detail: "",
  }));
  return upsert(id, {
    title: opts.title || "Proceso en curso",
    status: "running",
    steps,
    message: opts.message || "",
    error: null,
    startedAt: Date.now(),
  });
}

export function processUpdateStep(processId, stepId, status, detail = "") {
  const p = processes.get(processId);
  if (!p) return null;
  const steps = p.steps.map((s) =>
    s.id === stepId ? { ...s, status, detail: detail || s.detail } : s,
  );
  return upsert(processId, { steps });
}

export function processSetMessage(processId, message) {
  return upsert(processId, { message: message || "" });
}

export function processComplete(processId, status, message = "") {
  const p = processes.get(processId);
  if (!p) return null;
  return upsert(processId, {
    status: status === "error" ? "error" : "success",
    message,
    error: status === "error" ? message : null,
    finishedAt: Date.now(),
  });
}

export function processDismiss(processId) {
  processes.delete(processId);
  emitProcess();
}

function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r.toString().padStart(2, "0")}s` : `${r}s`;
}

/**
 * Runner de alto nivel para operaciones async con pasos.
 * @param {{ title?: string, steps?: {id:string,label:string}[], toast?: object }} opts
 */
export function createProcessRunner(opts = {}) {
  const toast = opts.toast;
  const proc = processStart({ title: opts.title, steps: opts.steps });
  const id = proc.id;
  const t0 = Date.now();
  let finished = false;

  function elapsed() {
    return fmtElapsed(Date.now() - t0);
  }

  function finish(kind, text) {
    if (finished) return;
    finished = true;
    if (kind === "success") {
      (proc.steps || []).forEach((s) => {
        if (s.status === "pending" || s.status === "running") {
          processUpdateStep(id, s.id, "done");
        }
      });
      const msg = text || "Completado";
      processComplete(id, "success", `${msg} (${elapsed()})`);
      toast?.success?.(`${msg} (${elapsed()})`);
      setTimeout(() => processDismiss(id), 8000);
    } else {
      const msg = String(text || "Error en el proceso");
      processComplete(id, "error", msg);
      toast?.error?.(msg);
      setTimeout(() => processDismiss(id), 12000);
    }
  }

  return {
    id,
    stepRunning(stepId, detail) {
      processUpdateStep(id, stepId, "running", detail);
    },
    stepDone(stepId, detail) {
      processUpdateStep(id, stepId, "done", detail);
    },
    stepError(stepId, detail) {
      processUpdateStep(id, stepId, "error", detail);
    },
    message(msg) {
      processSetMessage(id, msg);
    },
    succeed(text) {
      finish("success", text);
    },
    fail(text) {
      finish("error", text);
    },
    async runStep(stepId, label, fn) {
      processUpdateStep(id, stepId, "running", label);
      try {
        const result = await fn();
        processUpdateStep(id, stepId, "done");
        return result;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        processUpdateStep(id, stepId, "error", msg);
        throw e;
      }
    },
    async run(fn) {
      try {
        const result = await fn(this);
        this.succeed(opts.successMessage);
        return result;
      } catch (e) {
        this.fail(e instanceof Error ? e.message : String(e));
        throw e;
      }
    },
  };
}

export function createProcessApi(toastApi) {
  return {
    start: processStart,
    updateStep: processUpdateStep,
    setMessage: processSetMessage,
    complete: processComplete,
    dismiss: processDismiss,
    createRunner: (opts) => createProcessRunner({ ...opts, toast: toastApi }),
  };
}
