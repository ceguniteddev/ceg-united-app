"use client";
import HeaderBox from "@/components/HeaderBox";
import NoBankLinked from "@/components/NoBankLinked";
import RightSidebar from "@/components/RightSidebar";
import Spinner from "@/components/Spinner";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { useGetPlaidAccounts } from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";

const Home = () => {
  const { user } = useAuth();
  // const accounts = await getAccounts({
  //   userId: loggedIn.$id,
  // });

  const { plaidAccounts, isLoading } = useGetPlaidAccounts();

  if (isLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }

  const accountsData = plaidAccounts?.data;

  // const account = await getAccount({ bankItemId });

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
