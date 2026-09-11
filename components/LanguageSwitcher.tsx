"use client";

import React from "react";
import { useTranslation, LOCALES, Locale } from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check } from "lucide-react";
import { LocaleFlag } from "@/components/ui/flag-icon";

interface LanguageSwitcherProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  className?: string;
}

export function LanguageSwitcher({
  variant = "ghost",
  size = "sm",
  showLabel = true,
  className = "",
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();
  const currentLocale = LOCALES[locale] || LOCALES.en;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`flex items-center gap-2 cursor-pointer ${className}`}
          aria-label={t("common.selectLanguage")}
        >
          <Globe className="h-4 w-4 text-muted-foreground" />
          <LocaleFlag
            locale={locale}
            className="h-3.5 w-5 rounded-[2px] shadow-xs border border-border/60 shrink-0 object-cover"
          />
          {showLabel && (
            <span className="text-xs font-medium hidden sm:inline-block">
              {currentLocale.code.toUpperCase()}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {(Object.keys(LOCALES) as Locale[]).map((locKey) => {
          const loc = LOCALES[locKey];
          const isSelected = locale === locKey;

          return (
            <DropdownMenuItem
              key={locKey}
              onClick={() => setLocale(locKey)}
              className="flex items-center justify-between cursor-pointer py-1.5 px-2.5 text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <LocaleFlag
                  locale={locKey}
                  className="h-3.5 w-5 rounded-[2px] shadow-xs border border-border/60 shrink-0 object-cover"
                />
                <span>{loc.nativeLabel}</span>
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default LanguageSwitcher;
