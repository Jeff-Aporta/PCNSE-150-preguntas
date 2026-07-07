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

  global.__FRONT_SHARED_REF__ = refMatch ? refMatch[1] : "a13fc29";
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
