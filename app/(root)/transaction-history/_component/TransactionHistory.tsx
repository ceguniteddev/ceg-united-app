"use client";
import HeaderBox from "@/components/HeaderBox";
import { Pagination } from "@/components/Pagination";
import Spinner from "@/components/Spinner";
import TransactionsTable from "@/components/TransactionsTable";
import { useGetPlaidAccounts, useGetPlaidItemAccountByUserId } from "@/hooks/plaid";
import { formatAmount } from "@/lib/utils";
import { useAuth } from "@/provider/AuthContext";
import React, { useCallback } from "react";
import { useSearchParams } from "next/navigation";
import NoBankLinked from "@/components/NoBankLinked";
import AccountList from "./AccountList";

const TransactionHistory = () => {
  const searchParams = useSearchParams();
  const page = searchParams.get("page");
  const id = searchParams.get("id");
  const currentPage = Number(page as string) || 1;
  const { plaidAccounts, isLoading } = useGetPlaidAccounts();
  const [bankItemId, setBankItemId] = React.useState<string>("");
  const [selectedAccount, setSelectedAccount] = React.useState<string>("");
  const { plaidItemAccounts, isLoading: isPlaidItemAccountsLoading } =
    useGetPlaidItemAccountByUserId(bankItemId, selectedAccount);
  const { user } = useAuth();

  const handleAccountChange = useCallback((id: string) => {
    const [accountId, bankItemId] = id.split("-");

    setSelectedAccount(accountId);
    setBankItemId(bankItemId);
  }, []);

  if (!user) return null;

  if (isLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }

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

      <div className="flex flex-row items-center space-x-4">
        <h2 className="text-18 font-bold text-black">Select account</h2>
        <AccountList data={plaidAccounts.data} handleAccountChange={handleAccountChange} />
      </div>

      {plaidItemAccounts ? (
        <div className="space-y-6">
          <div className="transactions-account">
            <div className="flex flex-col gap-2">
              <h2 className="text-18 font-bold text-white">{plaidItemAccounts?.data[0].name}</h2>
              <p className="text-14 text-blue-25">{plaidItemAccounts?.data[0].officialName}</p>
              <p className="text-14 font-semibold tracking-[1.1px] text-white">
                ●●●● ●●●● ●●●● {plaidItemAccounts?.data[0].mask}
              </p>
            </div>

            <div className="transactions-account-balance">
              <p className="text-14">Current balance</p>
              <p className="text-24 text-center font-bold">
                {formatAmount(plaidItemAccounts?.data[0].currentBalance)}
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
      ) : (
        <div>{isPlaidItemAccountsLoading && <Spinner displayText="Loading transactions..." />}</div>
      )}
    </div>
  );
};

export default TransactionHistory;
