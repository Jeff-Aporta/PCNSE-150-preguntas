/**
 * components/LocaleToolbar.tsx — Toggle ES/EN en AppBar (junto al theme).
 */
import { useCallback, type ComponentType } from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";
import type { AppLocale } from "../core/locale.ts";

const NS = "WILLIAM";

type LocaleBag = {
  Locale?: {
    useAppLocale?: () => { locale: AppLocale; setLocale: (l: AppLocale) => void };
  };
  UI?: {
    LangSwitch?: ComponentType<{ locale: AppLocale; onChange: (l: AppLocale) => void }>;
  };
};

function getBag(): LocaleBag {
  return (globalThis as typeof globalThis & Record<string, LocaleBag>)[NS] || {};
}

export function LocaleToolbar() {
  const bag = getBag();
  const hook = bag.Locale?.useAppLocale;
  const { locale, setLocale } = hook ? hook() : { locale: "es" as AppLocale, setLocale: () => {} };
  const LangSwitch = bag.UI?.LangSwitch;

  const onChange = useCallback(
    (_: unknown, value: AppLocale | null) => {
      if (value) setLocale(value);
    },
    [setLocale]
  );

  if (!hook) return null;

  if (LangSwitch) {
    return <LangSwitch locale={locale} onChange={setLocale} />;
  }

  return (
    <ToggleButtonGroup size="small" exclusive value={locale} onChange={onChange} aria-label="Language">
      <ToggleButton value="es">ES</ToggleButton>
      <ToggleButton value="en">EN</ToggleButton>
    </ToggleButtonGroup>
  );
}

export function useAppLocale(): { locale: AppLocale; setLocale: (l: AppLocale) => void } {
  const hook = getBag().Locale?.useAppLocale;
  if (!hook) return { locale: "es", setLocale: () => {} };
  return hook();
}
