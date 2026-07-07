/**
 * Carga theme-init.mjs (local front-shared en dev, jsDelivr en prod).
 * Requiere meta estáticos + AppMeta.initFromDocument() (o meta app-theme-ls-key).
 * Opcional: window.__FS_REF__ (pin CDN, default main), window.__FS_LOCAL__ (ruta local).
 */
(function () {
  "use strict";
  var ref = window.__FS_REF__ || "main";
  var localBase = window.__FS_LOCAL__ || "../../components/front-shared/cdn/";
  var local = /localhost|127\.0\.0\.1/.test(location.hostname);
  var src = local
    ? localBase + "isa/js/core/boot/theme-init.mjs"
    : "https://cdn.jsdelivr.net/gh/Jeff-Aporta/front-shared@" + ref + "/cdn/isa/js/core/boot/theme-init.mjs";
  document.write('<script src="' + src + '"><\/script>');
})();
