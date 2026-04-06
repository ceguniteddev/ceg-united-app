"use client";

import { useAuth } from "@/provider/AuthContext";
import ClientDocuments from "@/components/ClientDocuments";

export default function DocumentsPage() {
  const { user } = useAuth();

  return <ClientDocuments userId={user?.uid ?? ""} />;
}
