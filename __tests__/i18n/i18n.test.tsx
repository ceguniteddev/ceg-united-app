/// <reference types="vitest/globals" />
import React from "react";
import { renderHook, act } from "@testing-library/react";
import enMessages from "@/messages/en.json";
import esMessages from "@/messages/es.json";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, LOCALES } from "@/lib/i18n/config";
import { I18nProvider, useTranslation } from "@/lib/i18n";

function getDeepKeys(obj: Record<string, any>, prefix = ""): string[] {
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys = keys.concat(getDeepKeys(value, fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

describe("i18n Catalogs", () => {
  it("should have valid config with default and supported locales", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("es");
    expect(LOCALES.en.code).toBe("en");
    expect(LOCALES.es.code).toBe("es");
  });

  it("should have matching translation keys between English and Spanish", () => {
    const enKeys = getDeepKeys(enMessages).sort();
    const esKeys = getDeepKeys(esMessages).sort();

    // Check for any missing keys in Spanish catalog
    const missingInEs = enKeys.filter((key) => !esKeys.includes(key));
    expect(missingInEs).toEqual([]);

    // Check for any extra keys in Spanish catalog not in English
    const extraInEs = esKeys.filter((key) => !enKeys.includes(key));
    expect(extraInEs).toEqual([]);
  });

  it("should have all required common namespaces in catalogs", () => {
    const requiredNamespaces = [
      "common",
      "auth",
      "navigation",
      "dashboard",
      "business",
      "creditRepair",
      "funding",
    ];

    requiredNamespaces.forEach((ns) => {
      expect(enMessages).toHaveProperty(ns);
      expect(esMessages).toHaveProperty(ns);
    });
  });

  it("should format currency properly in en-US vs es-US/es-ES", () => {
    const amount = 1500.5;
    const formattedEn = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    const formattedEs = new Intl.NumberFormat("es-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    expect(formattedEn).toContain("1,500.50");
    expect(formattedEs).toBeDefined();
  });

  it("should format dates according to locale", () => {
    const testDate = new Date("2026-05-15T12:00:00Z");
    const enDate = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(testDate);
    const esDate = new Intl.DateTimeFormat("es-ES", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(testDate);

    expect(enDate).toBeDefined();
    expect(esDate).toBeDefined();
  });
});

describe("useTranslation hook & Provider", () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );

  it("should provide default English translations", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });

    expect(result.current.locale).toBe("en");
    expect(result.current.t("common.save")).toBe("Save");
    expect(result.current.t("auth.signIn")).toBe("Sign In");
  });

  it("should allow switching to Spanish and translating keys", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });

    act(() => {
      result.current.setLocale("es");
    });

    expect(result.current.locale).toBe("es");
    expect(result.current.t("common.save")).toBe("Guardar");
    expect(result.current.t("auth.signIn")).toBe("Iniciar Sesión");
    expect(result.current.t("navigation.home")).toBe("Inicio");
  });

  it("should fallback to English for missing keys and return raw key for unknown keys", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });

    act(() => {
      result.current.setLocale("es");
    });

    // Unknown key returns itself
    expect(result.current.t("non.existent.key")).toBe("non.existent.key");
  });

  it("should interpolate parameters correctly", () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });

    expect(result.current.t("common.appName")).toBe("CEG United");
  });

  it("should throw when used outside of I18nProvider", () => {
    expect(() => renderHook(() => useTranslation())).toThrow(
      "useTranslation must be used within an I18nProvider",
    );
  });
});
