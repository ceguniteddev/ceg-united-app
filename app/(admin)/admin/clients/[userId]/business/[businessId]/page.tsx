"use client";
import { use } from "react";
import { BusinessDetailView } from "@/app/(client)/client/my-business/_components/BusinessDetailView";

interface Props {
  params: Promise<{ userId: string; businessId: string }>;
}

export default function AdminBusinessDetailPage({ params }: Props) {
  const { userId, businessId } = use(params);

  return (
    <BusinessDetailView
      targetUserId={userId}
      businessId={businessId}
      isAdminView={true}
    />
  );
}
