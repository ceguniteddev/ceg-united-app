"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useUserTradelines } from "@/hooks/tradelines";
import { useAuth } from "@/provider/AuthContext";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SortableHeader from "@/components/SortableHeader";
import { DataTablePagination } from "@/components/funding/pagination";
import { Badge } from "@/components/ui/badge";
import Spinner from "./Spinner";

function formatCurrency(value: number | string | undefined | null): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    if (!/\d/.test(value)) return value;
    const num = Number(value.replace(/[^0-9.-]+/g, ""));
    if (isNaN(num)) return value;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

const columnHelper = createColumnHelper<any>();

export default function ClientPurchasedTradelinesTable() {
  const { user } = useAuth();
  const [sorting, setSorting] = useState<SortingState>([]);

  const { tradelines, isLoading, error } = useUserTradelines(user?.uid);

  const columns = useMemo(
    () => [
      columnHelper.accessor("image", {
        header: () => null,
        cell: (info) =>
          info.getValue() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={info.getValue()}
              alt={info.row.original.bank_name}
              style={{ width: 50 }}
            />
          ) : null,
        enableSorting: false,
      }),
      columnHelper.accessor("bank_name", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Bank Name" />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("card_id", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Card ID" />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("credit_limit_original", {
        id: "credit_limit",
        header: ({ column }) => (
          <SortableHeader column={column} title="Credit Limit" />
        ),
        cell: (info) => formatCurrency(info.row.original.credit_limit_original),
      }),
      columnHelper.accessor("createdAt", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Purchased On" />
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor("quantity", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Quantity" />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("grandTotal", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Total Paid" />
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("status", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Status" />
        ),
        cell: (info) => {
          const val = info.getValue() || "pending";
          const colorClass =
            val === "approved" || val === "completed"
              ? "bg-green-100 text-green-800"
              : val === "rejected" || val === "failed"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800";
          return (
            <Badge variant="outline" className={`capitalize ${colorClass}`}>
              {val}
            </Badge>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: tradelines,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-4">
      {isLoading && <Spinner displayText="Loading data..." />}
      {error && <p className="text-center text-red-600">Error loading data</p>}
      {!isLoading && !error && (
        <>
          <div className="rounded-md border hidden md:flex">
            <ScrollArea
              type="always"
              className="w-1 flex-1 h-[calc(100vh-280px)] min-h-[400px]"
            >
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-gray-100">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          className="whitespace-nowrap"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No purchased tradelines found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id} className="hover:bg-gray-50">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="whitespace-nowrap"
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <ScrollBar orientation="horizontal" className="w-full" />
            </ScrollArea>
          </div>
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {table.getRowModel().rows.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No purchased tradelines found.
                </CardContent>
              </Card>
            ) : (
              table.getRowModel().rows.map((row) => {
                const mobileLabels: Record<string, string> = {
                  bank_name: "Bank Name",
                  card_id: "Card ID",
                  credit_limit: "Credit Limit",
                  createdAt: "Purchased On",
                  quantity: "Quantity",
                  grandTotal: "Total Paid",
                  status: "Status",
                };

                return (
                  <Card key={row.id}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      {row.getVisibleCells().map((cell) => {
                        const columnId = cell.column.id;

                        if (columnId === "image") {
                          return null;
                        }

                        return (
                          <div
                            key={cell.id}
                            className="flex justify-between items-center py-2 border-b last:border-0 last:pb-0"
                          >
                            <span className="text-sm font-medium text-muted-foreground mr-4">
                              {mobileLabels[columnId] || columnId}
                            </span>
                            <span className="text-sm font-medium text-right break-words">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
