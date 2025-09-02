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
import { DataTablePagination } from "./pagination";
import { ApplyFundingWithUser } from "@/schema/apply-funding";
import { cn, formatAmount, formatDateTime } from "@/lib/utils";
import { transactionCategoryStyles } from "@/constant/common";

export const columns: ColumnDef<ApplyFundingWithUser>[] = [
  {
    accessorKey: "referenceNumber",
    id: "referenceNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Reference Number <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("referenceNumber")}</div>;
    },
  },
  {
    accessorKey: "name",
    id: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) return <div className="text-muted-foreground">Unknown</div>;

      return (
        <div>
          {user.firstName} {user.lastName}
        </div>
      );
    },
  },
  {
    id: "interestedProduct",
    accessorKey: "interestedProduct",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Product <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("interestedProduct")}</div>;
    },
  },
  {
    id: "amountFunding",
    accessorKey: "amountFunding",
    header: ({ column }) => (
      <div className="flex w-full justify-end">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Amount <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div className="text-right">{formatAmount(row.getValue("amountFunding"))}</div>;
    },
  },
  {
    id: "appliedDate",
    accessorKey: "appliedDate",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Applied Date <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const raw = row.getValue("appliedDate") as string | Date;
      const date = new Date(raw);

      return <div>{formatDateTime(date).dateTime}</div>;
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
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   cell: ({ row }) => {
  //     return (
  //       <Button variant={"outline"}>
  //         <Link href={`/admin/dashboard/${encodeURIComponent(row.original.id)}`}>
  //           <IconMenu icon={<FolderSearch2Icon />} text="View" />
  //         </Link>
  //       </Button>
  //     );
  //   },
  // },
];

type Props = {
  appliedFunding: ApplyFundingWithUser[] | undefined;
  rowActions: (data: ApplyFundingWithUser) => React.ReactNode;
};

const FundingList = ({ appliedFunding, rowActions }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const actionColumn: ColumnDef<ApplyFundingWithUser> = {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => rowActions(row.original),
  };

  const table = useReactTable({
    data: appliedFunding || [],
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

  React.useEffect(() => {
    const hasUser = appliedFunding?.some((row) => row.user);
    table.getColumn("name")?.toggleVisibility(!!hasUser);
  }, [appliedFunding, table]);
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <DataTablePagination table={table} />
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
export default FundingList;

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const { borderColor, backgroundColor, textColor, chipBackgroundColor } =
    transactionCategoryStyles[category as keyof typeof transactionCategoryStyles] ||
    transactionCategoryStyles.default;

  return (
    <div className={cn("category-badge", borderColor, chipBackgroundColor)}>
      <div className={cn("size-2 rounded-full", backgroundColor)} />
      <p className={cn("text-[12px] font-medium", textColor)}>{category}</p>
    </div>
  );
};
