"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomFormField } from "@/components/CustomFormField";
import { FormNumberInput } from "../forms/form-number-input";
import { useFormContext } from "react-hook-form";

export function Step2BusinessDetails() {
  const form = useFormContext();

  return (
    <Card className="bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>🏢</span> Business Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* We're using standard number inputs and selects instead of custom sliders for simplicity and standard RHF integration initially, but can be updated if a custom Slider field component exists */}

        <FormNumberInput
          control={form.control}
          name="monthlyDeposit"
          label="How much do you deposit monthly in your business account?"
          placeholder="$"
          prefix="$"
          thousandSeparator=","
          decimalScale={2}
          fixedDecimalScale={true}
        />

        <CustomFormField
          name="timeInBusiness"
          label="How long have you been in business?"
          type="select"
          options={[
            { value: "1-6M", label: "1-6 Months" },
            { value: "6-12M", label: "6-12 Months" },
            { value: "1-2yrs", label: "1-2 Years" },
            { value: "2yrs+", label: "2+ Years" },
          ]}
          placeholder="Select time in business"
        />

        <FormNumberInput
          control={form.control}
          name="creditScore"
          label="Estimated Credit Score"
          placeholder="700"
          min={400}
          max={900}
          thousandSeparator=""
          decimalScale={0}
          fixedDecimalScale={true}
        />
      </CardContent>
    </Card>
  );
}
