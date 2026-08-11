"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";
import { FundingPlaybookView } from "@/components/funding-playbook/FundingPlaybookView";
import type { Playbook } from "@/types/funding-playbook";
import Spinner from "@/components/Spinner";

export default function ClientFundingPlaybookPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const lenderId = searchParams?.get("lenderId") || "chase";
  const productId = searchParams?.get("productId") || "ink-business-preferred";

  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch("/api/funding-playbook/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: user.uid,
        lenderId,
        productId,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.playbook) {
          setPlaybook(data.playbook);
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setError(err.message || "Failed to load playbook");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, lenderId, productId]);

  if (!user) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Please sign in to view your personalized Funding Playbook.
      </div>
    );
  }

  if (isLoading) {
    return <Spinner />;
  }

  if (error || !playbook) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm">
          <p className="font-bold">Unable to generate playbook</p>
          <p className="mt-1 text-xs">{error || "No playbook data returned"}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <FundingPlaybookView
      playbook={playbook}
      clientName={user.displayName || user.email?.split("@")[0] || "Client"}
      clientZip={user.uid ? "32601" : ""}
      onBack={() => history.back()}
    />
  );
}
