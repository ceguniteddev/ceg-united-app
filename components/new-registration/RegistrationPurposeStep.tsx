"use client";

import { ArrowRight, BookOpen, HandCoins } from "lucide-react";
import { RegistrationPurpose } from "@/schema/new-registration";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n";

interface RegistrationPurposeStepProps {
  onSelect: (purpose: RegistrationPurpose) => void | Promise<void>;
}

export function RegistrationPurposeStep({
  onSelect,
}: RegistrationPurposeStepProps) {
  const { t } = useTranslation();

  const purposes = [
    {
      value: RegistrationPurpose.Funding,
      title: t("registration.purposeFundingTitle"),
      description: t("registration.purposeFundingDesc"),
      icon: HandCoins,
    },
    {
      value: RegistrationPurpose.FinancialEducation,
      title: t("registration.purposeEducationTitle"),
      description: t("registration.purposeEducationDesc"),
      icon: BookOpen,
    },
  ];

  return (
    <Card className="border-blue-100 bg-white shadow-md">
      <CardHeader className="border-b border-blue-50 bg-blue-50/50 p-6 text-center">
        <CardTitle className="text-2xl font-bold text-blue-900">
          {t("registration.purposeTitle")}
        </CardTitle>
        <p className="text-sm text-slate-600">
          {t("registration.purposeSubtitle")}
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
        {purposes.map(({ value, title, description, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            variant="outline"
            onClick={() => onSelect(value)}
            className="group h-auto min-h-52 justify-start whitespace-normal border-blue-100 p-6 text-left hover:border-blue-300 hover:bg-blue-50/60"
          >
            <span className="flex h-full w-full flex-col items-start gap-4">
              <span className="rounded-xl bg-blue-100 p-3 text-blue-700">
                <Icon className="h-7 w-7" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-slate-900">
                  {title}
                </span>
                <span className="mt-2 block text-sm font-normal leading-6 text-slate-600">
                  {description}
                </span>
              </span>
              <span className="mt-auto flex items-center gap-2 text-sm font-semibold text-blue-700">
                {t("registration.continue")} <ArrowRight className="h-4 w-4" />
              </span>
            </span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
