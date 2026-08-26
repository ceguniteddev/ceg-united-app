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
      <div className="flex h-full min-h-[50vh] items-center justify-center p-8">
        <Spinner displayText="Loading Funding Playbook..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto p-6 sm:p-8 text-center mt-12 space-y-4">
        <div className="p-6 bg-white border border-gray-200 rounded-2xl shadow-xs space-y-3">
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
      <div className="max-w-xl mx-auto p-6 sm:p-8 text-center mt-12 space-y-4">
        <div className="p-6 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 text-sm shadow-xs space-y-3">
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
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs"
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
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 md:p-8 space-y-6">
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
