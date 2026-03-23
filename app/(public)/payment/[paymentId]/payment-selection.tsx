"use client";

import React from "react";
import { UserWithId } from "@/schema/registration";
import { PaymentGrid } from "@/components/funding/PaymentGrid";

export default function PaymentSelection({ user, paymentId }: { user: UserWithId, paymentId: string }) {
  return (
    <PaymentGrid
      userId={user.id}
      redirectPath="checkout"
      className="p-4 max-w-6xl mx-auto"
      paymentId={paymentId}
    />
  );
}
