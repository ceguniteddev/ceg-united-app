"use client";

import { useState } from "react";
import { Sidebar } from "@/components/kpi/Sidebar";
import { TopBar } from "@/components/kpi/TopBar";
import { DemoToolbar, type DemoState } from "@/components/kpi/DemoToolbar";
import { DateRangeProvider } from "@/hooks/kpi/useDateRange";
import { DemoStateProvider } from "@/hooks/kpi/useDemoState";
import { usePathname } from "next/navigation";

export default function KPILayout({ children }: { children: React.ReactNode }) {
  const [demoState, setDemoState] = useState<DemoState>("normal");
  const pathname = usePathname();

  if (pathname.includes("/kpi/investors")) {
    return <>{children}</>;
  }

  return (
    <DemoStateProvider value={demoState}>
      <DateRangeProvider>
        <div className="flex h-screen bg-slate-50 font-inter">
          <Sidebar />
          <div className="flex-1 lg:ml-[228px] flex flex-col min-w-0 min-h-0 bg-white">
            <DemoToolbar
              state={demoState}
              onSetState={setDemoState}
              onReset={() => setDemoState("normal")}
            />
            <TopBar />
            {children}
          </div>
        </div>
      </DateRangeProvider>
    </DemoStateProvider>
  );
}
