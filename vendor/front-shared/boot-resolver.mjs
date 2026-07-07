/**
 * Resuelve front-shared local (monorepo dev) o jsDelivr (prod).
 */
import { FRONT_SHARED_REF } from "./front-shared-ref.mjs";

export { FRONT_SHARED_REF };

export function isDevHost() {
  return typeof location !== "undefined" && /localhost|127\.0\.0\.1|\[::1\]/.test(location.hostname);
}

export function cdnAsset(subpath) {
  return "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + FRONT_SHARED_REF + "/cdn/" + subpath;
}

async function importFirst(urls, label) {
  let lastErr;
  const seen = new Set();
  for (const url of urls) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    try {
      return await import(url);
    } catch (e) {
      lastErr = e;
      console.warn(label + " falló:", url, e);
    }
  }
  throw lastErr || new Error(label + " no disponible");
}

function localSharedUrls(file) {
  const urls = [];
  try {
    urls.push(new URL("./" + file, import.meta.url).href);
  } catch (_) { /* ignore */ }
  if (!isDevHost()) return urls;
  const fsLocal = globalThis.__FS_LOCAL__;
  if (typeof fsLocal === "string" && fsLocal) {
    try {
      urls.push(new URL(file, new URL(fsLocal, location.href)).href);
    } catch (_) { /* ignore */ }
  }
  return urls;
}

/** @param {string} [_localFsRel] reservado — en dev host prioriza cdn/ local */
export async function importBootHelper(_localFsRel) {
  const urls = [...localSharedUrls("boot-helper.mjs"), cdnAsset("boot-helper.mjs?v=" + FRONT_SHARED_REF)];
  return importFirst(urls, "boot-helper");
}

/** @param {string} [_localFsRel] reservado — en dev host prioriza cdn/ local */
export async function importBootLoader(_localFsRel) {
  const urls = [...localSharedUrls("boot-loader.mjs"), cdnAsset("boot-loader.mjs?v=" + FRONT_SHARED_REF)];
  return importFirst(urls, "boot-loader");
}
