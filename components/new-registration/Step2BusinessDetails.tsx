"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormNumberInput } from "../forms/form-number-input";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { FundingType } from "@/schema/new-registration";
import { FormInput } from "../forms/form-input";
import { FormSelect } from "../forms/form-select";
import { FormEINInput } from "../forms/form-ein-number-input";

export function Step2BusinessDetails() {
  const form = useFormContext();
  const fundingType = useWatch({
    control: form.control,
    name: "fundingType",
  });

  const showPersonal =
    fundingType === FundingType.Personal || fundingType === FundingType.Both;
  const showBusiness =
    fundingType === FundingType.Business || fundingType === FundingType.Both;

  return (
    <Card className="bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💼</span> Funding Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <FormNumberInput
            control={form.control}
            name="fundingAmount"
            label="How much are you looking for?"
            required
            placeholder="$"
            prefix="$"
            thousandSeparator=","
            decimalScale={0}
            fixedDecimalScale={false}
            min={1000}
            max={1000000}
          />
          <div className="pt-2 px-1">
            <Controller
              control={form.control}
              name="fundingAmount"
              render={({ field }) => (
                <Slider
                  value={[
                    typeof field.value === "number"
                      ? Math.max(1000, field.value)
                      : 1000,
                  ]}
                  onValueChange={(vals) => field.onChange(vals[0])}
                  min={1000}
                  max={1000000}
                  step={1000}
                  className="py-4 cursor-pointer"
                />
              )}
            />
            <div className="flex justify-between text-xs font-medium text-slate-400 mt-1">
              <span>$1,000</span>
              <span>$1,000,000+</span>
            </div>
          </div>
        </div>

        <FormSelect
          control={form.control}
          name="fundingType"
          label="Type of funding"
          required
          options={[
            { value: FundingType.Personal, label: "Personal" },
            { value: FundingType.Business, label: "Business" },
            { value: FundingType.Both, label: "Both" },
          ]}
          placeholder="Select funding type"
        />

        {showPersonal && (
          <div className="space-y-6">
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <FormNumberInput
                control={form.control}
                name="creditScore"
                required
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

            <FormSelect
              control={form.control}
              name="employmentType"
              label="Employment type"
              required
              options={[
                { value: "W2", label: "W2" },
                { value: "Self-employed", label: "Self-employed" },
              ]}
              placeholder="Select employment type"
            />
          </div>
        )}

        {showBusiness && (
          <div className="space-y-6">
            <FormSelect
              control={form.control}
              name="timeInBusiness"
              label="How long have you been in business?"
              required
              options={[
                { value: "1-6M", label: "1-6 Months" },
                { value: "6-12M", label: "6-12 Months" },
                { value: "1-2yrs", label: "1-2 Years" },
                { value: "2yrs+", label: "2+ Years" },
              ]}
              placeholder="Select time in business"
            />

            <FormInput
              control={form.control}
              name="businessName"
              label="Business Name"
              type="text"
              required
              placeholder="e.g. Acme Corp"
            />

            <FormEINInput
              control={form.control}
              name="ein"
              label="EIN Number"
              required
              placeholder="e.g. 12-3456789"
            />

            <FormInput
              control={form.control}
              name="businessIndustry"
              label="What does your business do?"
              type="text"
              required
              placeholder="e.g. Retail, Construction, Consulting..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
