/** Oculta nombres técnicos de infraestructura en textos visibles al usuario. */
const TECHNICAL =
  /main-orchestrator|workers\.dev|localhost:\d+|127\.0\.0\.1:\d+|878\d|azurewebsites|function app|orquestador|gateway|negotiate|accesstoken|cf-ai\.|system-login\.|jagudeloe-tks|cloudflare worker|langlab-azure/i;

export function sanitizeUserMessage(raw, fallback = "No se pudo completar la operación") {
  const msg = String(raw ?? "").trim();
  if (!msg) return fallback;
  if (TECHNICAL.test(msg)) return fallback;
  if (/^HTTP \d{3}$/.test(msg)) return fallback;
  if (/^Login falló \(\d+\)$/.test(msg)) return "No se pudo iniciar sesión";
  if (/verificaci[oó]n de permisos fallida|verify-access/i.test(msg)) {
    return "No se pudo verificar el permiso para esta operación";
  }
  return msg.length > 200 ? msg.slice(0, 197) + "…" : msg;
}
