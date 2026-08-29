import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNavClient from "@/components/MobileNavClient";
import { DodoPaymentReturnSync } from "@/components/payments/DodoPaymentReturnSync";
import "driver.js/dist/driver.css";
import "@/app/globals-funding.css";
// import UserBanners from "@/components/UserBanners";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "/icon.ico",
  },
};

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex h-[100dvh] w-full min-w-0 overflow-hidden font-inter">
      <Suspense fallback={null}>
        <DodoPaymentReturnSync />
      </Suspense>
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <MobileNavClient />
        <div className="min-h-0 min-w-0 w-full flex-1 overflow-x-hidden overflow-y-auto px-4 pb-24 pt-[110px] lg:px-6 lg:pb-0 lg:pt-0">
          {children}
        </div>
      </div>
    </div>
  );
  // return (
  //   <div>
  //     {/* <UserBanners /> */}

  //     <main className="flex h-screen w-full font-inter">
  //       <Sidebar />
  //       <div className="flex size-full flex-col overflow-y-auto">
  //         <MobileNavClient />
  //         <div className="pt-[60px] md:pt-0 px-4 md:px-0 pb-24 md:pb-0">
  //           {children}
  //         </div>
  //       </div>
  //     </main>
  //   </div>
  // );
}
