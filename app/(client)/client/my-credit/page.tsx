"use client";
import ClientCreditReport from "@/components/ClientCreditReport";
import { useAuth } from "@/provider/AuthContext";

const MyCreditPage = () => {
  const { user, userData } = useAuth();

  return <ClientCreditReport userId={user?.uid ?? ""} userData={userData!} />;
};

export default MyCreditPage;
