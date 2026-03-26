"use client";
import {
  LayoutDashboard,
  CreditCard,
  BarChart2,
  Zap,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const activeTabData = TABS.find((tab) => tab.id === activeTab);

  return (
    <div>
      {/* Mobile Dropdown */}
      <div className="md:hidden">
        <Select
          value={activeTab}
          onValueChange={(value) => onTabChange(value as BusinessTab)}
        >
          <SelectTrigger className="w-full min-h-[48px] bg-white border-gray-200">
            <div className="flex items-center gap-2">
              {activeTabData && (
                <>
                  <activeTabData.icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="font-medium text-gray-900">
                    {activeTabData.label}
                  </span>
                </>
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            {TABS.map((tab) => (
              <SelectItem key={tab.id} value={tab.id}>
                <div className="flex items-center gap-2">
                  <tab.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Tabs */}
      <div className="hidden md:block border-b border-gray-100">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-px">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-sm font-medium rounded-t-lg transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <tab.icon className="w-5 h-5 flex-shrink-0" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
