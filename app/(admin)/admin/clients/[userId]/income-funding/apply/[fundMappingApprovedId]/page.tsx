"use client";

import { Suspense, use } from "react";
import { Loader2 } from "lucide-react";
import { FundingApplyContent } from "@/app/(client)/client/income-funding/apply/[fundMappingApprovedId]/page";

export default function AdminFundingApplyPage({
  params,
}: {
  params: Promise<{ userId: string; fundMappingApprovedId: string }>;
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
        <FundingApplyContent
          userIdOverride={userId}
          backUrl={`/admin/clients/${userId}/income-funding`}
        />
      </Suspense>
    </div>
  );
}
