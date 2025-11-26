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
import SortableHeader from "../SortableHeader";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

const normalize = (s: unknown) =>
  String(s ?? "")
    .normalize("NFD")
    // strip accents/diacritics
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

export const nameFilterFn: FilterFn<ApplyFundingWithUser> = (
  row,
  columnId,
  filterValue
) => {
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
      <SortableHeader column={column} title="Reference Number" />
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

    header: ({ column }) => <SortableHeader column={column} title="Name" />,
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
      <SortableHeader column={column} title="Interested Product" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("interestedProduct")}</div>;
    },
  },
  {
    id: "personalAmountFunding",
    accessorKey: "personalAmountFunding",
    header: ({ column }) => (
      <SortableHeader column={column} title="Personal Amount" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-right pr-4">
          {formatAmount(row.getValue("personalAmountFunding"))}
        </div>
      );
    },
  },
  {
    id: "businessAmountFunding",
    accessorKey: "businessAmountFunding",

    header: ({ column }) => (
      <SortableHeader column={column} title="Business Amount" />
    ),
    cell: ({ row }) => {
      return (
        <div className="text-right pr-4">
          {formatAmount(row.getValue("businessAmountFunding"))}
        </div>
      );
    },
  },
  {
    id: "appliedDate",
    accessorKey: "appliedDate",

    header: ({ column }) => (
      <SortableHeader column={column} title="Applied Date" />
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

    header: ({ column }) => <SortableHeader column={column} title="Status" />,
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
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
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
      <div className="rounded-md border flex">
        <ScrollArea type="always" className="w-1 flex-1">
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
                              header.getContext()
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
                          cell.getContext()
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
};
export default AdminFundingList;
