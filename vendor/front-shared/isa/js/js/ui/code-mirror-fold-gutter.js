/** Iconify en gutter de plegado JSON (CodeMirror 5 foldgutter). */
export const FOLD_GUTTER_ICONS = {
  open: "mdi:chevron-down",
  folded: "mdi:chevron-right",
  size: 16,
};

export function decorateFoldGutterIcons(cm, icons = FOLD_GUTTER_ICONS) {
  if (!cm?.getWrapperElement) return;
  const root = cm.getWrapperElement();
  if (!root) return;

  root.querySelectorAll(".CodeMirror-foldgutter-open, .CodeMirror-foldgutter-folded").forEach((el) => {
    const iconName = el.classList.contains("CodeMirror-foldgutter-open") ? icons.open : icons.folded;
    let node = el.querySelector("iconify-icon");
    if (!node) {
      el.textContent = "";
      node = document.createElement("iconify-icon");
      node.setAttribute("width", String(icons.size));
      node.setAttribute("height", String(icons.size));
      el.appendChild(node);
    }
    if (node.getAttribute("icon") !== iconName) node.setAttribute("icon", iconName);
  });
}

export function attachFoldGutterIcons(cm, icons = FOLD_GUTTER_ICONS) {
  if (!cm?.on) return;
  const paint = () => decorateFoldGutterIcons(cm, icons);
  paint();
  cm.on("viewportChange", paint);
  cm.on("update", paint);
}
