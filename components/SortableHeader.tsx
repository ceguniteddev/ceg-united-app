import * as React from "react";
import { Column } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * SortableHeader
 * A tiny, reusable header component for TanStack Table columns that handles
 * toggling sort on click and shows the correct icon for the current sort state.
 *
 * Features:
 * - Click to toggle sort (asc -> desc -> none)
 * - Shows ArrowUp / ArrowDown when sorted; ArrowUpDown when unsorted
 * - Optional multi-sort index badge when using multi-sort
 * - Accessible labels for screen readers
 * - Allows custom className/padding/etc via props
 *
 * Usage:
 *
 * columns: ColumnDef<RowType>[] = [
 *   {
 *     id: "status",
 *     accessorFn: (row) => row.status,
 *     header: ({ column }) => (
 *       <SortableHeader column={column} title="Status" />
 *     ),
 *     // ...other column options (sortingFn, cell, etc.)
 *   }
 * ]
 */

export type SortableHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: React.ReactNode;
  className?: string;
  /** If true, show the sort index when multi-sort is enabled */
  showSortIndex?: boolean;
  /** If true, hide the inactive (ArrowUpDown) icon until the column is hovered */
  subtleWhenInactive?: boolean;
  /** If provided, use this aria-label template for the button */
  ariaLabel?: (state: "asc" | "desc" | false) => string;
};

export function SortableHeader<TData, TValue>({
  column,
  title,
  className,
  showSortIndex = true,
  subtleWhenInactive = false,
  ariaLabel,
}: SortableHeaderProps<TData, TValue>) {
  const sorted = column.getIsSorted(); // 'asc' | 'desc' | false
  const sortIndex = column.getSortIndex(); // number | -1

  const defaultAria = (state: "asc" | "desc" | false) =>
    state === "asc" ? "Sort descending" : state === "desc" ? "Clear sort" : "Sort ascending";

  return (
    <div className={cn("flex w-full", className)}>
      <Button
        type="button"
        variant="ghost"
        onClick={column.getToggleSortingHandler()}
        className={cn("flex items-center gap-2 px-2 py-1 h-8", subtleWhenInactive && "group")}
        aria-label={(ariaLabel ?? defaultAria)(sorted)}
      >
        <span className="truncate">{title}</span>

        {/* Icon */}
        <span
          className={cn(
            "inline-flex",
            subtleWhenInactive && !sorted && "opacity-0 group-hover:opacity-100 transition-opacity"
          )}
        >
          {sorted === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : sorted === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : (
            <ArrowUpDown className="h-4 w-4" />
          )}
        </span>
      </Button>
    </div>
  );
}

export default SortableHeader;
