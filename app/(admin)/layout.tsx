import Sidebar from "@/components/SidebarAdmin";
import MobileNavAdmin from "@/components/MobileNavAdmin";
import { Metadata } from "next";

import { N8nChatAdmin } from "@/components/N8nChatAdmin";

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "/icon.ico",
  },
};

// app/(dashboard)/layout.tsx
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden font-inter">
      <Sidebar />
      <div className="flex flex-1 min-h-0 flex-col">
        <MobileNavAdmin />
        <div className="flex-1 min-h-0 overflow-y-auto pt-[60px] lg:pt-0 px-4 lg:px-6 pb-36 lg:pb-0">
          {children}
        </div>
      </div>

      <N8nChatAdmin />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@n8n/chat/dist/style.css"
      />
    </div>
  );
  // return (
  //   <div className="flex h-dvh w-full overflow-hidden font-inter">
  //     {/* Hide sidebar on mobile, show on md and up */}
  //     <div className="hidden md:block">
  //       <Sidebar />
  //     </div>
  //     <div className="flex flex-1 min-h-0 flex-col">
  //       <MobileNavAdmin />
  //       <div className="flex-1 min-h-0 overflow-y-auto pt-[60px] md:pt-0 px-2 md:px-4 lg:px-6 pb-24 md:pb-0">
  //         {children}
  //       </div>
  //     </div>
  //   </div>
  // );
}
