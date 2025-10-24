"use client";
import ClientCreditReport from "@/components/ClientCreditReport";
import { useAuth } from "@/provider/AuthContext";
import React from "react";

const MyCreditPage = () => {
  const { user } = useAuth();

  return <ClientCreditReport userId={user?.uid ?? ""} />;
};

export default MyCreditPage;
