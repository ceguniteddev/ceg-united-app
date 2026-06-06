"use client";

import React from "react";
import CreditRepairView from "@/components/CreditRepairView";
import { useAuth } from "@/provider/AuthContext";

export default function CreditRepairPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex flex-col gap-6 w-full h-full">
      <CreditRepairView userId={user.uid} />
    </div>
  );
}
