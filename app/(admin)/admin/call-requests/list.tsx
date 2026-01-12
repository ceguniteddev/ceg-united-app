"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
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
import { RequestCall } from "@/schema";
import CategoryBadge from "@/components/CategoryBadge";
import { DataTablePagination } from "@/components/funding/pagination";

export const columns: ColumnDef<RequestCall>[] = [
  {
    accessorKey: "fullName",
    id: "fullName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Full Name <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("fullName")}</div>;
    },
  },
  {
    accessorKey: "email",
    id: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("email")}</div>;
    },
  },
  {
    id: "phoneNumber",
    accessorKey: "phoneNumber",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Phone Number <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("phoneNumber")}</div>;
    },
  },
  {
    id: "message",
    accessorKey: "message",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Message <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("message")}</div>;
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
  callRequests: RequestCall[] | undefined;
  rowActions: (data: RequestCall) => React.ReactNode;
};

const CallRequestList = ({ callRequests, rowActions }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const actionColumn: ColumnDef<RequestCall> = {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => rowActions(row.original),
  };

  const table = useReactTable({
    data: callRequests || [],
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

  return (
    <div className="mx-auto w-full">
      <div className="flex items-center py-3 sm:py-4">
        <Input
          placeholder="Filter call requests..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-sm h-10 sm:h-9"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 mb-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const data = row.original;

            return (
              <div
                key={row.id}
                className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm break-words">
                      {data.fullName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 break-words">
                      {data.email}
                    </p>
                    <p className="text-xs text-muted-foreground break-words">
                      {data.phoneNumber}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <CategoryBadge category={data.status} />
                  </div>
                </div>

                {data.message && (
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground block mb-1">
                      Message:
                    </span>
                    <p className="text-xs break-words">{data.message}</p>
                  </div>
                )}

                <div className="pt-2 border-t">{rowActions(data)}</div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No results.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-md border">
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
      </div>
      <DataTablePagination table={table} />
    </div>
  );
};

export default CallRequestList;
