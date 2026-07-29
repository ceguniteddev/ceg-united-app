"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Megaphone,
  Landmark,
  Settings2,
  HeartHandshake,
  Wallet,
  BrainCircuit,
  Users,
  LineChart,
  Lock,
  Sparkles,
  Menu,
  X,
  CircleDot,
  ArrowLeft,
} from "lucide-react";
import { CEGLogo } from "./CEGLogo";
import { ADAPTER_MODE } from "@/lib/kpi/data/adapter";

// ============================================
// Sidebar — Executive / Departments / Intelligence
// ============================================

const SECTIONS: {
  section: string;
  items: { label: string; path: string; icon: any }[];
}[] = [
  {
    section: "Command",
    items: [{ label: "Executive", path: "/kpi", icon: LayoutDashboard }],
  },
  {
    section: "Departments",
    items: [
      { label: "Sales", path: "/kpi/sales", icon: TrendingUp },
      { label: "Marketing", path: "/kpi/marketing", icon: Megaphone },
      { label: "Funding", path: "/kpi/funding", icon: Landmark },
      { label: "Operations", path: "/kpi/operations", icon: Settings2 },
      { label: "Success", path: "/kpi/success", icon: HeartHandshake },
      { label: "Finance", path: "/kpi/finance", icon: Wallet },
    ],
  },
  {
    section: "Intelligence",
    items: [
      { label: "Brain Performance", path: "/kpi/brain", icon: BrainCircuit },
      { label: "AI Briefing", path: "/kpi/briefing", icon: Sparkles },
      { label: "Forecasting", path: "/kpi/forecasting", icon: LineChart },
    ],
  },
  {
    section: "People & Access",
    items: [
      { label: "Employees", path: "/kpi/employees", icon: Users },
      {
        label: "Investor Portal",
        path: "/kpi/investors/ceg-2026-q3-a7f3",
        icon: Lock,
      },
    ],
  },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const content = (
    <>
      <div className="px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <CEGLogo />
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 -mr-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-2.5 pt-2 pb-1 border-b border-gray-100">
        <Link
          href="/admin/home"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2 p-2 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 flex-shrink-0 text-gray-500" />
          <span>Back to Admin</span>
        </Link>
      </div>

      <nav className="flex-1 px-2.5 pb-3 overflow-y-auto custom-scrollbar">
        {SECTIONS.map((group) => (
          <div key={group.section}>
            <div className="nav-section-label text-gray-500 uppercase text-xs font-semibold my-2 px-2">
              {group.section}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  item.path === "/kpi"
                    ? pathname === "/kpi"
                    : pathname.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`nav-item flex items-center gap-2 p-2 rounded-md text-sm font-medium ${isActive ? "nav-item-active bg-blue-50 text-blue-600" : "nav-item-inactive text-gray-700 hover:bg-gray-100"}`}
                    >
                      <item.icon className="w-[17px] h-[17px] flex-shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Data source mode footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400">
          <CircleDot
            className={`w-3 h-3 ${ADAPTER_MODE === "live" ? "text-green-500" : "text-amber-500"}`}
          />
          <span className="uppercase tracking-[0.1em]">
            {ADAPTER_MODE === "live" ? "Live data" : "Demo data"}
          </span>
        </div>
        <p className="mt-1 text-[10px] leading-snug text-gray-400">
          KPI OS v3.0 | adapter:{" "}
          <span className="font-mono text-gray-500">{ADAPTER_MODE}</span>
        </p>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-lg shadow-md border border-gray-100"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-[228px] bg-white border-r border-gray-200 flex flex-col z-50 shadow-sm
          transition-transform duration-300 ease-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {content}
      </aside>
    </>
  );
}
