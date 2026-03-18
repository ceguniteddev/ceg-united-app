"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  useAllPurchasedTradelines,
  useUpdateTradelineStatus,
} from "@/hooks/tradelines";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmModal } from "@/components/confirm-modal";
import Spinner from "./Spinner";
import { Textarea } from "./ui/textarea";

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

function AdminActionCell({
  row,
  updateStatus,
  isPending,
}: {
  row: any;
  updateStatus: (data: { id: string; status: string; reason?: string }) => void;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const status = row.status || "pending";

  if (status !== "pending") return <span className="text-gray-400">-</span>;

  const clientName = row.user
    ? `${row.user.firstName} ${row.user.lastName}`
    : "Unknown Client";

  const approvalDescription = (
    <div className="space-y-4 text-left mt-4">
      <div className="font-medium text-foreground">
        Are you sure you want to approve this tradeline purchase?
      </div>
      <div className="border rounded-md p-4 bg-gray-50 text-sm">
        <ul className="space-y-2 list-none p-0 m-0">
          <li>
            <span className="font-semibold">Client Name:</span> {clientName}
          </li>
          <li>
            <span className="font-semibold">Bank Name:</span> {row.bank_name}
          </li>
          <li>
            <span className="font-semibold">Card ID:</span> {row.card_id}
          </li>
          <li>
            <span className="font-semibold">Credit Limit:</span>{" "}
            {formatCurrency(row.credit_limit_original || row.credit_limit)}
          </li>
          <li>
            <span className="font-semibold">Date Opened:</span>{" "}
            {row.date_opened}
          </li>
          <li>
            <span className="font-semibold">Reporting Date:</span>{" "}
            {row.reporting_period}
          </li>
          <li>
            <span className="font-semibold">Quantity:</span> {row.quantity}
          </li>
          <li>
            <span className="font-semibold">Unit Price:</span>{" "}
            {formatCurrency(row.finalPrice)}
          </li>
          <li className="pt-2 mt-2 border-t font-bold text-green-700">
            <span>Grand Total:</span> {formatCurrency(row.grandTotal)}
          </li>
        </ul>
      </div>
    </div>
  );

  const declineDescription = (
    <div className="space-y-4 text-left mt-4">
      <div className="font-medium text-foreground">
        Are you sure you want to decline this tradeline purchase?
      </div>
      <div className="border rounded-md p-4 bg-gray-50 text-sm">
        <ul className="space-y-2 list-none p-0 m-0">
          <li>
            <span className="font-semibold">Client Name:</span> {clientName}
          </li>
          <li>
            <span className="font-semibold">Bank Name:</span> {row.bank_name}
          </li>
          <li>
            <span className="font-semibold">Card ID:</span> {row.card_id}
          </li>
          <li>
            <span className="font-semibold">Credit Limit:</span>{" "}
            {formatCurrency(row.credit_limit_original || row.credit_limit)}
          </li>
          <li>
            <span className="font-semibold">Date Opened:</span>{" "}
            {row.date_opened}
          </li>
          <li>
            <span className="font-semibold">Reporting Date:</span>{" "}
            {row.reporting_period}
          </li>
          <li>
            <span className="font-semibold">Quantity:</span> {row.quantity}
          </li>
          <li>
            <span className="font-semibold">Unit Price:</span>{" "}
            {formatCurrency(row.finalPrice)}
          </li>
          <li className="pt-2 mt-2 border-t font-bold text-green-700">
            <span>Grand Total:</span> {formatCurrency(row.grandTotal)}
          </li>
        </ul>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Reason for decline:</label>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason..."
          className="w-full"
        />
      </div>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <ConfirmModal
        onConfirm={() => updateStatus({ id: row.id, status: "approved" })}
        description={approvalDescription}
      >
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={isPending}
        >
          Approve
        </Button>
      </ConfirmModal>

      <ConfirmModal
        onConfirm={() => {
          updateStatus({ id: row.id, status: "rejected", reason });
          setReason("");
        }}
        description={declineDescription}
      >
        <Button size="sm" variant="destructive" disabled={isPending}>
          Decline
        </Button>
      </ConfirmModal>
    </div>
  );
}

export default function AdminPurchasedTradelinesTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { tradelines, isLoading, error } = useAllPurchasedTradelines();
  const { updateStatus, isPending } = useUpdateTradelineStatus();

  const columns = useMemo(
    () => [
      columnHelper.accessor("user", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Client Name" />
        ),
        cell: (info) => {
          const user = info.getValue();
          return user ? `${user.firstName} ${user.lastName}` : "Unknown Client";
        },
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
      columnHelper.accessor("createdAt", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Purchased On" />
        ),
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.accessor("quantity", {
        header: ({ column }) => <SortableHeader column={column} title="Qty" />,
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor("finalPrice", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Unit Price" />
        ),
        cell: (info) => formatCurrency(info.getValue()),
      }),
      columnHelper.accessor("grandTotal", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Grand Total" />
        ),
        cell: (info) => formatCurrency(info.getValue()),
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
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <AdminActionCell
            row={info.row.original}
            updateStatus={updateStatus}
            isPending={isPending}
          />
        ),
      }),
    ],
    [updateStatus, isPending],
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
                  client: "Client Name",
                  bank_name: "Bank Name",
                  card_id: "Card ID",
                  createdAt: "Purchased On",
                  quantity: "Qty",
                  finalPrice: "Unit Price",
                  grandTotal: "Grand Total",
                  status: "Status",
                  actions: "Actions",
                };

                return (
                  <Card key={row.id}>
                    <CardContent className="p-4 flex flex-col gap-3">
                      {row.getVisibleCells().map((cell) => {
                        const columnId = cell.column.id;

                        if (columnId === "actions") {
                          const status = row.original.status;
                          if (status !== "pending") return null;

                          return (
                            <div
                              key={cell.id}
                              className="pt-2 mt-2 border-t flex flex-col gap-2"
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </div>
                          );
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
