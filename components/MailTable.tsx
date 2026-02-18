"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronDownIcon,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { retryTriggerEmail } from "@/service/trigger-email";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DataTablePagination } from "@/components/funding/pagination";
import SortableHeader from "@/components/SortableHeader";
import CategoryBadge from "./CategoryBadge";
import { EmailJobs } from "@/schema/trigger-email";

interface Mail {
  id: string;
  to: string | string[];
  message: {
    subject: string;
  };
  job?: EmailJobs;
  createdAt: Date;
  delivery?: {
    state: "PENDING" | "PROCESSING" | "SUCCESS" | "ERROR";
    error?: string;
    attempts?: number;
    endTime?: Date;
  };
}

const columns: ColumnDef<Mail>[] = [
  {
    accessorKey: "to",
    header: ({ column }) => (
      <SortableHeader column={column} title="Recipient" />
    ),
    cell: ({ row }) => {
      const to = row.getValue("to") as string | string[];
      return (
        <div
          className="max-w-[300px] truncate"
          title={Array.isArray(to) ? to.join(", ") : (to as string)}
        >
          {Array.isArray(to) ? to.join(", ") : to}
        </div>
      );
    },
  },
  {
    accessorKey: "message.subject",
    header: ({ column }) => <SortableHeader column={column} title="Subject" />,
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate font-medium">
        {row.original.message.subject}
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {format(new Date(row.getValue("createdAt") as string), "PP p")}
      </div>
    ),
  },
  {
    accessorKey: "job",
    id: "job",
    header: ({ column }) => <SortableHeader column={column} title="Job" />,
    cell: ({ row }) => (
      <Badge variant="outline">{row.getValue("job") || "GENERAL"}</Badge>
    ),
    filterFn: (row, id, value) => {
      if (!value || value === "ALL") return true;
      const job = row.original.job || "GENERAL";
      return job === value;
    },
  },
  {
    accessorKey: "delivery.state",
    id: "status",
    header: "Status",
    cell: ({ row }) => <StatusCell row={row} />,
    filterFn: (row, id, value) => {
      // If filtering for "ALL" (empty string in logic below), return true
      if (!value || value === "ALL") return true;
      const state = row.original.delivery?.state || "PENDING";
      return state === value;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <RetryButton id={row.original.id} />,
  },
];

const StatusCell = ({ row }: { row: any }) => {
  const state = (row.original.delivery?.state || "PENDING") as string;
  const error = row.original.delivery?.error;
  const [isOpen, setIsOpen] = useState(false);

  //   let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
  //   if (state === "SUCCESS") variant = "secondary";
  //   if (state === "ERROR") variant = "destructive";
  //   if (state === "PROCESSING") variant = "default";

  if (state === "ERROR" && error) {
    return (
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <div className="flex items-center gap-2">
          <CategoryBadge category={state} />
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-transparent"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
              <span className="sr-only">Toggle error</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="mt-2">
          <div className="rounded-md bg-red-50 p-2 text-xs text-red-900 font-mono break-all border border-red-100 max-w-[300px]">
            {error}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return <CategoryBadge category={state} />;
};

const RetryButton = ({ id }: { id: string }) => {
  const [loading, setLoading] = useState(false);

  const onRetry = async () => {
    setLoading(true);
    try {
      await retryTriggerEmail(id);
      toast.success("Email retry initiated");
    } catch (error) {
      console.error(error);
      toast.error("Failed to retry email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onRetry}
      disabled={loading}
      title="Retry sending email"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCcw className="h-4 w-4" />
      )}
    </Button>
  );
};

export function MailTable({ data }: { data: Mail[] }) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Filter emails..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Status:{" "}
                {(table.getColumn("status")?.getFilterValue() as string) ||
                  "All"}{" "}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={
                  (table.getColumn("status")?.getFilterValue() as string) ??
                  "ALL"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("status")
                    ?.setFilterValue(value === "ALL" ? "" : value)
                }
              >
                <DropdownMenuRadioItem value="ALL">All</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="SUCCESS">
                  Success
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="PENDING">
                  Pending
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="ERROR">
                  Error
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-2">
                Job:{" "}
                {(table.getColumn("job")?.getFilterValue() as string) || "All"}{" "}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuRadioGroup
                value={
                  (table.getColumn("job")?.getFilterValue() as string) ?? "ALL"
                }
                onValueChange={(value) =>
                  table
                    .getColumn("job")
                    ?.setFilterValue(value === "ALL" ? "" : value)
                }
              >
                <DropdownMenuRadioItem value="ALL">All</DropdownMenuRadioItem>
                {Object.values(EmailJobs).map((job) => (
                  <DropdownMenuRadioItem key={job} value={job}>
                    {job}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border hidden md:flex">
        <ScrollArea
          type="always"
          className="w-1 flex-1 h-[calc(100vh-350px)] min-h-[400px]"
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" className="w-full" />
        </ScrollArea>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
