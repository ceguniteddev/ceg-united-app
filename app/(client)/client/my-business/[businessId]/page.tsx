"use client";
import { use } from "react";
import { useAuth } from "@/provider/AuthContext";
import { BusinessDetailView } from "../_components/BusinessDetailView";

interface Props {
  params: Promise<{ businessId: string }>;
}

export default function BusinessDetailPage({ params }: Props) {
  const { businessId } = use(params);
  const { user } = useAuth();

  return (
    <BusinessDetailView
      targetUserId={user?.uid ?? ""}
      businessId={businessId}
      isAdminView={false}
    />
  );
}
