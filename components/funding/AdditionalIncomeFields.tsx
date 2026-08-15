"use client";

import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { CustomFormField } from "@/components/CustomFormField";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const ADDITIONAL_INCOME_SOURCES = [
  { value: "spouse_partner", label: "Spouse / Partner Income" },
  { value: "rental_property", label: "Rental Property Income" },
  { value: "investments", label: "Investment / Dividend Income" },
  { value: "side_business", label: "Side Business / 1099 Income" },
  { value: "pension_disability", label: "Pension / Retirement / Disability" },
  { value: "other", label: "Other Household Income" },
];

function usd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AdditionalIncomeFields() {
  const { control } = useFormContext();

  const employmentPayPerMonth = useWatch({
    control,
    name: "employmentPayPerMonth",
    defaultValue: 0,
  });
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

  const baseAnnual =
    Number(statedAnnualIncomeCorrected) > 0
      ? Number(statedAnnualIncomeCorrected)
      : Number(employmentPayPerMonth || 0) * 12;

  const additionalAnnual = Number(additionalMonthlyIncome || 0) * 12;
  const totalHouseholdAnnual = baseAnnual + additionalAnnual;

  return (
    <Card className="bg-slate-50 border-slate-200 mt-6">
      <CardHeader className="px-4 md:px-6 pb-2">
        <CardTitle className="text-base md:text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>💵</span> Additional Income & Stated Income Adjustment
          </div>
          <span className="text-xs font-normal text-slate-500 bg-slate-200/70 px-2.5 py-0.5 rounded-full">
            Optional
          </span>
        </CardTitle>
        <p className="text-xs text-slate-500 mt-1">
          Adjust your stated gross annual income or add household income
          (spouse, rental, side business) to strengthen your credit application.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <CustomFormField
            name="statedAnnualIncomeCorrected"
            type="number"
            label="Corrected Stated Gross Annual Income ($)"
            placeholder="e.g. 96000"
          />
          <CustomFormField
            name="additionalMonthlyIncome"
            type="number"
            label="Additional Monthly Income ($)"
            placeholder="e.g. 4083"
          />
          <CustomFormField
            name="additionalIncomeSource"
            type="select"
            label="Additional Income Source"
            placeholder="Select source"
            options={ADDITIONAL_INCOME_SOURCES}
          />
        </div>

        {(additionalAnnual > 0 || baseAnnual > 0) && (
          <>
            <Separator className="my-2" />
            <div className="rounded-xl bg-blue-50/80 border border-blue-200 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-semibold text-blue-900 block text-sm">
                  Estimated Total Household Annual Income:{" "}
                  {usd(totalHouseholdAnnual)}
                </span>
                <span className="text-blue-700/80 mt-0.5 block">
                  Base: {usd(baseAnnual)}/yr{" "}
                  {additionalAnnual > 0
                    ? `+ Additional: ${usd(additionalAnnual)}/yr`
                    : ""}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-lg border border-blue-100 max-w-xs">
                <span className="font-medium text-slate-800">Reg B Note:</span>{" "}
                Income from spouse/partner regularly available for expenses can
                be legally reported on personal credit applications.
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
