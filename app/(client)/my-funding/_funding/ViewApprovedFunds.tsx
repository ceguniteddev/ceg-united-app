import {
  useApproveMappedFundsQuery,
  useFundingApplicationsMappedFundsQuery,
} from "@/hooks/admin/funding-application/fund-mapping";

import Spinner from "@/components/Spinner";
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
import { ArrowUpDown, CheckCircle, MoreHorizontal, ViewIcon } from "lucide-react";
import React, { useMemo, useState } from "react";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IconMenu from "@/components/icon-menu";

import { BankFormData } from "@/schema/bank-products";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import BankProductsForm from "@/app/(admin)/admin/bank-products/form";
import { formatAmount } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import CategoryBadge from "@/components/CategoryBadge";

type Props = { referenceNumber: string; setOpen?: React.Dispatch<React.SetStateAction<boolean>> };

const ApprovedFunds = ({ referenceNumber, setOpen }: Props) => {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Pre Approved Funds</h1>
      <BankProductsList referenceNumber={referenceNumber} />
    </div>
  );
};

export default ApprovedFunds;

const BankProductsList = ({ referenceNumber }: { referenceNumber: string }) => {
  const { approvedMappedFunds = [], isLoading } = useApproveMappedFundsQuery(referenceNumber);
  console.log(approvedMappedFunds);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<BankFormData>[] = useMemo(
    () => [
      {
        accessorKey: "bankName",
        id: "bankName",
        header: ({ column }) => <Label>Bank Name</Label>,
        cell: ({ row }) => <div>{row.getValue("bankName")}</div>,
      },
      {
        accessorKey: "productName",
        id: "productName",
        header: ({ column }) => <Label>Product Name</Label>,
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
        accessorKey: "maximumFundingAmount",
        id: "maximumFundingAmount",
        header: ({ column }) => <Label>Max Funding Amount</Label>,
        cell: ({ row }) => <div>{formatAmount(row.getValue("maximumFundingAmount"))}</div>,
      },
      {
        accessorKey: "clientApplicationStatus",
        id: "clientApplicationStatus",
        header: ({ column }) => <Label>Status</Label>,
        cell: ({ row }) => <CategoryBadge category={row.getValue("clientApplicationStatus")} />,
      },
      {
        id: "actions",
        cell: ({ row }) => <ActionCell row={row} referenceNumber={referenceNumber} />,
        size: 80,
      },
    ],
    [referenceNumber]
  );

  const table = useReactTable({
    data: approvedMappedFunds || [],
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

  if (isLoading) return <Spinner displayText="Loading mapped funds..." />;

  if (!approvedMappedFunds || approvedMappedFunds.length === 0)
    return <p className="text-center">No approved funds found.</p>;

  return (
    <div className="mx-auto w-full">
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
    </div>
  );
};

const ActionCell = ({ row, referenceNumber }: { row: any; referenceNumber: string }) => {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    setOpen(true);
  };

  return (
    <Button variant={"outline"} className="cursor-pointer bg-green-200 hover:bg-green-300">
      <CheckCircle className="mr-2 h-4 w-4" /> Apply
    </Button>
  );
};
