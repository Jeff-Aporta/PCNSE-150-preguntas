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
