import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import RightSidebar from "@/components/RightSidebar";
import Spinner from "@/components/Spinner";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { useGetPlaidAccounts } from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";

const Home = ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const { user } = useAuth();
  // const accounts = await getAccounts({
  //   userId: loggedIn.$id,
  // });

  const { plaidAccounts, isLoading } = useGetPlaidAccounts();

  if (isLoading) return <Spinner />;

  if (!plaidAccounts) return;

  const accountsData = plaidAccounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  // const account = await getAccount({ appwriteItemId });

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
          appwriteItemId={appwriteItemId}
          page={currentPage}
        /> */}
      </div>

      <RightSidebar
        user={user}
        // transactions={account?.transactions}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  );
};

export default Home;
