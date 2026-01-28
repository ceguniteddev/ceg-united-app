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
import { DataTablePagination } from "@/components/funding/pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Payment } from "@whop/sdk/resources.js";
import SortableHeader from "@/components/SortableHeader";
import { format } from "date-fns";

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "created_at",
    id: "created_at",
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => {
      return (
        <div>
          {format(new Date(row.getValue("created_at")), "MMM dd, yyyy")}
        </div>
      );
    },
  },
  {
    accessorKey: "user.email",
    header: ({ column }) => <SortableHeader column={column} title="Email" />,
  },
  {
    accessorKey: "user.name",
    header: ({ column }) => <SortableHeader column={column} title="Name" />,
  },
  {
    accessorKey: "total",
    header: ({ column }) => <SortableHeader column={column} title="Amount" />,
    cell: ({ row }) => <div>{row.getValue("total")}</div>,
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
  },
  {
    accessorKey: "product.title",
    header: ({ column }) => <SortableHeader column={column} title="Product" />,
  },
];

type Props = {
  whopPayments: Payment[] | undefined;
};

const WhopPaymentsList = ({ whopPayments }: Props) => {
  console.log("Rendering WhopPaymentsList with payments:", whopPayments);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: whopPayments || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="mx-auto w-full">
      <div className="flex items-center py-3 sm:py-4">
        <Input
          placeholder="Filter payments..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-sm h-10 sm:h-9"
        />
      </div>
      <div className="hidden md:flex rounded-md border">
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
};

export default WhopPaymentsList;
