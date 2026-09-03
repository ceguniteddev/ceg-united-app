export type Locale = "en" | "es";

export const DEFAULT_LOCALE: Locale = "en";
export const SUPPORTED_LOCALES: Locale[] = ["en", "es"];
export const LOCALE_STORAGE_KEY = "ceg_app_locale";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export interface LocaleOption {
  code: Locale;
  label: string;
  nativeLabel: string;
  flag: string;
}

export const LOCALES: Record<Locale, LocaleOption> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    flag: "🇺🇸",
  },
  es: {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    flag: "🇪🇸",
  },
};
