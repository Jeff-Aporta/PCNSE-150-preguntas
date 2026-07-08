/**
 * core/locale.ts — Idioma de la app (ES/EN), persistido en localStorage.
 */
export type AppLocale = "es" | "en";

export const LOCALE_LS_KEY = "william-quest:locale";

export function readAppLocale(): AppLocale {
  try {
    const v = localStorage.getItem(LOCALE_LS_KEY);
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
