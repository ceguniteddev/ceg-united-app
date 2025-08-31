"use client";
import HeaderBox from "@/components/HeaderBox";
import { Pagination } from "@/components/Pagination";
import Spinner from "@/components/Spinner";
import TransactionsTable from "@/components/TransactionsTable";
import { useGetPlaidAccounts, useGetPlaidItemAccountByUserId } from "@/hooks/plaid";
import { formatAmount } from "@/lib/utils";
import { useAuth } from "@/provider/AuthContext";
import React from "react";

const TransactionHistory = ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const { plaidAccounts, isLoading } = useGetPlaidAccounts();

  const { user } = useAuth();

  const accountsData = plaidAccounts?.data;
  const bankItemId = (id as string) || accountsData[0]?.bankItemId;

  const { plaidItemAccounts } = useGetPlaidItemAccountByUserId(bankItemId);
  // const account = await getAccount({ bankItemId });

  if (!user) return null;

  if (isLoading) return <Spinner />;

  const rowsPerPage = 10;
  const totalPages = Math.ceil(plaidItemAccounts?.transactions.length / rowsPerPage);

  const indexOfLastTransaction = currentPage * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

  const currentTransactions = plaidItemAccounts?.transactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  );
  return (
    <div className="transactions">
      <div className="transactions-header">
        <HeaderBox title="Transaction History" subtext="See your bank details and transactions." />
      </div>

      <div className="space-y-6">
        <div className="transactions-account">
          <div className="flex flex-col gap-2">
            <h2 className="text-18 font-bold text-white">{plaidItemAccounts?.data.name}</h2>
            <p className="text-14 text-blue-25">{plaidItemAccounts?.data.officialName}</p>
            <p className="text-14 font-semibold tracking-[1.1px] text-white">
              ●●●● ●●●● ●●●● {plaidItemAccounts?.data.mask}
            </p>
          </div>

          <div className="transactions-account-balance">
            <p className="text-14">Current balance</p>
            <p className="text-24 text-center font-bold">
              {formatAmount(plaidItemAccounts?.data.currentBalance)}
            </p>
          </div>
        </div>

        <section className="flex w-full flex-col gap-6">
          <TransactionsTable transactions={currentTransactions} />
          {totalPages > 1 && (
            <div className="my-4 w-full">
              <Pagination totalPages={totalPages} page={currentPage} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TransactionHistory;
