"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomFormField } from "@/components/CustomFormField";
import { FormNumberInput } from "../forms/form-number-input";
import { useFormContext, Controller } from "react-hook-form";
import { Slider } from "@/components/ui/slider";

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
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <FormNumberInput
            control={form.control}
            name="monthlyDeposit"
            label="How much do you deposit monthly in your business account?"
            placeholder="$"
            prefix="$"
            thousandSeparator=","
            decimalScale={0}
            fixedDecimalScale={false}
            min={10000}
            max={5000000}
          />
          <div className="pt-2 px-1">
            <Controller
              control={form.control}
              name="monthlyDeposit"
              render={({ field }) => (
                <Slider
                  value={[
                    typeof field.value === "number"
                      ? Math.max(10000, field.value)
                      : 10000,
                  ]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                  min={10000}
                  max={5000000}
                  step={10000}
                  className="py-4 cursor-pointer"
                />
              )}
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-1">
              <span>$10,000</span>
              <span>$5,000,000+</span>
            </div>
          </div>
        </div>

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

        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <FormNumberInput
            control={form.control}
            name="creditScore"
            label="Estimated Credit Score"
            placeholder="700"
            min={400}
            max={900}
            thousandSeparator=""
            decimalScale={0}
            fixedDecimalScale={false}
          />
          <div className="pt-2 px-1">
            <Controller
              control={form.control}
              name="creditScore"
              render={({ field }) => (
                <Slider
                  value={[
                    typeof field.value === "number"
                      ? Math.max(400, field.value)
                      : 400,
                  ]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                  min={400}
                  max={900}
                  step={5}
                  className="py-4 cursor-pointer"
                />
              )}
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-1">
              <span>400</span>
              <span>900</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
