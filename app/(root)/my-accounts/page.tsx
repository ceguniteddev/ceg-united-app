"use client";
import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import NoBankLinked from "@/components/NoBankLinked";
import Spinner from "@/components/Spinner";
import { useGetPlaidAccounts } from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";
import React from "react";

const MyBanks = () => {
  const { plaidAccounts, isLoading } = useGetPlaidAccounts();
  const { user } = useAuth();

  if (!user) return null;

  if (isLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox title="My Bank Accounts" subtext="Effortlessly manage your banking activites." />

        <div className="space-y-4">
          {/* <h2 className="header-2">Your cards</h2> */}
          <div className="flex flex-wrap gap-6">
            {plaidAccounts &&
              plaidAccounts.data.map((a: Account) => (
                <BankCard key={a.id} account={a} userName={user?.displayName ?? ""} />
              ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;
