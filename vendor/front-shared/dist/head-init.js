/** Insertar como primer script del `<head>` (después de charset) en cada front. */
(function () {
  var u = location.href.split("#")[0].split("?")[0];
  if (!u.endsWith("/")) u = u.endsWith(".html") ? u.slice(0, u.lastIndexOf("/") + 1) : u + "/";
  var b = document.createElement("base");
  b.href = u;
  document.head.appendChild(b);
})();

;
/**
 * Metadatos HTML — los tags OG/Twitter deben estar en index.html (crawlers no ejecutan JS).
 * AppMeta.initFromDocument() lee el <head> y expone cfg (p. ej. theme.lsKey para theme-init).
 */
(function (global) {
  "use strict";

  function iconifyPath(icon) {
    var i = String(icon || "mdi:application-outline").indexOf(":");
    if (i < 0) return "mdi/application-outline";
    return icon.slice(0, i) + "/" + icon.slice(i + 1);
  }

  function iconUrl(icon, opts) {
    opts = opts || {};
    var q = [];
    if (opts.color) q.push("color=" + encodeURIComponent(opts.color));
    if (opts.width) q.push("width=" + opts.width);
    if (opts.height) q.push("height=" + opts.height);
    return (
      "https://api.iconify.design/" +
      iconifyPath(icon) +
      ".svg" +
      (q.length ? "?" + q.join("&") : "")
    );
  }

  function readMeta(name) {
    var el = document.querySelector('meta[name="' + name + '"]');
    return el ? String(el.getAttribute("content") || "").trim() : "";
  }

  function readOg(property) {
    var el = document.querySelector('meta[property="' + property + '"]');
    return el ? String(el.getAttribute("content") || "").trim() : "";
  }

  /** Lee metadatos ya presentes en el HTML estático. */
  function initFromDocument() {
    var title = document.title || "App";
    var cfg = {
      title: title,
      shortName: readMeta("application-name") || title,
      description: readMeta("description"),
      keywords: readMeta("keywords"),
      themeColor: readMeta("theme-color") || "#1976d2",
      url: (document.querySelector('link[rel="canonical"]') || {}).href || location.href,
      siteName: readOg("og:site_name") || title,
      icon: readMeta("app-icon") || "mdi:application-outline",
      theme: { lsKey: readMeta("app-theme-ls-key") || "app:theme" },
    };
    global.AppMeta.cfg = cfg;
    return cfg;
  }

  /**
   * @deprecated Preferir tags estáticos en index.html + initFromDocument().
   * Mantenido para compatibilidad; inyecta tags si aún no existen (solo runtime).
   */
  function apply(cfg) {
    if (!cfg || typeof cfg !== "object") return initFromDocument();

    var title = cfg.title || "App";
    var desc = cfg.description || "";
    var icon = cfg.icon || "mdi:application-outline";
    var color = cfg.themeColor || "#1976d2";
    var url =
      cfg.url ||
      location.origin +
        location.pathname.replace(/\/?index\.html?$/, "").replace(/\/?$/, "/");
    var site = cfg.siteName || title;
    var ogImage = cfg.ogImage || iconUrl(icon, { color: color, width: 512, height: 512 });

    document.title = title;

    function upsertMeta(name, content, property) {
      if (!content) return;
      var sel = property
        ? 'meta[property="' + name + '"]'
        : 'meta[name="' + name + '"]';
      var el = document.querySelector(sel);
      if (!el) {
        el = document.createElement("meta");
        if (property) el.setAttribute("property", name);
        else el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    }

    function upsertLink(rel, href, type) {
      if (!href) return;
      var el = document.querySelector('link[rel="' + rel + '"]');
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
      if (type) el.setAttribute("type", type);
      else el.removeAttribute("type");
    }

    upsertMeta("description", desc);
    upsertMeta("application-name", cfg.shortName || title);
    upsertMeta("theme-color", color);
    if (cfg.keywords) upsertMeta("keywords", cfg.keywords);
    if (cfg.theme && cfg.theme.lsKey) upsertMeta("app-theme-ls-key", cfg.theme.lsKey);
    upsertMeta("app-icon", icon);

    upsertMeta("og:title", title, true);
    upsertMeta("og:description", desc, true);
    upsertMeta("og:type", cfg.ogType || "website", true);
    upsertMeta("og:url", url, true);
    upsertMeta("og:image", ogImage, true);
    upsertMeta("og:site_name", site, true);
    upsertMeta("og:locale", cfg.locale || "es_CO", true);

    upsertMeta("twitter:card", cfg.twitterCard || "summary");
    upsertMeta("twitter:title", title);
    upsertMeta("twitter:description", desc);
    upsertMeta("twitter:image", ogImage);

    upsertLink("icon", iconUrl(icon, { color: color, width: 32, height: 32 }), "image/svg+xml");
    upsertLink("apple-touch-icon", iconUrl(icon, { color: color, width: 180, height: 180 }), "image/svg+xml");
    upsertLink("canonical", url);

    global.AppMeta.cfg = cfg;
    return cfg;
  }

  global.AppMeta = {
    apply: apply,
    initFromDocument: initFromDocument,
    iconUrl: iconUrl,
    cfg: null,
  };
})(typeof window !== "undefined" ? window : globalThis);

;
/**
 * Init síncrono del tema — cargar desde index.html justo después de JeffAppMeta.apply.
 * Usa la misma theme.lsKey que ISAFront.registerApp (via JeffAppMeta.cfg).
 */
(function (global) {
  "use strict";

  function resolveThemeKey() {
    const doc = global.document;
    const fromMeta = doc?.querySelector('meta[name="app-theme-ls-key"]')?.getAttribute("content");
    if (fromMeta) return String(fromMeta).trim();
    const cfg = global.AppMeta?.cfg;
    if (cfg?.theme?.lsKey) return String(cfg.theme.lsKey);
    if (cfg?.themeLsKey) return String(cfg.themeLsKey);
    return "app:theme";
  }

  function readMode(key) {
    let mode = "dark";
    try {
      const v = global.localStorage.getItem(key);
      if (v === "light" || v === "dark") mode = v;
    } catch {
      /* ignore */
    }
    return mode;
  }

  function applyMode(mode) {
    const doc = global.document;
    if (!doc) return;
    doc.documentElement.setAttribute("data-mui-color-scheme", mode);
    doc.documentElement.style.colorScheme = mode;
  }

  const lsKey = resolveThemeKey();
  applyMode(readMode(lsKey));

  global.ThemeInit = { lsKey, readMode, applyMode };
})(typeof window !== "undefined" ? window : globalThis);

;
/** Cola del bundle head-init — CDN base, AppMeta.init, CSS compartidos. */
(function finishHeadInit(global) {
  "use strict";
  try {
    if (global.AppMeta && typeof global.AppMeta.initFromDocument === "function") {
      global.AppMeta.initFromDocument();
    }
  } catch (e) {
    console.warn(e);
  }

  var doc = global.document;
  var script = doc && doc.currentScript;
  var src = script && script.src ? String(script.src) : "";
  var refMatch = src.match(/front-shared@([^/]+)/);
  var cdnMatch = src.match(/^(https:\/\/cdn\.jsdelivr\.net\/gh\/Jeff-Aporta\/front-shared@[^/]+\/cdn)/);

  global.__FRONT_SHARED_REF__ = refMatch ? refMatch[1] : "e584b60";
  global.__FRONT_SHARED_CDN__ = cdnMatch
    ? cdnMatch[1]
    : "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + global.__FRONT_SHARED_REF__ + "/cdn";

  var host = global.location && global.location.hostname ? global.location.hostname : "";
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]";
  var cssBase = isLocal
    ? (global.__FS_LOCAL__ || "../../components/front-shared/cdn/")
    : global.__FRONT_SHARED_CDN__ + "/";
  var cssAttr = script && script.getAttribute("data-isa-css");
  var cssList = cssAttr ? cssAttr.split(",") : ["isa/css/base.css"];

  for (var i = 0; i < cssList.length; i++) {
    var rel = String(cssList[i] || "").trim();
    if (!rel) continue;
    var id = "isa-css-" + rel.replace(/[^\w-]+/g, "-");
    if (doc.getElementById(id)) continue;
    var link = doc.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = cssBase + rel;
    doc.head.appendChild(link);
  }
})(typeof window !== "undefined" ? window : globalThis);
