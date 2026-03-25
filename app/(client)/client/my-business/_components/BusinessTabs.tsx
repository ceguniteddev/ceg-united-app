"use client";
import {
  LayoutDashboard,
  CreditCard,
  BarChart2,
  Zap,
  ShieldCheck,
} from "lucide-react";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "credit-report", label: "Credit Report", icon: CreditCard },
  { id: "finance-audit", label: "Finance Audit", icon: BarChart2 },
  { id: "tradeline-suggestions", label: "Tradeline Suggestions", icon: Zap },
  { id: "fundability-audit", label: "Fundability Audit", icon: ShieldCheck },
] as const;

export type BusinessTab = (typeof TABS)[number]["id"];

interface Props {
  activeTab: BusinessTab;
  onTabChange: (tab: BusinessTab) => void;
}

export function BusinessTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="flex items-center gap-1 border-b border-gray-100 mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`cursor-pointer inline-flex items-center gap-1.5 px-3 sm:px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap flex-shrink-0 ${
            activeTab === tab.id
              ? "bg-blue-600 text-white"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  );
}
