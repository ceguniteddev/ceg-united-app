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
import { ArrowUpDown, BanknoteIcon, Loader2Icon, User } from "lucide-react";

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
import CategoryBadge from "../CategoryBadge";
import { BankFormData } from "@/schema/bank-products";
import SortableHeader from "@/components/SortableHeader";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ApplyFundingForm from "@/components/funding/ApplyFundingForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ApplyFundingSuccessful from "@/app/(client)/my-funding/_funding/ApplyFundingSuccessful";
import { useAuth } from "@/provider/AuthContext";
import { useApprovedMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";

const baseColumns: ColumnDef<BankFormData>[] = [
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
          {" "}
          {/* gap-1 adds a small space between items */}
          {productNames.map((name, index) => (
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
  {
    accessorKey: "maximumFundingAmount",
    id: "maximumFundingAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Maximum Funding Amount" />
    ),
    cell: ({ row }) => (
      <div>{formatAmount(row.getValue("maximumFundingAmount"))}</div>
    ),
  },
  {
    accessorKey: "clientApplicationStatus",
    id: "clientApplicationStatus",
    header: ({ column }) => (
      <SortableHeader column={column} title="Client Application Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("clientApplicationStatus") as string;
      return status ? <CategoryBadge category={status} /> : null;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
    size: 80,
  },
];

type Props = {
  appliedFunding: BankFormData[] | undefined;
  isAdminView?: boolean;
};

const FundingList = ({ appliedFunding, isAdminView }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns = React.useMemo(
    () => baseColumns.filter((c) => (isAdminView ? c.id !== "actions" : true)),
    [isAdminView]
  );

  const table = useReactTable({
    data: appliedFunding || [],
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
export default FundingList;

const ActionCell = ({ row }: { row: any }) => {
  const { applyApprovedMappedFund, isApplying } =
    useApprovedMappedFundsMutation();

  const handleApproveClickCapture = async () => {
    await applyApprovedMappedFund({
      fundMappingApprovedId: row.original.fundMappingApprovedId,
      referenceNumber: row.original.referenceNumber,
    });
  };

  if (row.original.clientApplicationStatus !== "Not Applied") return null;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        className="bg-green-200 hover:bg-green-400 cursor-pointer"
        onClick={() => handleApproveClickCapture()}
      >
        {isApplying ? (
          <>
            <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <BanknoteIcon className="mr-2 h-4 w-4" /> Apply
          </>
        )}
      </Button>
    </>
  );
};
