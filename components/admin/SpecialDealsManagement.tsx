"use client";

import { useState, useMemo } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  getPaginationRowModel,
  type SortingState,
} from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Power, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Spinner from "@/components/Spinner";
import { DataTablePagination } from "@/components/funding/pagination";
import { SortableHeader } from "@/components/SortableHeader";
import {
  useSpecialDeals,
  useCreateSpecialDeal,
  useUpdateSpecialDeal,
  useToggleSpecialDeal,
  useDeleteSpecialDeal,
} from "@/hooks/special-deals";
import { SpecialDealDialog } from "./SpecialDealDialog";
import { getTimeLeft } from "@/lib/utils";
import type { SpecialDeal, SpecialDealForm } from "@/schema/special-deals";

const columnHelper = createColumnHelper<SpecialDeal>();

export default function SpecialDealsManagement() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<SpecialDeal | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);

  const { data: deals = [], isLoading } = useSpecialDeals();
  const createDeal = useCreateSpecialDeal();
  const updateDeal = useUpdateSpecialDeal();
  const toggleDeal = useToggleSpecialDeal();
  const deleteDeal = useDeleteSpecialDeal();

  const handleCreateNew = () => {
    setSelectedDeal(null);
    setDialogOpen(true);
  };

  const handleEdit = (deal: SpecialDeal) => {
    setSelectedDeal(deal);
    setDialogOpen(true);
  };

  const handleSave = (data: SpecialDealForm) => {
    if (selectedDeal) {
      updateDeal.mutate(
        { dealId: selectedDeal.id!, data },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setSelectedDeal(null);
          },
        },
      );
    } else {
      createDeal.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false);
        },
      });
    }
  };

  const handleToggle = (dealId: string, currentStatus: boolean) => {
    toggleDeal.mutate({ dealId, isActive: !currentStatus });
  };

  const handleDeleteClick = (dealId: string) => {
    setDealToDelete(dealId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (dealToDelete) {
      deleteDeal.mutate(dealToDelete, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setDealToDelete(null);
        },
      });
    }
  };

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
              className="w-12 h-12 object-cover rounded"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <Tag className="w-5 h-5 text-gray-400" />
            </div>
          ),
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
      columnHelper.accessor("credit_limit", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Credit Limit" />
        ),
        cell: (info) => `$${info.getValue().toLocaleString()}`,
      }),
      columnHelper.accessor("stock", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Stock" />
        ),
        cell: (info) => {
          const val = info.getValue();
          return (
            <span
              className={
                val === 0
                  ? "text-red-500 font-medium"
                  : val <= 2
                    ? "text-amber-500 font-medium"
                    : "text-green-600 font-medium"
              }
            >
              {val}
            </span>
          );
        },
      }),
      columnHelper.accessor("tag", {
        header: "Tag",
        cell: (info) => (
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("discountPercent", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Discount" />
        ),
        cell: (info) => (
          <span className="text-red-600 font-semibold">{info.getValue()}%</span>
        ),
      }),
      columnHelper.accessor("salePrice", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Sale Price" />
        ),
        cell: (info) => (
          <span className="font-mono font-semibold text-red-600">
            ${info.getValue().toFixed(2)}
          </span>
        ),
      }),
      columnHelper.accessor("expiresAt", {
        header: "Expires",
        cell: (info) => {
          const value = info.getValue();
          const dateStr = value instanceof Date ? value.toISOString() : value;
          const timeLeft = getTimeLeft(dateStr);
          const isExpired = timeLeft === "Expired";
          return (
            <span
              className={`text-xs font-medium ${isExpired ? "text-red-500" : "text-amber-600"}`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              {timeLeft}
            </span>
          );
        },
      }),
      columnHelper.accessor("isActive", {
        header: "Status",
        cell: (info) => (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              info.getValue()
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-700 border border-gray-200"
            }`}
          >
            {info.getValue() ? "Active" : "Inactive"}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() =>
                handleToggle(info.row.original.id!, info.row.original.isActive)
              }
              title={info.row.original.isActive ? "Deactivate" : "Activate"}
            >
              <Power
                className={`w-4 h-4 ${info.row.original.isActive ? "text-green-600" : "text-gray-400"}`}
              />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit(info.row.original)}
              title="Edit"
            >
              <Pencil className="w-4 h-4 text-blue-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteClick(info.row.original.id!)}
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </Button>
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: deals,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return <Spinner displayText="Loading special deals..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">Special Deals Management</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage discounted tradeline deals
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="w-4 h-4 mr-2" />
          Create Deal
        </Button>
      </div>

      {/* Desktop Table */}
      <div className="rounded-md border hidden md:flex">
        <ScrollArea
          type="always"
          className="w-1 flex-1 h-[calc(100vh-350px)] min-h-[400px]"
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-100">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap">
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
                    className="h-24 text-center text-muted-foreground"
                  >
                    No special deals yet. Click "Create Deal" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50">
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
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" className="w-full" />
        </ScrollArea>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {deals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No special deals yet. Click "Create Deal" to get started.
            </CardContent>
          </Card>
        ) : (
          deals.map((deal) => {
            const expiresAtStr =
              deal.expiresAt instanceof Date
                ? deal.expiresAt.toISOString()
                : deal.expiresAt;
            const timeLeft = getTimeLeft(expiresAtStr);
            const isExpired = timeLeft === "Expired";

            return (
              <Card key={deal.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {deal.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={deal.image}
                        alt={deal.bank_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        <Tag className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">
                        {deal.bank_name}
                      </h4>
                      <p className="text-xs text-gray-500 font-mono">
                        Card ID: {deal.card_id}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {deal.tag}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            deal.isActive
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {deal.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Credit Limit</span>
                      <p className="font-semibold">
                        ${deal.credit_limit.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Stock</span>
                      <p
                        className={`font-semibold ${
                          deal.stock === 0
                            ? "text-red-500"
                            : deal.stock <= 2
                              ? "text-amber-500"
                              : "text-green-600"
                        }`}
                      >
                        {deal.stock}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Discount</span>
                      <p className="font-semibold text-red-600">
                        {deal.discountPercent}% OFF
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Sale Price</span>
                      <p className="font-semibold text-red-600">
                        ${deal.salePrice.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex items-center gap-2 text-xs font-medium p-2 rounded ${isExpired ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}
                  >
                    <Clock className="w-4 h-4" />
                    {timeLeft}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggle(deal.id!, deal.isActive)}
                      className="flex-1"
                    >
                      <Power
                        className={`w-4 h-4 mr-2 ${deal.isActive ? "text-green-600" : "text-gray-400"}`}
                      />
                      {deal.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(deal)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(deal.id!)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {deals.length > 0 && <DataTablePagination table={table} />}

      {/* Dialogs */}
      <SpecialDealDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedDeal(null);
        }}
        onSave={handleSave}
        deal={selectedDeal}
        isLoading={createDeal.isPending || updateDeal.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Special Deal</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this special deal? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setDeleteDialogOpen(false);
                setDealToDelete(null);
              }}
              disabled={deleteDeal.isPending}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteDeal.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteDeal.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
