/** Insertar como primer script del `<head>` (después de charset) en cada front. */
(function () {
  var u = location.href.split("#")[0].split("?")[0];
  if (!u.endsWith("/")) u = u.endsWith(".html") ? u.slice(0, u.lastIndexOf("/") + 1) : u + "/";
  var b = document.createElement("base");
  b.href = u;
  document.head.appendChild(b);
})();
