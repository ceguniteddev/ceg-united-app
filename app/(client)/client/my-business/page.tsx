"use client";

import { useAuth } from "@/provider/AuthContext";

import ClientBusiness from "./_components/ClientBusiness";

const MyBusinessPage = () => {
  const { user } = useAuth();

  return <ClientBusiness userId={user?.uid ?? ""} />;
};

export default MyBusinessPage;
