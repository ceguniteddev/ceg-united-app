"use client";
import HeaderBox from "@/components/HeaderBox";
import NoBankLinked from "@/components/NoBankLinked";
import Spinner from "@/components/Spinner";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { useGetPlaidAccounts } from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";
const Home = () => {
  const { user } = useAuth();

  const { plaidAccounts, isLoading } = useGetPlaidAccounts();

  if (!user && !isLoading && !plaidAccounts) return <Spinner />;

  if (isLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }

  const accountsData = plaidAccounts?.data;

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={user?.displayName || "Guest"}
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={plaidAccounts?.totalBanks}
            totalCurrentBalance={plaidAccounts?.totalCurrentBalance}
          />
        </header>

        {/* <RecentTransactions
          accounts={accountsData}
          transactions={account?.transactions}
          bankItemId={bankItemId}
          page={currentPage}
        /> */}
      </div>

      {/* <RightSidebar
        user={user}
        // transactions={account?.transactions}
        banks={accountsData?.slice(0, 2)}
      /> */}
    </section>
  );
};

export default Home;
