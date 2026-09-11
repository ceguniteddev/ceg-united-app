"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { FormNumberInput } from "../forms/form-number-input";
import { FormSelect } from "../forms/form-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";

export function IncomeSourceSection() {
  const { t, formatCurrency } = useTranslation();
  const { control } = useFormContext();

  const additionalIncomeSources = [
    { value: "spouse_partner", label: t("registration.spousePartner") },
    { value: "rental_property", label: t("registration.rentalProperty") },
    { value: "investments", label: t("registration.investments") },
    { value: "side_business", label: t("registration.sideBusiness") },
    { value: "pension_disability", label: t("registration.pensionDisability") },
    { value: "other", label: t("registration.otherHousehold") },
  ];

  const statedAnnualIncomeCorrected = useWatch({
    control,
    name: "statedAnnualIncomeCorrected",
    defaultValue: 0,
  });
  const additionalMonthlyIncome = useWatch({
    control,
    name: "additionalMonthlyIncome",
    defaultValue: 0,
  });

  const baseAnnual = Number(statedAnnualIncomeCorrected || 0);
  const additionalAnnual = Number(additionalMonthlyIncome || 0) * 12;
  const totalHouseholdAnnual = baseAnnual + additionalAnnual;

  return (
    <Card className="border-blue-100 bg-slate-50/50 shadow-sm mt-4">
      <CardHeader className="p-4 bg-blue-50/20 border-b border-blue-50">
        <CardTitle className="text-base font-semibold text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💵</span> {t("registration.additionalIncomeTitle")}
          </div>
          <span className="text-xs font-normal text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
            {t("registration.optionalBadge")}
          </span>
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          {t("registration.additionalIncomeDesc")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 [&_[data-slot=field-label]]:min-h-[2.5rem] [&_[data-slot=field-label]]:flex [&_[data-slot=field-label]]:items-end">
          <FormNumberInput
            control={control}
            name="statedAnnualIncomeCorrected"
            label={t("registration.statedAnnualIncome")}
            placeholder="e.g. 96000"
            prefix="$"
            thousandSeparator=","
            decimalScale={0}
          />
          <FormNumberInput
            control={control}
            name="additionalMonthlyIncome"
            label={t("registration.additionalMonthlyIncome")}
            placeholder="e.g. 4083"
            prefix="$"
            thousandSeparator=","
            decimalScale={0}
          />
          <FormSelect
            control={control}
            name="additionalIncomeSource"
            label={t("registration.additionalIncomeSource")}
            placeholder={t("registration.selectSource")}
            options={additionalIncomeSources}
          />
        </div>

        {(additionalAnnual > 0 || baseAnnual > 0) && (
          <>
            <Separator className="my-2" />
            <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-semibold text-blue-900 block text-sm">
                  Estimated Total Household Annual Income:{" "}
                  {formatCurrency(totalHouseholdAnnual)}
                </span>
                <span className="text-blue-700/80 mt-0.5 block">
                  Base: {formatCurrency(baseAnnual)}/yr{" "}
                  {additionalAnnual > 0
                    ? `+ Additional: ${formatCurrency(additionalAnnual)}/yr`
                    : ""}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 bg-white/90 p-2 rounded-lg border border-blue-100 max-w-xs">
                <span className="font-medium text-slate-800">Reg B Note:</span>{" "}
                Income from a spouse or partner regularly available for
                household expenses can be legally reported on personal credit
                applications.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
