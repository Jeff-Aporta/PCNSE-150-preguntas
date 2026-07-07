/**
 * main.tsx — Entry point. Monta <App /> en #root.
 */
import { App } from "./App.tsx";

const container = document.getElementById("root");
if (!container) {
  throw new Error("No se encontró #root en el DOM");
}

// Limpiar el boot placeholder antes de montar React
container.innerHTML = "";

const ReactDOM = (globalThis as any).ReactDOM;
if (!ReactDOM?.createRoot) throw new Error("ReactDOM no disponible (cargar stack.mjs antes)");
const React = (globalThis as any).React;
if (!React?.createElement) throw new Error("React no disponible");
const root = ReactDOM.createRoot(container);
// Pasar la función App a React.createElement, no ejecutarla directamente:
//   root.render(App())        → ejecuta App() fuera del contexto React (hooks fallan)
//   root.render(React.createElement(App)) → React monta App como componente
root.render(React.createElement(App));