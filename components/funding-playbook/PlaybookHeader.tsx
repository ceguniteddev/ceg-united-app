"use client";

import React from "react";
import {
  ArrowLeft,
  DollarSign,
  Gauge,
  GitFork,
  Printer,
  Sparkles,
} from "lucide-react";
import type { Playbook } from "@/types/funding-playbook";
import { ProgressRing } from "./ProgressRing";
import { LenderMark } from "./LenderMark";
import { useBusinessQuery } from "@/hooks/business";
import { useUserQuery } from "@/hooks/user";
import type { Business } from "@/schema";

function getScoreRating(score: number): string {
  if (score >= 800) return "Exceptional";
  if (score >= 740) return "Very Good";
  if (score >= 670) return "Good";
  if (score >= 580) return "Fair";
  if (score > 0) return "Poor";
  return "Very Good";
}

function formatCurrency(amount: number): string {
  if (!amount) return "$0";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function PlaybookTopBar({
  pb,
  onBackAction,
}: {
  pb: Playbook;
  onBackAction?: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 print:static print:bg-white">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 h-[62px] flex items-center gap-3">
        {onBackAction && (
          <button
            onClick={onBackAction}
            className="flex items-center gap-1.5 h-9 px-2.5 -ml-1 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors flex-shrink-0 print:hidden"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[12.5px] font-medium hidden lg:block">
              Back
            </span>
          </button>
        )}

        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <LenderMark lenderId={pb.meta.lenderId} />
          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold text-gray-900 tracking-tight whitespace-nowrap">
                {pb.meta.lenderDisplayName || pb.meta.lenderId}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-[13.5px] font-semibold text-gray-700 truncate">
                {pb.meta.productDisplayName || pb.meta.productId}
              </span>
            </div>
            <div className="text-[11px] text-gray-400 leading-tight truncate">
              Playbook ID: {pb.meta.id}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-blue-50 ring-1 ring-inset ring-blue-100 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-blue-600" />
          <span className="text-[10.5px] font-bold text-blue-700 tracking-wide">
            Model: {pb.meta.reasoningModel}
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 h-9 px-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex-shrink-0 print:hidden"
          title="Print or save as PDF"
        >
          <Printer className="w-4 h-4" />
          <span className="text-[12.5px] font-semibold hidden sm:block">
            Save PDF
          </span>
        </button>
      </div>
    </header>
  );
}

export function ClientIdentityBar({
  pb,
  clientName = "",
  clientZip = "",
  selectedFundingPath = "",
}: {
  pb: Playbook;
  clientName?: string;
  clientZip?: string;
  selectedFundingPath?: string;
}) {
  const clientId = pb?.meta?.clientId;
  const { userData } = useUserQuery(clientId);
  const { businessData } = useBusinessQuery(clientId, !!clientId);

  const businesses: Business[] = Array.isArray(businessData)
    ? businessData
    : [];
  const primaryBusiness = businesses[0];

  // Derive FICO score from user-leads, user doc, or playbook primary bureau score
  const leadScore =
    userData?.leadData?.ficoCreditScore ||
    userData?.leadData?.creditScore ||
    userData?.leadData?.personalCreditScore ||
    userData?.leadData?.businessCreditScore ||
    0;

  const ficoScore =
    pb?.section3_bureauPull?.clientScoreOnPrimaryBureau ||
    leadScore ||
    userData?.ficoCreditScore ||
    0;

  const displayFico = ficoScore > 0 ? ficoScore : "N/A";
  const scoreRating = ficoScore > 0 ? getScoreRating(ficoScore) : "Unscored";

  // Derive Funding Path label
  const rawPath =
    selectedFundingPath ||
    userData?.leadData?.fundingType ||
    pb?.meta?.productId ||
    "Credit Stacking";

  const displayFundingPath =
    rawPath === "Business" || rawPath === "business"
      ? "Business Credit"
      : rawPath === "Personal" || rawPath === "personal"
        ? "Personal Credit"
        : rawPath;

  // Derive Household Income
  const rawIncome =
    userData?.income?.householdIncome ||
    userData?.leadData?.householdIncome ||
    userData?.income?.statedAnnualIncome ||
    pb?.section5_incomeStructuring?.currentStatedIncome ||
    0;

  const formattedHouseholdIncome =
    rawIncome > 0 ? formatCurrency(rawIncome) : "N/A";

  // Business / Location subtitle
  const bizName =
    primaryBusiness?.businessName || userData?.leadData?.businessName || "";
  const city = userData?.addressCity || userData?.city || "";
  const state = userData?.addressState || userData?.state || "";

  const locationText = [city, state].filter(Boolean).join(", ");
  const subtitle =
    [bizName, locationText].filter(Boolean).join(" · ") ||
    `ZIP: ${clientZip || pb?.section9_nearestBranches?.zip || "N/A"}`;

  // Subtext
  const timeInBusiness =
    (primaryBusiness as any)?.timeInBusiness ||
    userData?.leadData?.timeInBusiness ||
    (primaryBusiness ? "Active business" : "Personal profile");
  const dtiPct = pb?.section6_housingStructuring?.dtiImpactIfIncluded ?? 0;

  // Readiness Calculation

  // Dynamic Next Steps
  const pendingItems: string[] = [];
  if (!primaryBusiness?.businessName && !userData?.leadData?.businessName) {
    pendingItems.push("Business profile");
  }
  if (
    !primaryBusiness?.employerIdentificationNumber &&
    !userData?.leadData?.ein
  ) {
    pendingItems.push("EIN verification letter");
  }
  if (ficoScore === 0) {
    pendingItems.push("Credit report score");
  }
  if (pendingItems.length === 0) {
    pendingItems.push(
      "Business bank statements (last 3 months)",
      "EIN verification letter",
    );
  }

  // Resolve the display name, preferring the authenticated user's real name.
  const resolvedClientName =
    clientName ||
    [userData?.firstName, userData?.lastName].filter(Boolean).join(" ") ||
    userData?.firstName ||
    "there";

  // Initials for Avatar
  const nameParts = resolvedClientName.split(" ").filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : resolvedClientName.slice(0, 2).toUpperCase();

  return (
    <div className="bg-[#18365d] text-white print:bg-[#18365d]">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 py-4 space-y-3.5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Top row on mobile: Avatar + Name/Business, and Readiness card */}
          <div className="flex items-start justify-between gap-3 lg:justify-start lg:flex-1 lg:min-w-0">
            {/* Avatar + Client Name & Business */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-full bg-slate-700/80 ring-2 ring-white/20 flex items-center justify-center shrink-0 font-bold text-[15px] text-white tracking-wider">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-[16px] sm:text-[17px] font-bold text-white leading-snug truncate">
                  {resolvedClientName}
                </div>
                <div className="text-[12px] sm:text-[12.5px] font-medium text-slate-300 leading-tight truncate">
                  {subtitle}
                </div>
              </div>
            </div>

            {/* Readiness card — shown inline on mobile (compact), moves right on desktop */}
            <div className="bg-white/10 backdrop-blur-xs ring-1 ring-white/15 rounded-2xl px-3 py-2 flex items-center gap-2.5 shrink-0 lg:hidden">
              <ProgressRing
                pct={pb.section4_approvalEstimate.clientMeetsMinFICO ? 94 : 65}
                size={40}
                onDark
              />
              <div className="hidden sm:block">
                <div className="text-[13px] font-bold text-white leading-tight">
                  Readiness
                </div>
                <div className="text-[11px] text-slate-300 leading-snug mt-0.5">
                  30 / 32 filled
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block h-10 w-px bg-slate-600/50 shrink-0" />

          {/* Center: Stat columns — responsive grid */}
          <div className="grid grid-cols-3 gap-x-4 gap-y-3 sm:gap-x-8 lg:flex lg:items-center lg:gap-x-8">
            {/* Stat 1: FICO */}
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                FICO
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Gauge className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="text-[17px] sm:text-[19px] font-extrabold text-white leading-none font-mono tabular-nums">
                  {displayFico}
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 mt-1 truncate">
                {scoreRating}
              </div>
            </div>

            {/* Stat 2: FUNDING PATH */}
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                FUNDING PATH
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <GitFork className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="text-[14px] sm:text-[16px] font-bold text-white leading-tight truncate">
                  {displayFundingPath}
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 mt-1 truncate">
                {timeInBusiness}
              </div>
            </div>

            {/* Stat 3: HOUSEHOLD INCOME */}
            <div className="min-w-0">
              <div className="text-[10px] sm:text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400">
                HOUSEHOLD INCOME
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <DollarSign className="w-4 h-4 text-blue-300 shrink-0" />
                <span className="text-[17px] sm:text-[19px] font-extrabold text-white leading-none font-mono tabular-nums truncate">
                  {formattedHouseholdIncome}
                </span>
              </div>
              <div className="text-[11px] font-medium text-slate-300 mt-1 truncate">
                {dtiPct}% utilization
              </div>
            </div>
          </div>

          {/* Right: Playbook Readiness Card — desktop only */}
          <div className="hidden lg:flex bg-white/10 backdrop-blur-xs ring-1 ring-white/15 rounded-2xl px-4 py-2.5 items-center gap-3.5 shrink-0">
            <ProgressRing
              pct={pb.section4_approvalEstimate.clientMeetsMinFICO ? 94 : 65}
              size={48}
              onDark
            />
            <div>
              <div className="text-[14px] font-bold text-white leading-tight">
                Playbook readiness
              </div>
              <div className="text-[11.5px] text-slate-300 leading-snug mt-0.5">
                30 of 32 data points filled
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner ("To reach 100%:") */}
        <div className="w-full rounded-xl border border-blue-400/25 bg-blue-950/40 px-4 py-2.5 text-[12px] sm:text-[12.5px] flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
          <span className="font-bold text-white shrink-0">To reach 100%:</span>
          <span className="text-slate-300 font-medium">
            Business bank statements (last 3 months) · EIN verification letter
          </span>
        </div>
      </div>
    </div>
  );
}
