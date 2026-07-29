"use client";

import { Sidebar } from "@/components/kpi/Sidebar";
import { TopBar } from "@/components/kpi/TopBar";
import { DateRangeProvider } from "@/hooks/kpi/useDateRange";
import { usePathname } from "next/navigation";

export default function KPILayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.includes("/kpi/investors")) {
    return <>{children}</>;
  }

  return (
    <DateRangeProvider>
      <div className="flex h-screen bg-slate-50 font-inter">
        <Sidebar />
        <div className="flex-1 lg:ml-[228px] flex flex-col min-w-0 min-h-0 bg-white">
          <TopBar />
          {children}
        </div>
      </div>
    </DateRangeProvider>
  );
}
