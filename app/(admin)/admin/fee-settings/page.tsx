"use client";

import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFeeSettings, useUpdateFeeSettings } from "@/hooks/fee-settings";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, Save, DollarSign } from "lucide-react";
import { FormNumberInput } from "@/components/forms/form-number-input";

interface FeeSettingsFormData {
  creditReportFee: number;
  businessCreditReportFee: number;
  tierStarterPrice: number;
  tierProPrice: number;
  tierExecutivePrice: number;
  creditModuleProAddonPrice: number;
  earlyRefreshFee: number;
  personalUnlimitedUnlockFee: number;
  businessUnlimitedUnlockFee: number;
  sbaUnlimitedUnlockFee: number;
}

export default function FeeSettingsPage() {
  const { data: feeSettings, isLoading } = useFeeSettings();
  const { mutateAsync: updateFeeSettings, isPending } = useUpdateFeeSettings();

  const { control, handleSubmit, reset } = useForm<FeeSettingsFormData>({
    defaultValues: {
      creditReportFee: 49,
      businessCreditReportFee: 100,
      tierStarterPrice: 297,
      tierProPrice: 397,
      tierExecutivePrice: 697,
      creditModuleProAddonPrice: 197,
      earlyRefreshFee: 99,
      personalUnlimitedUnlockFee: 999,
      businessUnlimitedUnlockFee: 999,
      sbaUnlimitedUnlockFee: 999,
    },
  });

  const creditReportFeeValue = useWatch({ control, name: "creditReportFee" });
  const businessCreditReportFeeValue = useWatch({
    control,
    name: "businessCreditReportFee",
  });
  const tierStarterPriceValue = useWatch({ control, name: "tierStarterPrice" });
  const tierProPriceValue = useWatch({ control, name: "tierProPrice" });
  const tierExecutivePriceValue = useWatch({
    control,
    name: "tierExecutivePrice",
  });
  const creditModuleProAddonPriceValue = useWatch({
    control,
    name: "creditModuleProAddonPrice",
  });
  const earlyRefreshFeeValue = useWatch({ control, name: "earlyRefreshFee" });
  const personalUnlimitedUnlockFeeValue = useWatch({
    control,
    name: "personalUnlimitedUnlockFee",
  });
  const businessUnlimitedUnlockFeeValue = useWatch({
    control,
    name: "businessUnlimitedUnlockFee",
  });
  const sbaUnlimitedUnlockFeeValue = useWatch({
    control,
    name: "sbaUnlimitedUnlockFee",
  });

  useEffect(() => {
    if (feeSettings) {
      reset({
        creditReportFee: feeSettings.creditReportFee,
        businessCreditReportFee: feeSettings.businessCreditReportFee,
        tierStarterPrice: feeSettings.tierStarterPrice,
        tierProPrice: feeSettings.tierProPrice,
        tierExecutivePrice: feeSettings.tierExecutivePrice,
        creditModuleProAddonPrice: feeSettings.creditModuleProAddonPrice,
        earlyRefreshFee: feeSettings.earlyRefreshFee,
        personalUnlimitedUnlockFee: feeSettings.personalUnlimitedUnlockFee,
        businessUnlimitedUnlockFee: feeSettings.businessUnlimitedUnlockFee,
        sbaUnlimitedUnlockFee: feeSettings.sbaUnlimitedUnlockFee,
      });
    }
  }, [feeSettings, reset]);

  const onSubmit = async (data: FeeSettingsFormData) => {
    try {
      await updateFeeSettings({
        creditReportFee: Number(data.creditReportFee),
        businessCreditReportFee: Number(data.businessCreditReportFee),
        tierStarterPrice: Number(data.tierStarterPrice),
        tierProPrice: Number(data.tierProPrice),
        tierExecutivePrice: Number(data.tierExecutivePrice),
        creditModuleProAddonPrice: Number(data.creditModuleProAddonPrice),
        earlyRefreshFee: Number(data.earlyRefreshFee),
        personalUnlimitedUnlockFee: Number(data.personalUnlimitedUnlockFee),
        businessUnlimitedUnlockFee: Number(data.businessUnlimitedUnlockFee),
        sbaUnlimitedUnlockFee: Number(data.sbaUnlimitedUnlockFee),
      });
      toast.success("Fee settings updated successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update fee settings");
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 h-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">
          Fee Settings
        </h2>
      </div>

      <div className="grid gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4 rounded-t-xl">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-xl text-slate-800">
                Global Fees
              </CardTitle>
            </div>
            <CardDescription className="text-slate-500 mt-1.5">
              Configure the default fees applied across the platform for various
              services.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                    Credit Report Fees
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="creditReportFee"
                        label="Generate Credit Report Fee"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                        placeholder="0.00"
                      />
                      <p className="text-[0.8rem] text-slate-500 mt-1">
                        The amount charged to clients for generating a personal
                        credit report.
                      </p>
                      {feeSettings &&
                        Number(creditReportFeeValue) !==
                          feeSettings.creditReportFee && (
                          <p className="text-[0.8rem] text-amber-600 mt-1">
                            Previous fee:{" "}
                            <span className="font-semibold">
                              ${feeSettings.creditReportFee.toFixed(2)}
                            </span>
                          </p>
                        )}
                    </div>

                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="businessCreditReportFee"
                        label="Generate Business Credit Report Fee"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                        placeholder="0.00"
                      />
                      <p className="text-[0.8rem] text-slate-500 mt-1">
                        The amount charged to clients for generating a business
                        credit report.
                      </p>
                      {feeSettings &&
                        Number(businessCreditReportFeeValue) !==
                          feeSettings.businessCreditReportFee && (
                          <p className="text-[0.8rem] text-amber-600 mt-1">
                            Previous fee:{" "}
                            <span className="font-semibold">
                              ${feeSettings.businessCreditReportFee.toFixed(2)}
                            </span>
                          </p>
                        )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                    Membership Tiers (Monthly)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="tierStarterPrice"
                        label="CEG BRAIN STARTER"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="tierProPrice"
                        label="CEG BRAIN PRO"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="tierExecutivePrice"
                        label="CEG BRAIN EXECUTIVE"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                    Add-ons & Refresh Fees
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="creditModuleProAddonPrice"
                        label="Credit Module Pro Add-on (Monthly)"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="earlyRefreshFee"
                        label="Early Refresh Fee"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800 border-b pb-2">
                    One-Time Unlocks
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="personalUnlimitedUnlockFee"
                        label="Personal Unlimited"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="businessUnlimitedUnlockFee"
                        label="Business Unlimited"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                    <div className="space-y-1">
                      <FormNumberInput
                        control={control}
                        name="sbaUnlimitedUnlockFee"
                        label="SBA / Commercial Unlimited"
                        prefix="$"
                        decimalScale={2}
                        fixedDecimalScale={true}
                        min={0}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
