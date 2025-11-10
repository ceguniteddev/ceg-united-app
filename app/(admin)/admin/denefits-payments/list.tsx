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
import { ArrowUpDown, Link2 } from "lucide-react";

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
import { DataTablePagination } from "@/components/funding/pagination";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import MapDenefitsContractForm from "./form";

export type DenefitsPayment = {
  id: string;
  contract_code: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  userId?: string | null;
};

const createColumns = (
  onMapClick: (contract: DenefitsPayment) => void
): ColumnDef<DenefitsPayment>[] => [
  {
    accessorKey: "contract_code",
    id: "contract_code",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Contract Code <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("contract_code")}</div>;
    },
  },
  {
    accessorKey: "customer_email",
    id: "customer_email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("customer_email")}</div>;
    },
  },
  {
    id: "customer_first_name",
    accessorKey: "customer_first_name",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          First Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("customer_first_name")}</div>;
    },
  },
  {
    id: "customer_last_name",
    accessorKey: "customer_last_name",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Last Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      return <div>{row.getValue("customer_last_name")}</div>;
    },
  },
  //   {
  //     id: "userId",
  //     accessorKey: "userId",
  //     header: "User ID",
  //     cell: ({ row }) => {
  //       const userId = row.getValue("userId") as string | null;
  //       return (
  //         <div className="text-xs text-gray-500">
  //           {userId ? userId.substring(0, 8) + "..." : "Not Mapped"}
  //         </div>
  //       );
  //     },
  //   },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const contract = row.original;
      const hasUserId = !!(contract.userId && contract.userId !== null);
      return (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMapClick(contract)}
          disabled={hasUserId}
        >
          <Link2 className="mr-2 h-4 w-4" />
          {hasUserId ? "Already Mapped" : "Map User"}
        </Button>
      );
    },
  },
];

type Props = {
  denefitsPayments: DenefitsPayment[] | undefined;
};

const DenefitsPaymentsList = ({ denefitsPayments }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [selectedContract, setSelectedContract] =
    React.useState<DenefitsPayment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const handleMapClick = (contract: DenefitsPayment) => {
    setSelectedContract(contract);
    setIsDialogOpen(true);
  };

  const columns = React.useMemo(() => createColumns(handleMapClick), []);

  const table = useReactTable({
    data: denefitsPayments || [],
    columns: columns,
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
          value={globalFilter}
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

      {/* Map User Dialog */}
      {selectedContract && (
        <ResponsiveDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          title="Map Contract to User"
          description="Select a user to map this denefits contract to."
          className="w-11/12 max-w-4xl"
        >
          <MapDenefitsContractForm
            contract={selectedContract}
            setOpen={setIsDialogOpen}
          />
        </ResponsiveDialog>
      )}
    </div>
  );
};

export default DenefitsPaymentsList;
