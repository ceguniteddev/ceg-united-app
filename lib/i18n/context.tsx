"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  Locale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  LOCALE_STORAGE_KEY,
  LOCALE_COOKIE_NAME,
} from "./config";
import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";

type Messages = typeof enMessages;

const dictionaries: Record<Locale, any> = {
  en: enMessages,
  es: esMessages,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  formatDate: (
    date: Date | string | number,
    options?: Intl.DateTimeFormatOptions,
  ) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return typeof current === "string" ? current : undefined;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale || DEFAULT_LOCALE,
  );

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
      const cookieLocale = getCookie(LOCALE_COOKIE_NAME) as Locale | null;
      const preferred = stored || cookieLocale;
      if (preferred && SUPPORTED_LOCALES.includes(preferred)) {
        setLocaleState(preferred);
      } else {
        const browserLang = navigator.language?.slice(0, 2);
        if (browserLang === "es") {
          setLocaleState("es");
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    if (!SUPPORTED_LOCALES.includes(newLocale)) return;
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
      setCookie(LOCALE_COOKIE_NAME, newLocale);
      document.documentElement.lang = newLocale;
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
      let template = getNestedValue(dict, key);

      // Fallback to default locale if key is missing in target locale
      if (!template && locale !== DEFAULT_LOCALE) {
        template = getNestedValue(dictionaries[DEFAULT_LOCALE], key);
      }

      if (!template) {
        return key;
      }

      if (params) {
        return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
          return acc.replace(
            new RegExp(`{${paramKey}}`, "g"),
            String(paramVal),
          );
        }, template);
      }

      return template;
    },
    [locale],
  );

  const formatCurrency = useCallback(
    (amount: number, currency: string = "USD") => {
      const intlLocale = locale === "es" ? "es-US" : "en-US";
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency,
      }).format(amount);
    },
    [locale],
  );

  const formatDate = useCallback(
    (
      date: Date | string | number,
      options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
      },
    ) => {
      const parsedDate = typeof date === "object" ? date : new Date(date);
      const intlLocale = locale === "es" ? "es-ES" : "en-US";
      return new Intl.DateTimeFormat(intlLocale, options).format(parsedDate);
    },
    [locale],
  );

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatCurrency,
        formatDate,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
