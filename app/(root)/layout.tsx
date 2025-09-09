import Sidebar from "@/components/Sidebar";
import "driver.js/dist/driver.css";
import UserBanners from "@/components/UserBanners";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <UserBanners />

      <main className="flex h-screen w-full font-inter">
        <Sidebar />
        <div className="flex size-full flex-col">{children}</div>
      </main>
    </div>
  );
}
