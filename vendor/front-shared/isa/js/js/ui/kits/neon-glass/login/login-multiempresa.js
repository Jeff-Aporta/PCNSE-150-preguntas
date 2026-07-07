/** Tercero InSoft — reintento automático ante login multiempresa (apps ISA actuales). */
export const DEFAULT_APP_ITERCERO = "810000630";

export function defaultIterceroFromTerceros(terceros) {
  const list = Array.isArray(terceros) ? terceros : [];
  const insoft = list.find((t) => String(t?.itercero ?? "").trim() === DEFAULT_APP_ITERCERO);
  return String(insoft?.itercero ?? list[0]?.itercero ?? "").trim();
}

/**
 * 1) login sin itercero
 * 2) si MULTI_EMPRESA → retry automático con InSoft (810000630)
 * 3) si falla el retry → MULTI_EMPRESA con lista para selector manual
 */
export async function loginWithInsoftAutoRetry(loginFn, loginId, pass, opts = {}) {
  if (String(opts.itercero ?? "").trim()) {
    return loginFn(loginId, pass, opts);
  }
  try {
    return await loginFn(loginId, pass, opts);
  } catch (e) {
    if (e?.code !== "MULTI_EMPRESA" || !Array.isArray(e.terceros) || !e.terceros.length) {
      throw e;
    }
    const terceros = e.terceros;
    try {
      return await loginFn(loginId, pass, { ...opts, itercero: DEFAULT_APP_ITERCERO });
    } catch (retryErr) {
      const err = new Error(
        retryErr instanceof Error ? retryErr.message : String(retryErr?.message || e.message || "Elija la empresa para continuar."),
      );
      err.code = "MULTI_EMPRESA";
      err.terceros = terceros;
      throw err;
    }
  }
}
