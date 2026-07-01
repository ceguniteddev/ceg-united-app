"use client";

import { Suspense } from "react";
import HeaderBox from "@/components/HeaderBox";
import { PsfInvoicesSection } from "@/components/income-funding/PsfInvoicesSection";
import { useAuth } from "@/provider/AuthContext";
import { Loader2 } from "lucide-react";

export default function MyInvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-sm text-gray-500 font-medium">
            Loading invoices...
          </p>
        </div>
      }
    >
      <MyInvoicesContent />
    </Suspense>
  );
}

function MyInvoicesContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-10">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <p className="text-sm text-gray-500 font-medium">
          Loading user session...
        </p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <HeaderBox
          title="My Invoices"
          subtext="View and pay your performance success fee invoices."
        />
      </div>

      <div className="space-y-6">
        <PsfInvoicesSection userId={user.uid} />
      </div>
    </section>
  );
}
