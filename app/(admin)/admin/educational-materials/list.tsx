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
import { BankFormData } from "@/schema/bank-products";
import SortableHeader from "@/components/SortableHeader";
import CategoryBadge from "@/components/CategoryBadge";
import { useRouter } from "next/navigation";
import React from "react";

const columns: ColumnDef<BankFormData>[] = [
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
    []
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
      <div className="overflow-hidden rounded-md border">
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

export default CoursesList;

const ActionCell = ({ row }: { row: any }) => {
  const router = useRouter();

  return (
    <Button
      variant="ghost"
      size={"sm"}
      className="cursor-pointer bg-blue-200 hover:bg-blue-300"
      onClick={() =>
        router.push(`/admin/educational-materials/courses/${row.original.id}`)
      }
    >
      <IconMenu text="View" icon={<View className="h-4 w-4" />} />
    </Button>
  );
};
