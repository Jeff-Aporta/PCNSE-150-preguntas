/**
 * app-meta.ts — bootstrap del metadata de la app para WilliamFront.
 */

export function bootstrapAppMeta(meta) {
  const existing = globalThis.AppMeta?.cfg || {};
  globalThis.AppMeta = globalThis.AppMeta || {};
  globalThis.AppMeta.cfg = Object.assign({}, existing, meta, {
    theme: Object.assign({}, existing.theme || {}, meta.theme || {}),
  });
}

export function getAppMeta() {
  return globalThis.AppMeta?.cfg || {};
}