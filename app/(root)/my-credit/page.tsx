"use client";
import NoBankLinked from "@/components/NoBankLinked";
import Spinner from "@/components/Spinner";
import { useGetPlaidAccounts } from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";
import React from "react";

const MyCreditPage = () => {
  const { user } = useAuth();

  const { plaidAccounts, isLoading } = useGetPlaidAccounts();

  if (!user && !isLoading && !plaidAccounts) return <Spinner />;

  if (isLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }

  return <div>MyCreditPage</div>;
};

export default MyCreditPage;
