"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomFormField } from "@/components/CustomFormField";
import {
  FUNDING_PRODUCTS_BY_CATEGORY,
  FundingProductEnumType,
  FundingProductTypeEnum,
} from "@/schema/apply-funding";
import { useCallback, useState } from "react";
import { Checkbox } from "../ui/checkbox";

export function Step3Funding() {
  const { watch, setValue, getValues } = useFormContext();
  const interestedProduct = watch("interestedProduct");

  const [interestedProductSelected, setInterestedProductSelected] = useState<
    FundingProductEnumType | undefined
  >(undefined);

  const showBusinessName =
    interestedProduct === "Business Funding" ||
    interestedProduct === "Personal & Business Funding";

  const handleInterestedProductChange = useCallback(
    (value: string) => {
      const selectedProduct = FundingProductTypeEnum.find(
        (product) => product.value === value,
      );
      if (selectedProduct) {
        setInterestedProductSelected(selectedProduct);
        setValue("fundingType", selectedProduct.type, {
          shouldValidate: true,
          shouldDirty: true,
        });

        // Clear product checkboxes and reset derived states when category changes
        setValue("fundingProducts", [], { shouldDirty: true });
      }
    },
    [setValue],
  );

  return (
    <Card className="bg-slate-100 border-slate-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💰</span> Funding Needs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <CustomFormField
          name={"interestedProduct"}
          label="Type of Funding"
          type="select"
          placeholder="Select funding category"
          options={FundingProductTypeEnum.map((type) => ({
            value: type.value,
            label: type.label,
          }))}
          onSelectValue={handleInterestedProductChange}
        />

        {interestedProductSelected &&
          (FUNDING_PRODUCTS_BY_CATEGORY[interestedProductSelected.value]
            ?.length ?? 0) > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">
                Select the specific products you&apos;re interested in:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {FUNDING_PRODUCTS_BY_CATEGORY[
                  interestedProductSelected.value
                ].map((product) => {
                  const checked =
                    watch("fundingProducts")?.includes(product) ?? false;
                  return (
                    <label
                      key={product}
                      className="flex items-center gap-2 cursor-pointer rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(val) => {
                          const current = getValues("fundingProducts") ?? [];
                          const updated = val
                            ? [...current, product]
                            : current.filter((p: string) => p !== product);
                          setValue("fundingProducts", updated, {
                            shouldDirty: true,
                          });
                        }}
                      />
                      <span className="text-sm">{product}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

        {showBusinessName && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <CustomFormField
              name="businessName"
              label="Business Name"
              placeholder="Enter your business name"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
