"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";
import { FundingPlaybookView } from "@/components/funding-playbook/FundingPlaybookView";
import type { Playbook } from "@/types/funding-playbook";
import Spinner from "@/components/Spinner";
import { AlertCircle, ArrowLeft } from "lucide-react";

// ── Pathway helpers ──────────────────────────────────────────────────
const pathwayLabels: Record<string, string> = {
  income_based: "Income-Based Lenders",
  business_credit_card_stacking: "Business Credit Card Stacking",
  business_lines_of_credit: "Business Lines of Credit",
  business_loan: "Business Loans",
  personal_loan: "Personal Loans",
  personal_credit_card: "Personal Credit Cards",
};

const getPathwayLabel = (pathwayId?: string) => {
  if (!pathwayId) return "";
  if (pathwayLabels[pathwayId]) return pathwayLabels[pathwayId];
  return pathwayId
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function StandaloneFundingPlaybookPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <StandaloneFundingPlaybookContent />
    </Suspense>
  );
}

export function StandaloneFundingPlaybookContent({
  initialLenderId,
  initialProductId,
  initialPathwayId,
}: {
  initialLenderId?: string;
  initialProductId?: string;
  initialPathwayId?: string;
} = {}) {
  const searchParams = useSearchParams();
  const lenderId = searchParams?.get("lenderId") || initialLenderId || "";
  const productId = searchParams?.get("productId") || initialProductId || "";
  const pathwayId = searchParams?.get("pathwayId") || initialPathwayId || "";

  const { user, userData, loading: authLoading } = useAuth();

  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsLoading(false);
      return;
    }

    if (!lenderId || !productId) {
      setIsLoading(false);
      setError(
        "Missing lender or product information to load the Funding Playbook.",
      );
      return;
    }

    let isMounted = true;
    setIsLoading(true);
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
            setError(
              "No generated Funding Playbook found for this bank product.",
            );
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setError(
            errData.error ||
              "No generated Funding Playbook found for this bank product.",
          );
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to load Funding Playbook.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, lenderId, productId]);

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[60dvh] w-full items-center justify-center px-4 py-8 sm:min-h-[50vh] sm:p-8">
        <Spinner displayText="Loading Funding Playbook..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8 text-center sm:px-8 sm:py-12">
        <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-center gap-2 text-gray-800 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
            <span>Sign In Required</span>
          </div>
          <p className="text-xs text-gray-600">
            Please sign in to view your personalized Funding Playbook.
          </p>
        </div>
      </div>
    );
  }

  if (error || !playbook) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-8 text-center sm:px-8 sm:py-12">
        <div className="space-y-3 rounded-2xl border border-amber-200/80 bg-amber-50 p-5 text-sm text-amber-900 sm:p-6">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-bold text-base">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>Funding Playbook Unavailable</span>
          </div>
          <p className="text-xs text-amber-800">
            {error ||
              "No Funding Playbook was found for this lender and product."}
          </p>
          <div className="pt-2">
            <Link
              href="/client/funding-playbook"
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 sm:w-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go to Funding Playbook Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full min-w-0 overflow-x-clip bg-gray-50">
      <FundingPlaybookView
        playbook={playbook}
        clientName={
          userData?.firstName ||
          user.displayName ||
          user.email?.split("@")[0] ||
          ""
        }
        clientZip=""
        selectedFundingPath={getPathwayLabel(pathwayId)}
      />
    </div>
  );
}
