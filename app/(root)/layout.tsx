"use client";
import Sidebar from "@/components/Sidebar";
import "driver.js/dist/driver.css";
import UserBanners from "@/components/UserBanners";
import { useAuth } from "@/provider/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div>
      <UserBanners />

      <main className="flex h-screen w-full font-inter">
        <Sidebar />
        <div className="flex size-full flex-col overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
