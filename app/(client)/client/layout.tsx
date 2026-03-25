import Sidebar from "@/components/Sidebar";
import MobileNavClient from "@/components/MobileNavClient";
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
    <div className="flex h-screen w-full overflow-hidden font-inter">
      <Sidebar />
      <div className="flex flex-1 min-h-0 flex-col">
        <MobileNavClient />
        <div className="flex-1 min-h-0 overflow-y-auto pt-[60px] lg:pt-0 px-4 lg:px-6 pb-36 lg:pb-0">
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
