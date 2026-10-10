"use client";

import React from "react";
import CreditRepairDisputesView from "@/components/credit-repair/CreditRepairDisputesView";
import { useAuth } from "@/provider/AuthContext";

export default function CreditRepairPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <CreditRepairDisputesView userId={user.uid} />
    </div>
  );
}
