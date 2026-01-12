"use client";

import { useState, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import Spinner from "@/components/Spinner";
import { useBankProductsQuery } from "@/hooks/admin/bank-products";
import { BankFormData } from "@/schema/bank-products";
import { toast } from "sonner";
import SortableHeader from "@/components/SortableHeader";
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
import { DataTablePagination } from "@/components/funding/pagination";

type Props = {
  referenceNumber: string;
  userId: string;
  onAdd: (selectedIds: string[]) => Promise<void>;
  isAdding: boolean;
  excludeIds?: string[]; // IDs of already mapped products to exclude
};

const ManualAddBankProduct = ({
  referenceNumber,
  userId,
  onAdd,
  isAdding,
  excludeIds = [],
}: Props) => {
  const { products = [], isLoading } = useBankProductsQuery();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Filter out already mapped products
  const availableProducts = useMemo(() => {
    return products.filter((product) => !excludeIds.includes(product.id || ""));
  }, [products, excludeIds]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(availableProducts.map((p) => p.id || "").filter(Boolean));
    } else {
      setSelectedIds([]);
    }
  };

  const handleAdd = async () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one bank product.");
      return;
    }

    await onAdd(selectedIds);
    setSelectedIds([]);
  };

  const columns: ColumnDef<BankFormData>[] = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              availableProducts.length > 0 &&
              selectedIds.length === availableProducts.length
            }
            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.includes(row.original.id || "")}
            onCheckedChange={() => handleToggleSelect(row.original.id || "")}
            aria-label="Select row"
          />
        ),
        size: 50,
      },
      {
        accessorKey: "bankName",
        id: "bankName",
        header: ({ column }) => (
          <SortableHeader column={column} title="Bank Name" />
        ),
        cell: ({ row }) => <div>{row.getValue("bankName")}</div>,
      },
      {
        accessorKey: "productName",
        id: "productName",
        header: ({ column }) => (
          <SortableHeader column={column} title="Product Name" />
        ),
        cell: ({ row }) => {
          const productNames = row.getValue("productName") as string[];
          return (
            <div className="flex flex-col gap-1">
              {productNames?.map((name, index) => (
                <span key={index}>{name}</span>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "financingTerm",
        id: "financingTerm",
        header: ({ column }) => (
          <SortableHeader column={column} title="Financing Term" />
        ),
        cell: ({ row }) => <div>{row.getValue("financingTerm")}</div>,
      },
    ],
    [availableProducts, selectedIds]
  );

  const table = useReactTable({
    data: availableProducts || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getColumnCanGlobalFilter: () => true,
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

  if (isLoading) {
    return <Spinner displayText="Loading bank products..." />;
  }

  if (availableProducts.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        No available bank products to add. All products are already mapped.
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sticky top-0 bg-white z-10 pb-3">
        <Input
          placeholder="Filter bank products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-sm h-10 sm:h-9"
        />
        <div className="text-xs sm:text-sm text-muted-foreground">
          {selectedIds.length} of {availableProducts.length} selected
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const data = row.original;
            const isSelected = selectedIds.includes(data.id || "");

            return (
              <div
                key={row.id}
                className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleToggleSelect(data.id || "")}
                    aria-label="Select product"
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm break-words">
                      {data.bankName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.financingTerm}
                    </p>
                  </div>
                </div>

                <div className="pl-8 space-y-1">
                  <span className="text-muted-foreground text-xs block mb-1">
                    Product Names:
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {(data.productName as string[])?.map((name, index) => (
                      <span key={index} className="text-xs">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
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
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
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

      <div className="flex justify-end gap-2 pt-4">
        <Button
          onClick={handleAdd}
          disabled={isAdding || selectedIds.length === 0}
          className="w-full sm:w-auto h-10 sm:h-9"
        >
          {isAdding ? "Adding..." : `Add Selected (${selectedIds.length})`}
        </Button>
      </div>
    </div>
  );
};

export default ManualAddBankProduct;
