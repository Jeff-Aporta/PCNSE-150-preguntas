/**
 * Resuelve { method, path } de API a partir del catálogo de capacidades (system-login).
 * Las apps pueden sobreescribir entradas concretas vía capEndpoints en createServiceSession.
 */
export function buildCapEndpointMap(catalog, apiPrefix = "/api") {
  const map = {};
  const prefix = String(apiPrefix || "/api").replace(/\/$/, "");
  for (const def of catalog || []) {
    const capId = String(def?.id || "").trim();
    if (!capId) continue;
    for (const rule of def.rules || []) {
      const method = String(rule.method || "POST").toUpperCase();
      let path = String(rule.path || "").trim();
      if (!path) continue;
      if (!path.startsWith("/api")) {
        path = prefix + (path.startsWith("/") ? path : `/${path}`);
      }
      map[capId] = { method, path };
      break;
    }
  }
  return map;
}

/** true si el usuario tiene al menos una de las capacidades listadas. */
export function canAny(Session, capIds) {
  if (!Session?.isLoggedIn?.()) return false;
  const list = Array.isArray(capIds) ? capIds : [capIds];
  return list.some((id) => Session.can(id));
}
