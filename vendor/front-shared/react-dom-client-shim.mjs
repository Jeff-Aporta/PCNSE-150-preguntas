/** createRoot desde window.ReactDOM (stack.mjs). */
const RD = globalThis.ReactDOM;
if (!RD?.createRoot) throw new Error("react-dom-client-shim: ejecutar stack.mjs antes");
export const createRoot = RD.createRoot;
export default { createRoot };
