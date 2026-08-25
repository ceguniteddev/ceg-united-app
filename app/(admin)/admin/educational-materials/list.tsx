"use client";
import { DataTablePagination } from "@/components/funding/pagination";
import { Button } from "@/components/ui/button";
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
import { View } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import IconMenu from "@/components/icon-menu";
import SortableHeader from "@/components/SortableHeader";
import CategoryBadge from "@/components/CategoryBadge";
import { useRouter } from "next/navigation";
import React from "react";
import { Course } from "@/schema/educational-materials/course";

const columns: ColumnDef<Course>[] = [
  {
    accessorKey: "title",
    id: "title",
    header: ({ column }) => (
      <SortableHeader column={column} title="Course Name" />
    ),

    cell: ({ row }) => <div>{row.getValue("title")}</div>,
  },
  {
    accessorKey: "category",
    id: "category",
    header: ({ column }) => <SortableHeader column={column} title="Category" />,
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },
  {
    accessorKey: "price",
    id: "price",
    header: ({ column }) => <SortableHeader column={column} title="Price" />,
    cell: ({ row }) => {
      const isFree = row.original.isFree;
      const price = row.original.price;
      const discountPrice = row.original.discountPrice;
      if (isFree) {
        return (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
            Free
          </span>
        );
      }
      return (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-bold text-gray-900">
            $
            {(discountPrice ?? price ?? 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          {discountPrice != null && discountPrice < (price || 0) && (
            <span className="line-through text-gray-400">
              $
              {(price || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "averageRating",
    id: "averageRating",
    header: ({ column }) => <SortableHeader column={column} title="Rating" />,
    cell: ({ row }) => {
      const rating = row.original.averageRating || 5.0;
      const count = row.original.totalRatingsCount || 0;
      return (
        <div className="flex items-center gap-1 text-xs font-medium text-amber-600">
          <span>★ {rating.toFixed(1)}</span>
          <span className="text-gray-400">({count})</span>
        </div>
      );
    },
  },
  {
    accessorKey: "isPublished",
    id: "isPublished",
    header: ({ column }) => (
      <SortableHeader column={column} title="Is Published" />
    ),
    cell: ({ row }) => {
      const isPublished = row.getValue("isPublished");
      const status = isPublished ? "Published" : "Unpublished";
      return <CategoryBadge category={status} />;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
    size: 80,
  },
];

const CoursesList = ({ courses }: { courses?: any }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: courses || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getColumnCanGlobalFilter: (column) => {
      return true;
    },
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
          placeholder="Filter courses..."
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
            const isPublished = data.isPublished;
            const status = isPublished ? "Published" : "Unpublished";

            return (
              <div
                key={row.id}
                className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm break-words">
                      {data.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {data.category}
                    </p>
                  </div>
                  <CategoryBadge category={status} />
                </div>

                <div className="pt-2 border-t">
                  <ActionCell row={row} />
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
      </div>
      <DataTablePagination table={table} />
    </div>
  );
};

export default CoursesList;

const ActionCell = ({ row }: { row: any }) => {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size={"sm"}
      className="cursor-pointer bg-blue-200 hover:bg-blue-300 w-full sm:w-auto h-10 sm:h-9"
      onClick={() =>
        router.push(`/admin/educational-materials/courses/${row.original.id}`)
      }
    >
      <IconMenu text="View" icon={<View className="h-4 w-4" />} />
    </Button>
  );
};
