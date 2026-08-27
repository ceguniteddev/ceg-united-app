"use client";

import React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface BankPlaybookButtonProps {
  userId?: string;
  lenderId?: string;
  productId?: string;
  referenceNumber?: string;
  pathwayId?: string;
  fundMappingApprovedId?: string;
  className?: string;
}

export function BankPlaybookButton({
  userId,
  lenderId,
  productId,
  referenceNumber,
  pathwayId,
  fundMappingApprovedId,
  className,
}: BankPlaybookButtonProps) {
  const queryClient = useQueryClient();
  const queryKey = ["funding-playbook-check", userId, lenderId, productId];
  const hasRequiredIds = Boolean(userId && lenderId && productId);
  const { data: hasPlaybook, isLoading: isChecking } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId || !lenderId || !productId) return false;

      try {
        const res = await fetch(
          `/api/funding-playbook/fetch?userId=${encodeURIComponent(userId)}&lenderId=${encodeURIComponent(lenderId)}&productId=${encodeURIComponent(productId)}`,
        );

        if (!res.ok) return false;

        const data = await res.json();
        return Boolean(data?.playbook?.section1_bestMethod);
      } catch {
        return false;
      }
    },
    enabled: hasRequiredIds,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const queryParams = new URLSearchParams();
  if (lenderId) queryParams.set("lenderId", lenderId);
  if (productId) queryParams.set("productId", productId);
  if (pathwayId) queryParams.set("pathwayId", pathwayId);
  if (referenceNumber) queryParams.set("referenceNumber", referenceNumber);
  if (fundMappingApprovedId) queryParams.set("fundId", fundMappingApprovedId);

  const queryString = queryParams.toString();
  const href = `/client/funding-playbook/view${queryString ? `?${queryString}` : ""}`;

  const generateMutation = useMutation({
    mutationFn: async () => {
      const endpoint = hasPlaybook
        ? "/api/funding-playbook/generate?force=true"
        : "/api/funding-playbook/generate";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, lenderId, productId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate playbook.");
      }

      const data = await response.json();
      if (!data?.playbook?.section1_bestMethod) {
        throw new Error("The generated playbook response was incomplete.");
      }
      return data.playbook;
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKey, true);
      toast.success(
        hasPlaybook
          ? "Funding Playbook regenerated successfully."
          : "Funding Playbook is ready to view.",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (!hasRequiredIds || isChecking) return null;

  if (!hasPlaybook) {
    return (
      <button
        type="button"
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className={cn(
          "cursor-pointer inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70",
          className,
        )}
        aria-label="Generate Funding Playbook"
      >
        {generateMutation.isPending ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
        ) : (
          <Sparkles className="size-3.5 shrink-0" />
        )}
        <span>
          {generateMutation.isPending ? "Generating…" : "Generate Playbook"}
        </span>
      </button>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-1.5", className)}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        title="View generated Funding Playbook in a new tab"
      >
        <Sparkles className="size-3.5 shrink-0 text-amber-300" />
        <span>View Playbook</span>
        <ExternalLink className="size-3 shrink-0 text-blue-100 opacity-90" />
      </a>
      <button
        type="button"
        onClick={() => generateMutation.mutate()}
        disabled={generateMutation.isPending}
        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        aria-label="Regenerate Funding Playbook"
        title="Create a new playbook using the latest available information"
      >
        {generateMutation.isPending ? (
          <Loader2 className="size-3.5 shrink-0 animate-spin" />
        ) : (
          <RefreshCw className="size-3.5 shrink-0" />
        )}
        <span>
          {generateMutation.isPending ? "Regenerating…" : "Regenerate"}
        </span>
      </button>
    </div>
  );
}

export default BankPlaybookButton;
