"use client";

import { Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeeSettings } from "@/hooks/fee-settings";
import { useAddons } from "@/hooks/addons";

interface AddonPlansProps {
  onSelectPlan?: (planId: string, amount: number) => void;
  isLoading?: boolean;
}

export function AddonPlans({
  onSelectPlan,
  isLoading = false,
}: AddonPlansProps) {
  const { data: feeSettings, isLoading: isLoadingSettings } = useFeeSettings();
  const { data: addons = [], isLoading: isLoadingAddons } = useAddons();

  const creditRepairEnabled = addons.some(
    (addon) =>
      addon.addonId === "credit_module_pro" && addon.status === "active",
  );

  return (
    <div className="w-full max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-5xl">
          Enhance Your Membership
        </h2>
        <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto">
          Unlock additional modules and tools tailored to help you reach your
          goals faster.
        </p>
      </div>

      <div className="bg-blue-50 rounded-2xl p-8 border border-blue-100 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="bg-blue-600 p-3 rounded-lg text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Credit Repair Module
              </h3>
              <p className="text-slate-600 mt-1 max-w-2xl text-sm leading-relaxed">
                Unlock the self-service AI credit optimization toolkit. Includes
                AI dispute letter generator, inquiry dispute workflows, bureau
                tracking, and dedicated guidance to repair and build your credit
                profile.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 whitespace-nowrap">
            <span className="text-3xl font-bold text-slate-900">
              ${feeSettings?.creditModuleProAddonPrice ?? 197}
              <span className="text-base font-medium text-slate-500">/mo</span>
            </span>
            <Button
              onClick={() =>
                onSelectPlan?.(
                  "credit_module_pro",
                  feeSettings?.creditModuleProAddonPrice ?? 197,
                )
              }
              disabled={isLoading || isLoadingSettings || creditRepairEnabled}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg px-8"
            >
              {creditRepairEnabled ? "Purchased" : "Get Add-on"}
              {!creditRepairEnabled && <ArrowRight className="ml-2 w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
