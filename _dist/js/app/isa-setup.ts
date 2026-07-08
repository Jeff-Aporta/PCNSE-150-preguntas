/**
 * isa-setup.ts — registra namespace y expone preguntas globales.
 * Se ejecuta antes de main.tsx.
 */

// Cargar preguntas desde JSON estático (van en /data/questions.json copiado a /_dist/data/).
// Como esto corre en runtime en el navegador, hacemos fetch.
// Pero para simplificar, embebemos un import dinámico desde el bundle.
import { bootstrapAppMeta } from "./app-meta.js";

bootstrapAppMeta({
  shortName: "Palo Alto Quest",
  title: "Palo Alto Quest — Simulador PCNSE",
  icon: "mdi:shield-lock-outline",
  theme: { lsKey: "william-quest:theme" },
});

console.log("[PaloAltoQuest] isa-setup done");