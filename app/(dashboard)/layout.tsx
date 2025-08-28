"use client";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <div className="dashboard">
      <div className="dashboard__content">
        <div className={cn("dashboard__main")}>
          <div>
            <Navbar />
            <main className="dashboard__body">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}
