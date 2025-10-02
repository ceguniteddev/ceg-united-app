"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./pagination";
import { ApplyFundingWithUser } from "@/schema/apply-funding";
import { formatAmount, formatDateTime } from "@/lib/utils";
import CategoryBadge from "../CategoryBadge";

const normalize = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    // strip accents/diacritics
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const nameFilterFn: FilterFn<ApplyFundingWithUser> = (row, columnId, filterValue) => {
  const haystack = normalize(row.getValue<string>(columnId));
  const q = normalize(filterValue);

  if (!q) return true; // no filter -> include

  // Require all space-separated tokens to be present (AND search)
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
};

export const columns: ColumnDef<ApplyFundingWithUser>[] = [
  {
    accessorKey: "referenceNumber",
    id: "referenceNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Reference Number <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("referenceNumber")}</div>;
    },
  },
  {
    // Build a single string for filtering/sorting
    id: "name",
    accessorFn: (row) => {
      const u = row.user;
      const parts = [u?.firstName, u?.middleName, u?.lastName].filter(Boolean);
      return parts.join(" ");
    },
    filterFn: nameFilterFn,
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const u = row.original.user;
      if (!u) return <div className="text-muted-foreground">Unknown</div>;
      return <div>{[u.firstName, u.lastName].filter(Boolean).join(" ")}</div>;
    },
  },
  {
    id: "interestedProduct",
    accessorKey: "interestedProduct",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Product <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("interestedProduct")}</div>;
    },
  },
  {
    id: "amountFunding",
    accessorKey: "amountFunding",
    header: ({ column }) => (
      <div className="flex w-full justify-end">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div className="text-right">{formatAmount(row.getValue("amountFunding"))}</div>;
    },
  },
  {
    id: "appliedDate",
    accessorKey: "appliedDate",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Applied Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("appliedDate") as string | Date;
      const date = new Date(raw);

      return <div>{formatDateTime(date).dateTime}</div>;
    },
  },
  {
    id: "status",
    accessorKey: "status",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Status <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div>
          <CategoryBadge category={row.getValue("status")} />
        </div>
      );
    },
  },
];

type Props = {
  appliedFunding: ApplyFundingWithUser[] | undefined;
  rowActions: (data: ApplyFundingWithUser) => React.ReactNode;
};

const AdminFundingList = ({ appliedFunding, rowActions }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const actionColumn: ColumnDef<ApplyFundingWithUser> = {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => rowActions(row.original),
  };

  const table = useReactTable({
    data: appliedFunding || [],
    columns: [...columns, actionColumn],
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  React.useEffect(() => {
    const hasUser = appliedFunding?.some((row) => row.user);
    table.getColumn("name")?.toggleVisibility(!!hasUser);
  }, [appliedFunding, table]);
  return (
    <div className="mx-auto w-full">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filter"
          // value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          value={globalFilter}
          // onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
};
export default AdminFundingList;
