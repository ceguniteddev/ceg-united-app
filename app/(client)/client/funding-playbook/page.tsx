"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import { useClientMappedFundingDetailsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import { FundingPlaybookView } from "@/components/funding-playbook/FundingPlaybookView";
import type { Playbook } from "@/types/funding-playbook";
import type { ApprovedBankFormData } from "@/schema/bank-products";
import type { FundingApplicationSatus } from "@/schema/apply-funding";
import Spinner from "@/components/Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  Loader2,
  Building2,
  GitFork,
  FileText,
  AlertCircle,
  Sparkles,
  Play,
} from "lucide-react";

// ── Pathway helpers ──────────────────────────────────────────────────
const pathwayLabels: Record<string, string> = {
  income_based: "Income-Based Lenders",
  business_credit_card_stacking: "Business Credit Card Stacking",
  business_lines_of_credit: "Business Lines of Credit",
  business_loan: "Business Loans",
  personal_loan: "Personal Loans",
  personal_credit_card: "Personal Credit Cards",
};

const getPathwayLabel = (pathwayId: string) => {
  if (pathwayLabels[pathwayId]) return pathwayLabels[pathwayId];
  return pathwayId
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Statuses considered "Pre-Approved or greater"
const QUALIFYING_STATUSES: FundingApplicationSatus[] = [
  "Pre-Approved",
  "Approved",
  "Sent to Brokerage",
  "Offer Accepted",
];

export default function ClientFundingPlaybookPage() {
  const { user, userData } = useAuth();

  // ── 1. Funding Applications ────────────────────────────────────────
  const { appliedFunding, isLoading: isLoadingApplications } =
    useGetUserApplyFunding();

  // Build reference options (sorted newest first)
  const referenceOptions = useMemo(() => {
    if (!appliedFunding || appliedFunding.length === 0) return [];

    return appliedFunding
      .filter((app) => app.referenceNumber)
      .map((app) => ({
        value: app.referenceNumber!,
        label: `${format(new Date(app.appliedDate), "MMM d, yyyy")} – ${app.interestedProduct}`,
        date: new Date(app.appliedDate),
        appliedPathways: (app as any).appliedPathways as
          | { pathwayId: string; status: string; noOutputReason?: string }[]
          | undefined,
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appliedFunding]);

  const [selectedReference, setSelectedReference] = useState<string>("");

  // Auto-select when options load
  useEffect(() => {
    if (referenceOptions.length > 0 && !selectedReference) {
      setSelectedReference(referenceOptions[0].value);
    }
  }, [referenceOptions, selectedReference]);

  // ── 2. Applied Pathways (Pre-Approved or greater) ──────────────────
  const qualifiedPathways = useMemo(() => {
    if (!selectedReference) return [];

    const selected = referenceOptions.find(
      (opt) => opt.value === selectedReference,
    );
    if (!selected?.appliedPathways) return [];

    return selected.appliedPathways.filter((p) =>
      QUALIFYING_STATUSES.includes(p.status as FundingApplicationSatus),
    );
  }, [selectedReference, referenceOptions]);

  const [selectedPathwayId, setSelectedPathwayId] = useState<string>("");

  // Auto-select first qualifying pathway when pathways change
  useEffect(() => {
    if (qualifiedPathways.length > 0) {
      const stillValid = qualifiedPathways.some(
        (p) => p.pathwayId === selectedPathwayId,
      );
      if (!stillValid) {
        setSelectedPathwayId(qualifiedPathways[0].pathwayId);
      }
    } else {
      setSelectedPathwayId("");
    }
  }, [qualifiedPathways, selectedPathwayId]);

  // ── 3. Approved Mapped Funds (from auto-serve) ────────────────────
  const { mappedFund: approvedFunds = [], isLoading: isLoadingFunds } =
    useClientMappedFundingDetailsQuery({
      userId: user?.uid,
      referenceNumber: selectedReference || undefined,
      pathwayId: selectedPathwayId || undefined,
    });

  const [selectedFundId, setSelectedFundId] = useState<string>("");

  // Auto-select first fund when funds change
  useEffect(() => {
    if (approvedFunds && approvedFunds.length > 0) {
      const stillValid = (approvedFunds as ApprovedBankFormData[]).some(
        (f) => f.fundMappingApprovedId === selectedFundId,
      );
      if (!stillValid) {
        setSelectedFundId(
          (approvedFunds as ApprovedBankFormData[])[0].fundMappingApprovedId,
        );
      }
    } else {
      setSelectedFundId("");
    }
  }, [approvedFunds, selectedFundId]);

  const selectedFund = useMemo(() => {
    if (!selectedFundId || !approvedFunds) return null;
    return (
      (approvedFunds as ApprovedBankFormData[]).find(
        (f) => f.fundMappingApprovedId === selectedFundId,
      ) ?? null
    );
  }, [selectedFundId, approvedFunds]);

  // ── 4. Playbook generation ─────────────────────────────────────────
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isFetchingCache, setIsFetchingCache] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Derive lenderId & productId from the selected fund
  const lenderId = selectedFund?.bankId ?? "";
  const productId = selectedFund?.id ?? "";

  // Auto-fetch cached playbook on lender/product selection
  useEffect(() => {
    if (!user || !lenderId || !productId) {
      setPlaybook(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsFetchingCache(true);
    setError(null);

    fetch(
      `/api/funding-playbook/fetch?userId=${encodeURIComponent(user.uid)}&lenderId=${encodeURIComponent(lenderId)}&productId=${encodeURIComponent(productId)}`,
    )
      .then(async (res) => {
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (data?.playbook?.section1_bestMethod) {
            setPlaybook(data.playbook);
          } else {
            setPlaybook(null);
          }
        } else {
          setPlaybook(null);
        }
      })
      .catch(() => {
        if (isMounted) setPlaybook(null);
      })
      .finally(() => {
        if (isMounted) setIsFetchingCache(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, lenderId, productId]);

  // Explicit handler to generate / fetch cached playbook
  const handleGeneratePlaybook = useCallback(async () => {
    if (!user) return;

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/funding-playbook/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          lenderId,
          productId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      if (
        data.playbook &&
        typeof data.playbook === "object" &&
        data.playbook.section1_bestMethod
      ) {
        setPlaybook(data.playbook);
      } else {
        throw new Error("Received invalid playbook response format.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load playbook");
    } finally {
      setIsGenerating(false);
    }
  }, [user, lenderId, productId]);

  // ── Render: auth gate ──────────────────────────────────────────────
  if (!user) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Please sign in to view your personalized Funding Playbook.
      </div>
    );
  }

  if (isLoadingApplications) {
    return <Spinner />;
  }

  // ── Render: no applications ────────────────────────────────────────
  if (!appliedFunding || appliedFunding.length === 0) {
    return (
      <div className="p-6 sm:p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-6 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 text-sm shadow-xs space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-700 font-bold text-base">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>No Funding Applications Found</span>
          </div>
          <p className="text-xs text-amber-800">
            {`You haven't submitted any funding applications yet. Please apply for
            funding first.`}
          </p>
          <Link
            href="/client/income-funding"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Apply for Funding
          </Link>
        </div>
      </div>
    );
  }

  // ── Render: filters + playbook ─────────────────────────────────────
  const showApplicationDropdown = referenceOptions.length > 1;

  return (
    <section className="space-y-6 p-3 sm:p-6 md:p-8 max-w-7xl mx-auto">
      {/* ── Filter Bar Card ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-xs sm:text-sm font-semibold text-gray-900">
              Select a Lender for Your Playbook
            </h3>
          </div>
        </div>

        {/* Mobile-First Stack Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 items-end">
          {/* Filter 1: Funding Application (hidden if only 1) */}
          {showApplicationDropdown && (
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Funding Application</span>
              </label>
              <Select
                value={selectedReference}
                onValueChange={(val) => {
                  setSelectedReference(val);
                  setSelectedPathwayId("");
                  setSelectedFundId("");
                  setPlaybook(null);
                }}
              >
                <SelectTrigger className="h-11 sm:h-10 w-full bg-white border-gray-200 focus:border-blue-500 rounded-xl text-xs">
                  <SelectValue placeholder="Select application" />
                </SelectTrigger>
                <SelectContent>
                  {referenceOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-xs"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filter 2: Applied Pathway */}
          {qualifiedPathways.length > 0 && (
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Funding Pathway</span>
              </label>
              <Select
                value={selectedPathwayId}
                onValueChange={(val) => {
                  setSelectedPathwayId(val);
                  setSelectedFundId("");
                  setPlaybook(null);
                }}
              >
                <SelectTrigger className="h-11 sm:h-10 w-full bg-white border-gray-200 focus:border-blue-500 rounded-xl text-xs">
                  <SelectValue placeholder="Select pathway" />
                </SelectTrigger>
                <SelectContent>
                  {qualifiedPathways.map((p) => (
                    <SelectItem
                      key={p.pathwayId}
                      value={p.pathwayId}
                      className="text-xs"
                    >
                      {getPathwayLabel(p.pathwayId)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filter 3: Approved Mapped Fund (Lender/Product) OR Loading State */}
          {selectedPathwayId && (
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>Lender / Product</span>
              </label>

              {isLoadingFunds ? (
                /* Animated Friendly Loading Trigger State */
                <div className="flex h-11 sm:h-10 w-full items-center gap-2.5 rounded-xl border border-blue-100 bg-blue-50/50 px-3 text-xs text-blue-700 font-medium transition-all">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <span className="truncate">Loading approved lenders…</span>
                </div>
              ) : approvedFunds &&
                (approvedFunds as ApprovedBankFormData[]).length > 0 ? (
                <Select
                  value={selectedFundId}
                  onValueChange={(val) => {
                    setSelectedFundId(val);
                    setPlaybook(null);
                  }}
                >
                  <SelectTrigger className="h-11 sm:h-10 w-full bg-white border-gray-200 focus:border-blue-500 rounded-xl text-xs">
                    <SelectValue placeholder="Select lender" />
                  </SelectTrigger>
                  <SelectContent>
                    {(approvedFunds as ApprovedBankFormData[]).map((fund) => {
                      const productNames =
                        fund.products
                          ?.map((p) => p.productName)
                          .filter(Boolean)
                          .join(", ") || "N/A";
                      return (
                        <SelectItem
                          key={fund.fundMappingApprovedId}
                          value={fund.fundMappingApprovedId}
                          className="text-xs"
                        >
                          {fund.bankName} – {productNames}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex h-11 sm:h-10 w-full items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 text-xs text-amber-800">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">No approved lenders found</span>
                </div>
              )}
            </div>
          )}

          {/* Generate Button: Full width on mobile, inline on tablet/desktop (shown when no cached playbook exists) */}
          {selectedPathwayId &&
            !isLoadingFunds &&
            approvedFunds &&
            (approvedFunds as ApprovedBankFormData[]).length > 0 &&
            !playbook &&
            !isFetchingCache && (
              <div className="w-full sm:col-span-2 lg:col-span-1">
                <button
                  onClick={handleGeneratePlaybook}
                  disabled={isGenerating || !selectedFundId}
                  className="h-11 sm:h-10 w-full px-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                      <span>Generate Playbook</span>
                    </>
                  )}
                </button>
              </div>
            )}
        </div>

        {/* Informational notices */}
        {selectedReference && qualifiedPathways.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200/80 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              No pathways are Pre-Approved or beyond for this application yet.
            </span>
          </div>
        )}
      </div>

      {/* ── Playbook View & States ──────────────────────────────────── */}
      {(isGenerating || isFetchingCache) && <Spinner />}

      {!isGenerating && !isFetchingCache && error && (
        <div className="p-6 sm:p-8 max-w-xl mx-auto text-center space-y-4">
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-sm shadow-xs space-y-2">
            <p className="font-bold">Unable to generate playbook</p>
            <p className="text-xs text-amber-800">{error}</p>
          </div>
          <button
            onClick={handleGeneratePlaybook}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700 shadow-xs transition-all cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {!isGenerating && !isFetchingCache && !error && playbook && (
        <FundingPlaybookView
          playbook={playbook}
          clientName={
            userData?.firstName ||
            user.displayName ||
            user.email?.split("@")[0] ||
            ""
          }
          clientZip=""
          selectedFundingPath={getPathwayLabel(selectedPathwayId)}
        />
      )}

      {!selectedFundId && !isGenerating && !isFetchingCache && (
        <div className="p-8 sm:p-12 text-center text-xs sm:text-sm text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
          {selectedPathwayId
            ? "Select a lender above to view your playbook."
            : selectedReference
              ? "Select a funding pathway to continue."
              : "Select a funding application to get started."}
        </div>
      )}

      {selectedFundId &&
        !playbook &&
        !isGenerating &&
        !isFetchingCache &&
        !error && (
          <div className="p-8 sm:p-12 text-center text-xs sm:text-sm text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            No saved playbook found for this lender.
            <br /> Click{" "}
            <span className="font-semibold text-gray-600">
              Generate Playbook
            </span>{" "}
            above to generate your personalized Funding Playbook.
          </div>
        )}
    </section>
  );
}
