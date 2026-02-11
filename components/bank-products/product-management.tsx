"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FundingProduct,
  fundingProductSchema,
} from "@/schema/funding-products";
import { getFundingApplicationType } from "@/schema/apply-funding";
import {
  useFundingProductMutation,
  useFundingProducts,
} from "@/hooks/admin/funding-product";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { CustomFormField } from "@/components/CustomFormField";
import IconMenu from "@/components/icon-menu";
import {
  Loader2,
  Save,
  Pencil,
  Trash2,
  XCircle,
  Check,
  Plus,
  MoreHorizontal,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import Spinner from "@/components/Spinner";
import { Input } from "@/components/ui/input";
import SortableHeader from "@/components/SortableHeader";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

const defaultValues: FundingProduct = {
  productName: "",
  fundingType: undefined as any,
};

const ProductManagement = () => {
  const { createFundingProduct, isCreating, updateFundingProduct, isUpdating } =
    useFundingProductMutation();

  const [editingProduct, setEditingProduct] = useState<FundingProduct | null>(
    null,
  );

  const form = useForm<FundingProduct>({
    resolver: zodResolver(fundingProductSchema),
    defaultValues,
  });

  useEffect(() => {
    if (editingProduct) {
      form.reset(editingProduct);
    }
  }, [editingProduct, form]);

  const handleCancelEdit = useCallback(() => {
    setEditingProduct(null);
    form.reset(defaultValues);
    form.clearErrors();
    // setTimeout(() => form.setFocus("productName"), 0);
  }, [form]);

  const onSubmit: SubmitHandler<FundingProduct> = useCallback(
    async (values) => {
      if (editingProduct) {
        await updateFundingProduct({ id: editingProduct.id!, values });
        setEditingProduct(null);
        form.reset(defaultValues);
      } else {
        await createFundingProduct(values);
        form.reset(defaultValues);
      }
    },
    [createFundingProduct, updateFundingProduct, editingProduct, form],
  );

  const isSubmitting = isCreating || isUpdating;
  const isEditing = !!editingProduct;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Product Management
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            {isEditing ? "Edit Product" : "Add New Product"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              aria-busy={isSubmitting}
            >
              <fieldset disabled={isSubmitting}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                  <CustomFormField
                    name="productName"
                    className="sm:col-span-2"
                    placeholder="e.g. Term Loan"
                    label="Product Name"
                  />

                  <CustomFormField
                    name="fundingType"
                    type="select"
                    placeholder="Select Type"
                    className="sm:col-span-2"
                    label="Funding Type"
                    options={getFundingApplicationType()}
                  />

                  <div className="sm:col-span-2 flex items-center gap-2">
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        className="flex-1 sm:flex-none"
                        onClick={handleCancelEdit}
                      >
                        <IconMenu
                          icon={<XCircle className="h-4 w-4" />}
                          text="Cancel"
                        />
                      </Button>
                    )}

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isSubmitting ? (
                        <IconMenu
                          icon={<Loader2 className="h-4 w-4 animate-spin" />}
                          text={isEditing ? "Updating..." : "Saving..."}
                        />
                      ) : (
                        <IconMenu
                          icon={
                            isEditing ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )
                          }
                          text={isEditing ? "Update" : "Save"}
                        />
                      )}
                    </Button>
                  </div>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>

      <FundingProductsList
        onEdit={(product) => {
          setEditingProduct(product);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
};

// Internal List Component
const FundingProductsList = ({
  onEdit,
}: {
  onEdit: (product: FundingProduct) => void;
}) => {
  const { products, isLoading } = useFundingProducts();

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<FundingProduct>[] = useMemo(
    () => [
      {
        accessorKey: "productName",
        id: "productName",
        header: ({ column }) => (
          <SortableHeader column={column} title="Product Name" />
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("productName")}</div>
        ),
      },
      {
        accessorKey: "fundingType",
        id: "fundingType",
        header: ({ column }) => (
          <SortableHeader column={column} title="Funding Type" />
        ),
        cell: ({ row }) => (
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            {row.getValue("fundingType")}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => <ActionCell row={row} onEdit={onEdit} />,
        size: 80,
      },
    ],
    [onEdit],
  );

  const table = useReactTable({
    data: products || [],
    columns,
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

  if (isLoading) return <Spinner displayText="Loading products..." />;

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <Input
          placeholder="Filter products..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-sm h-10"
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <Card key={row.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex justify-between items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg font-bold truncate">
                      {row.getValue("productName")}
                    </CardTitle>
                  </div>
                  <ActionCell row={row} onEdit={onEdit} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200">
                  {row.getValue("fundingType")}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
            No products found.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
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
                    No products found.
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

const ActionCell = ({
  row,
  onEdit,
}: {
  row: any;
  onEdit: (product: FundingProduct) => void;
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { deleteFundingProduct, isDeleting, isDeleteSuccess } =
    useFundingProductMutation();

  const handleDelete = async () => {
    await deleteFundingProduct(row.original.id);
  };

  useEffect(() => {
    if (isDeleteSuccess && !isDeleting) {
      setIsDeleteOpen(false);
    }
  }, [isDeleteSuccess, isDeleting]);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[160px] z-50">
          <DropdownMenuItem className="p-0">
            <Button
              variant="ghost"
              className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
              onClick={() => onEdit(row.original)}
            >
              <IconMenu text="Edit" icon={<Pencil className="h-4 w-4" />} />
            </Button>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="p-0">
            <Button
              variant="ghost"
              className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
              onClick={() => setIsDeleteOpen(true)}
            >
              <IconMenu text="Delete" icon={<Trash2 className="h-4 w-4" />} />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isDeleteOpen && (
        <AlertDialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            if (!isDeleting) setIsDeleteOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{" "}
                <span className="font-semibold">
                  {row.original.productName}
                </span>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isDeleting}
                className="cursor-pointer"
              >
                <IconMenu text="Cancel" icon={<X className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleDelete();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <IconMenu
                    text="Deleting..."
                    icon={<Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu
                    text="Delete"
                    icon={<Trash2 className="h-4 w-4 mr-2" />}
                  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export default ProductManagement;
