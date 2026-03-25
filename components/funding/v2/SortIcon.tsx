// ============================================
// SortIcon — Three-state sort indicator
// ============================================
// Renders appropriate icon for unsorted, ascending, or descending states

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface SortIconProps {
  isActive: boolean;
  direction?: "asc" | "desc";
}

export function SortIcon({ isActive, direction }: SortIconProps) {
  if (!isActive) {
    return <ArrowUpDown className="size-3 text-gray-300" />;
  }

  return direction === "asc" ? (
    <ArrowUp className="size-3 text-brand-600" />
  ) : (
    <ArrowDown className="size-3 text-brand-600" />
  );
}
