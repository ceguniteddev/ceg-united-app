"use client";

import { Suspense, use } from "react";
import { Loader2 } from "lucide-react";
import { IncomeFundingContent } from "@/app/(client)/client/income-funding/page";

export default function AdminIncomeFundingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);

  return (
    <div className="flex flex-col h-full bg-gray-50/30">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center h-full w-full p-10">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-4" />
            <p className="text-sm text-gray-500 font-medium">Loading...</p>
          </div>
        }
      >
        <IncomeFundingContent userIdOverride={userId} />
      </Suspense>
    </div>
  );
}
