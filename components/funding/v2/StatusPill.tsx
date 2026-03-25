// ============================================
// StatusPill — Status badges for application states
// ============================================
// Renders color-coded pill badges for different application statuses

import type { ClientApplicationStatus } from "@/schema/bank-products";

interface StatusPillProps {
  status: ClientApplicationStatus;
}

export function StatusPill({ status }: StatusPillProps) {
  const getColorClasses = () => {
    switch (status) {
      case "Approved":
        return {
          bg: "bg-blue-100",
          text: "text-blue-700",
          border: "border-blue-200",
        };
      case "Funded":
        return {
          bg: "bg-emerald-100",
          text: "text-emerald-700",
          border: "border-emerald-200",
        };
      case "Sent to Lender":
        return {
          bg: "bg-purple-100",
          text: "text-purple-700",
          border: "border-purple-200",
        };
      case "Declined":
        return {
          bg: "bg-red-100",
          text: "text-red-700",
          border: "border-red-200",
        };
      case "Pending":
        return {
          bg: "bg-amber-100",
          text: "text-amber-700",
          border: "border-amber-200",
        };
      case "Not Applied":
      default:
        return {
          bg: "bg-gray-100",
          text: "text-gray-700",
          border: "border-gray-200",
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      <span className="text-xs font-semibold">{status}</span>
    </div>
  );
}
