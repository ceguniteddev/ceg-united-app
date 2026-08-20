"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/provider/AuthContext";

export function DodoPaymentReturnSync() {
  let searchParams: any = null;
  try {
    searchParams = useSearchParams();
  } catch {
    // Fallback if router context is absent in test environments
  }

  let pathname: string | null = null;
  try {
    pathname = usePathname();
  } catch {
    // Fallback if router context is absent
  }

  let router: any = null;
  try {
    router = useRouter();
  } catch {
    // Fallback if router context is absent in certain test environments
  }

  const queryClient = useQueryClient();
  const { user, userData } = useAuth();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const params =
      searchParams ||
      (typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null);

    if (!params) return;

    const paymentId = params.get?.("payment_id") || params.get?.("paymentId");
    const checkoutId =
      params.get?.("checkout_id") ||
      params.get?.("checkoutId") ||
      params.get?.("session_id");
    const subscriptionId =
      params.get?.("subscription_id") || params.get?.("subscriptionId");
    const status = params.get?.("status") || params.get?.("payment_status");

    const hasPaymentReturnParams = !!(
      paymentId ||
      checkoutId ||
      subscriptionId ||
      status
    );

    if (!hasPaymentReturnParams) return;

    const paramKey = `${paymentId || ""}-${checkoutId || ""}-${subscriptionId || ""}-${status || ""}`;
    if (handledRef.current === paramKey) return;
    handledRef.current = paramKey;

    const targetUserId = user?.uid || userData?.id;

    // Invalidate all related React Query caches immediately
    queryClient.invalidateQueries({ queryKey: ["membership"] });
    queryClient.invalidateQueries({ queryKey: ["all-memberships"] });
    if (targetUserId) {
      queryClient.invalidateQueries({ queryKey: ["user", targetUserId] });
    }

    toast.info("Verifying your payment and updating membership status...");

    let attempt = 0;
    const maxAttempts = 5;
    const pollIntervals = [0, 1500, 3500, 6000, 9000];

    const verifyMembership = async () => {
      attempt++;
      if (!targetUserId) return;

      try {
        const res = await fetch(
          `/api/user/${targetUserId}/membership?bypassCache=true`,
        );
        if (res.ok) {
          const membership = await res.json();
          if (membership && membership.status === "active") {
            queryClient.invalidateQueries({ queryKey: ["membership"] });
            queryClient.invalidateQueries({ queryKey: ["all-memberships"] });
            queryClient.invalidateQueries({ queryKey: ["user", targetUserId] });
            toast.success("Membership activated! Welcome to CEG Brain.");
            router?.refresh?.();
            cleanUrl();
            return;
          }
        }
      } catch (err) {
        console.error("Error verifying membership after payment return:", err);
      }

      if (attempt < maxAttempts) {
        setTimeout(verifyMembership, pollIntervals[attempt] || 3000);
      } else {
        queryClient.invalidateQueries({ queryKey: ["membership"] });
        router?.refresh?.();
        cleanUrl();
      }
    };

    const cleanUrl = () => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.delete("payment_id");
        url.searchParams.delete("paymentId");
        url.searchParams.delete("checkout_id");
        url.searchParams.delete("checkoutId");
        url.searchParams.delete("session_id");
        url.searchParams.delete("subscription_id");
        url.searchParams.delete("subscriptionId");
        url.searchParams.delete("status");
        url.searchParams.delete("payment_status");
        window.history.replaceState({}, "", url.pathname + url.search);
      }
    };

    verifyMembership();
  }, [searchParams, pathname, user?.uid, userData?.id, queryClient, router]);

  return null;
}
