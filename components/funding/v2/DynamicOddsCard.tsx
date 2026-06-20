// ============================================
// DynamicOddsCard — Shows approval odds with "Apply Now" button
// ============================================
// Changes based on selected method (specialist vs online)

"use client";

import {
  TrendingUp,
  Loader2,
  CheckCircle2,
  SendIcon,
  ScrollText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ApprovedBankFormData } from "@/schema/bank-products";
import type { ApplicationMethod } from "./MethodSelectionCard";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import IconMenu from "@/components/icon-menu";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

interface DynamicOddsCardProps {
  lender: ApprovedBankFormData;
  method: ApplicationMethod;
  onApplyNow: () => void;
  isLoading?: boolean;
  hasAgreedToWaiver?: boolean;
  setHasAgreedToWaiver?: (val: boolean) => void;
}

export function DynamicOddsCard({
  lender,
  method,
  onApplyNow,
  isLoading = false,
  hasAgreedToWaiver = false,
  setHasAgreedToWaiver,
}: DynamicOddsCardProps) {
  // Adjust odds slightly based on method (specialist typically has better odds)
  const baseOdds = Math.min(lender.approvalOdds || 75, 98);
  const displayOdds =
    method === "specialist" ? Math.min(baseOdds, 95) : Math.min(baseOdds, 98);

  // Chart configuration
  const chartData = {
    labels: [""],
    datasets: [
      {
        data: [displayOdds],
        backgroundColor:
          displayOdds >= 80
            ? "#10b981"
            : displayOdds >= 60
              ? "#3b82f6"
              : "#f59e0b",
        borderRadius: 4,
        barThickness: 24,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        display: false,
      },
      y: {
        display: false,
      },
    },
  };

  // Check if we have products to display
  const hasProducts = lender.products && lender.products.length > 0;

  const buttonText =
    method === "specialist" ? "Connect me with Banker" : "Apply Now";
  const buttonSubtext =
    method === "specialist"
      ? `A ${lender.bankName} specialist will contact you within 1-2 business days.`
      : `You'll be redirected to ${lender.bankName}'s secure website to complete your application.`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 sticky top-6 space-y-6">
      {/* Bank name and connection status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-lg bg-gray-800 text-white flex items-center justify-center font-bold text-sm">
            {lender.bankName[0]}
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">
              {lender.bankName}
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <div className="size-1.5 rounded-full bg-green-600 animate-pulse" />
              <span>{displayOdds}% Connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Your Approval Odds */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-emerald-500" />
            <span className="text-sm font-medium text-gray-900">
              Your Approval Odds
            </span>
          </div>
          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            {displayOdds}%
          </span>
        </div>

        {/* Chart */}
        <div className="h-4 mb-2">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <p className="text-xs text-gray-500 text-center">
          How likely you are to be approved for funding with {lender.bankName}
        </p>
      </div>

      {/* Requirements */}
      {hasProducts && (
        <div className="space-y-2">
          {lender.products.map((product: any, idx: number) => {
            const parts: string[] = [];

            // Product Name
            if (product.productName) {
              parts.push(product.productName);
            }

            // Min FICO
            if (product.minimumFicoScore) {
              parts.push(`FICO ${product.minimumFicoScore}+`);
            }

            return (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green-600" />
                <span className="text-xs text-gray-700">
                  {parts.length > 0 ? parts.join(" • ") : "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Specialist Waiver Box */}
      {method === "specialist" && (
        <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3.5 space-y-3 animate-fade-in-up">
          <div className="flex items-start gap-2.5">
            <ScrollText className="size-4.5 text-blue-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-blue-900">
                15% Done-for-You Success Fee
              </h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                By proceeding with our Done-for-You Specialist pathway, you
                agree to pay a 15% performance success fee upon approval of any
                funds obtained through this connection.
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-blue-100/60">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="waiver-agreement"
                checked={hasAgreedToWaiver}
                onCheckedChange={(checked) =>
                  setHasAgreedToWaiver?.(checked === true)
                }
                className="mt-0.5 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
              />
              <Label
                htmlFor="waiver-agreement"
                className="text-xs font-medium text-blue-900 leading-tight cursor-pointer"
              >
                I agree to the 15% success fee terms
              </Label>
            </div>
          </div>
        </div>
      )}

      {/* Apply button */}
      <div className="space-y-3">
        <Button
          onClick={onApplyNow}
          disabled={
            isLoading || (method === "specialist" && !hasAgreedToWaiver)
          }
          size="lg"
          className="group w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-50 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <IconMenu
              icon={
                <SendIcon className="h-4 w-4 transition-all group-hover:fill-white group-hover:stroke-[1.5]" />
              }
              text={buttonText}
            />
          )}
        </Button>
        <p className="text-xs text-gray-500 text-center leading-relaxed">
          {buttonSubtext}
        </p>
      </div>
    </div>
  );
}
