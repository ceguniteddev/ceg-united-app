"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function MigrateBillingButton({
  userId,
  target,
}: {
  userId: string;
  target: "membership" | "credit_module_pro";
}) {
  const [loading, setLoading] = useState(false);
  const migrate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/user/${userId}/billing/migrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Unable to start billing migration.");
      }
      window.location.assign(data.url);
    } catch (error: any) {
      toast.error(error.message || "Unable to start billing migration.");
      setLoading(false);
    }
  };
  return (
    <Button
      onClick={migrate}
      disabled={loading}
      className="bg-blue-600 text-white hover:bg-blue-700"
    >
      {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
      Switch to Dodo billing
      {!loading ? <ArrowRight className="ml-2 size-4" /> : null}
    </Button>
  );
}
