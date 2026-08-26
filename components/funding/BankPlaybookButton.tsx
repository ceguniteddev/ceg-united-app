"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const { data: hasPlaybook } = useQuery({
    queryKey: ["funding-playbook-check", userId, lenderId, productId],
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
    enabled: Boolean(userId && lenderId && productId),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  if (!hasPlaybook) return null;

  const queryParams = new URLSearchParams();
  if (lenderId) queryParams.set("lenderId", lenderId);
  if (productId) queryParams.set("productId", productId);
  if (pathwayId) queryParams.set("pathwayId", pathwayId);
  if (referenceNumber) queryParams.set("referenceNumber", referenceNumber);
  if (fundMappingApprovedId) queryParams.set("fundId", fundMappingApprovedId);

  const queryString = queryParams.toString();
  const href = `/client/funding-playbook/view${queryString ? `?${queryString}` : ""}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border border-blue-200 transition-colors shrink-0 cursor-pointer shadow-2xs",
        className,
      )}
      title="View generated Funding Playbook in a new tab"
    >
      <Sparkles className="w-3 h-3 text-blue-600 shrink-0" />
      <span>Playbook</span>
      <ExternalLink className="w-3 h-3 text-blue-500 opacity-80 shrink-0" />
    </a>
  );
}

export default BankPlaybookButton;
