/**
 * core/locale.ts — Idioma de la app (ES/EN), persistido en localStorage.
 */
export type AppLocale = "es" | "en";

export const LOCALE_LS_KEY = "pcnse-150:locale";

export function readAppLocale(): AppLocale {
  try {
    let v = localStorage.getItem(LOCALE_LS_KEY);
    if (v !== "en" && v !== "es") {
      // Migracion desde la version legacy william-quest:locale.
      const legacy = localStorage.getItem("william-quest:locale");
      if (legacy === "en" || legacy === "es") {
        localStorage.setItem(LOCALE_LS_KEY, legacy);
        localStorage.removeItem("william-quest:locale");
        v = legacy;
      }
    }
    if (v === "en" || v === "es") return v;
  } catch {}
  return "es";
}

export function writeAppLocale(locale: AppLocale) {
  try {
    localStorage.setItem(LOCALE_LS_KEY, locale);
  } catch {}
  document.documentElement.lang = locale === "en" ? "en" : "es";
}

export function getAppLocale(): AppLocale {
  const bag = (globalThis as typeof globalThis & { WILLIAM?: { Locale?: { getLocale?: () => AppLocale } } }).WILLIAM;
  return bag?.Locale?.getLocale?.() ?? readAppLocale();
}
