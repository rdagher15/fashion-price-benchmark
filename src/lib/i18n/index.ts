// Minimal dictionary-based i18n. English ships fully translated; a language
// switcher and RTL layout hook are wired up so Arabic (or others) can be
// added by dropping in ar.json + flipping `dir` — no string is hardcoded
// through a raw literal in components, they all flow through t().
import en from "./en.json";

export const dictionaries: Record<string, Record<string, string>> = { en };

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "ar", label: "العربية (coming soon)", dir: "rtl", disabled: true },
];

export function t(key: string, lang: string = "en"): string {
  const dict = dictionaries[lang] || dictionaries.en;
  return dict[key] ?? dictionaries.en[key] ?? key;
}
