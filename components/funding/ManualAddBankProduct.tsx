"use client";

import { useState, useMemo, useEffect } from "react";
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
import { BankFormData, CreditBureauEnum } from "@/schema/bank-products";
import { toast } from "sonner";
import SortableHeader from "@/components/SortableHeader";
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
import { DataTablePagination } from "@/components/funding/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { US_STATES } from "@/constant/common";

type Props = {
  referenceNumber: string;
  userId: string;
  onAdd: (selectedIds: string[]) => Promise<void>;
  isAdding: boolean;
  excludeIds?: string[]; // IDs of already mapped products to exclude
};

const bureauFilterFn: FilterFn<BankFormData> = (row, columnId, filterValue) => {
  const value = row.getValue<string>(columnId);
  const selectedFilter = String(filterValue);
  if (!selectedFilter || selectedFilter === "all") return true;
  return value.includes(selectedFilter);
};

const stateFilterFn: FilterFn<BankFormData> = (row, columnId, filterValue) => {
  const value = row.getValue<string>(columnId);
  const selectedFilter = String(filterValue);
  if (!selectedFilter || selectedFilter === "all") return true;
  return value.includes(selectedFilter) || value.includes("Nationwide");
};

const productNameFilterFn: FilterFn<BankFormData> = (
  row,
  columnId,
  filterValue,
) => {
  const value = row.getValue<string>(columnId);
  const selectedFilter = String(filterValue);
  if (!selectedFilter || selectedFilter === "all") return true;
  return value.includes(selectedFilter);
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
  const [bureauFilter, setBureauFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [productNameFilter, setProductNameFilter] = useState("all");

  // Filter out already mapped products
  const availableProducts = useMemo(() => {
    return products.filter((product) => !excludeIds.includes(product.id || ""));
  }, [products, excludeIds]);

  // Get unique product names for the filter dropdown
  const uniqueProductNames = useMemo(() => {
    const productNames = new Set<string>();
    availableProducts.forEach((bank) => {
      bank.products?.forEach((product) => {
        if (product.productName) {
          productNames.add(product.productName);
        }
      });
    });
    return Array.from(productNames).sort();
  }, [availableProducts]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
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
        cell: ({ row }) => (
          <div className="max-w-[200px] break-words whitespace-normal font-medium">
            {row.getValue("bankName")}
          </div>
        ),
      },
      {
        id: "bureau",
        accessorFn: (row) => {
          const products = row.products || [];
          const bureaus = products
            .map((p) => {
              if (Array.isArray(p.creditBureauPulled)) {
                return p.creditBureauPulled.join(", ");
              }
              return p.creditBureauPulled || "";
            })
            .filter(Boolean);

          const uniqueBureaus = Array.from(
            new Set(bureaus.join(", ").split(", ")),
          ).filter(Boolean);
          return uniqueBureaus.join(", ");
        },
        header: ({ column }) => (
          <SortableHeader column={column} title="Bureau" />
        ),
        cell: ({ row }) => {
          const products = row.original.products || [];
          const bureaus = products
            .map((p) => {
              if (Array.isArray(p.creditBureauPulled)) {
                return p.creditBureauPulled.join(", ");
              }
              return p.creditBureauPulled || "";
            })
            .filter(Boolean);

          const uniqueBureaus = Array.from(
            new Set(bureaus.join(", ").split(", ")),
          ).filter(Boolean);

          return (
            <div className="flex flex-wrap gap-1">
              {uniqueBureaus.map((bureau, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700"
                >
                  {bureau}
                </span>
              ))}
            </div>
          );
        },
        filterFn: bureauFilterFn,
      },
      {
        id: "stateAvailability",
        accessorFn: (row) => {
          const products = row.products || [];
          const states = products
            .map((p) => {
              if (Array.isArray(p.stateAvailability)) {
                return p.stateAvailability.join(", ");
              }
              return p.stateAvailability || "";
            })
            .filter(Boolean);

          const uniqueStates = Array.from(
            new Set(states.join(", ").split(", ")),
          ).filter(Boolean);
          return uniqueStates.join(", ");
        },
        header: ({ column }) => (
          <SortableHeader column={column} title="State" />
        ),
        cell: ({ row }) => {
          const products = row.original.products || [];
          const states = products
            .map((p) => {
              if (Array.isArray(p.stateAvailability)) {
                return p.stateAvailability.join(", ");
              }
              return p.stateAvailability || "";
            })
            .filter(Boolean);

          const uniqueStates = Array.from(
            new Set(states.join(", ").split(", ")),
          ).filter(Boolean);

          return (
            <div className="flex flex-wrap gap-1">
              {uniqueStates.slice(0, 3).map((state, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700"
                >
                  {state}
                </span>
              ))}
              {uniqueStates.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{uniqueStates.length - 3}
                </span>
              )}
            </div>
          );
        },
        filterFn: stateFilterFn,
      },
      {
        id: "products",
        accessorFn: (row) => {
          const products = row.products || [];
          const productNames = products
            .map((p) => p.productName)
            .filter(Boolean);
          return productNames.join(", ");
        },
        header: ({ column }) => (
          <SortableHeader column={column} title="Product Name" />
        ),
        cell: ({ row }) => {
          const products = row.original.products;
          return (
            <div className="flex flex-col gap-1">
              {products?.map((product, index) => (
                <span key={index}>{product.productName}</span>
              ))}
            </div>
          );
        },
        filterFn: productNameFilterFn,
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
    [availableProducts, selectedIds],
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

  useEffect(() => {
    const col = table.getColumn("bureau");
    if (!col) return;
    if (bureauFilter === "all") col.setFilterValue(undefined);
    else col.setFilterValue(bureauFilter);
  }, [bureauFilter, table]);

  useEffect(() => {
    const col = table.getColumn("stateAvailability");
    if (!col) return;
    if (stateFilter === "all") col.setFilterValue(undefined);
    else col.setFilterValue(stateFilter);
  }, [stateFilter, table]);

  useEffect(() => {
    const col = table.getColumn("products");
    if (!col) return;
    if (productNameFilter === "all") col.setFilterValue(undefined);
    else col.setFilterValue(productNameFilter);
  }, [productNameFilter, table]);

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
      <div className="sticky top-0 bg-white z-10 pb-3 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Bureau Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Bureau
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between"
                >
                  <span className="text-sm">
                    {bureauFilter === "all" ? "All Bureaus" : bureauFilter}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuRadioGroup
                  value={bureauFilter}
                  onValueChange={setBureauFilter}
                >
                  <DropdownMenuRadioItem value="all">
                    All Bureaus
                  </DropdownMenuRadioItem>
                  {CreditBureauEnum.options.map((bureau) => (
                    <DropdownMenuRadioItem key={bureau} value={bureau}>
                      {bureau}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* State Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              State
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between"
                >
                  <span className="text-sm">
                    {stateFilter === "all"
                      ? "All States"
                      : US_STATES.find((s) => s.value === stateFilter)?.label ||
                        stateFilter}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[200px] max-h-[300px] overflow-y-auto"
              >
                <DropdownMenuRadioGroup
                  value={stateFilter}
                  onValueChange={setStateFilter}
                >
                  <DropdownMenuRadioItem value="all">
                    All States
                  </DropdownMenuRadioItem>
                  {US_STATES.map((state) => (
                    <DropdownMenuRadioItem
                      key={state.value}
                      value={state.value}
                    >
                      {state.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Product Name Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Product Name
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between"
                >
                  <span className="text-sm truncate">
                    {productNameFilter === "all"
                      ? "All Products"
                      : productNameFilter}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 opacity-50 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[250px] max-h-[300px] overflow-y-auto"
              >
                <DropdownMenuRadioGroup
                  value={productNameFilter}
                  onValueChange={setProductNameFilter}
                >
                  <DropdownMenuRadioItem value="all">
                    All Products
                  </DropdownMenuRadioItem>
                  {uniqueProductNames.map((productName) => (
                    <DropdownMenuRadioItem
                      key={productName}
                      value={productName}
                    >
                      {productName}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
                    {/* <p className="text-xs text-muted-foreground mt-1">
                      {data.financingTerm}
                    </p> */}
                  </div>
                </div>

                <div className="pl-8 space-y-1">
                  <span className="text-muted-foreground text-xs block mb-1">
                    Product Names:
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {data.products?.map((product, index) => (
                      <span key={index} className="text-xs">
                        {product.productName}
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
                          header.getContext(),
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
