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
import { ArrowUpDown, Link2, Unlink } from "lucide-react";

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
import { useUnmapDenefitsContract } from "@/hooks/denefits";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export type DenefitsPayment = {
  id: string;
  contract_code: string;
  customer_email: string;
  customer_first_name: string;
  customer_last_name: string;
  userId?: string | null;
  mappedEmail?: string | null;
  mappedFirstName?: string | null;
  mappedLastName?: string | null;
};

const createColumns = (
  onMapClick: (contract: DenefitsPayment) => void,
  onUnmapClick: (contract: DenefitsPayment) => void
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
  {
    id: "mappedEmail",
    accessorKey: "mappedEmail",
    header: ({ column }) => (
      <div className="flex w-full">
        <Button variant="ghost" onClick={column.getToggleSortingHandler()}>
          Mapped Email <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const email = row.getValue("mappedEmail") as string | null;
      return (
        <div className="text-sm">
          {email || <span className="text-gray-400">Not Mapped</span>}
        </div>
      );
    },
  },
  {
    id: "mappedClientName",
    header: "Mapped Client Name",
    cell: ({ row }) => {
      const firstName = row.original.mappedFirstName;
      const lastName = row.original.mappedLastName;
      const fullName =
        firstName && lastName ? `${firstName} ${lastName}` : null;
      return (
        <div className="text-sm">
          {fullName || <span className="text-gray-400">Not Mapped</span>}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const contract = row.original;
      const hasUserId = !!(contract.userId && contract.userId !== null);
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMapClick(contract)}
            disabled={hasUserId}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {hasUserId ? "Already Mapped" : "Map User"}
          </Button>
          {hasUserId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onUnmapClick(contract)}
            >
              <Unlink className="mr-2 h-4 w-4" />
              Unmap
            </Button>
          )}
        </div>
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

  const { unmapContract, isUnmapping } = useUnmapDenefitsContract();

  const handleMapClick = (contract: DenefitsPayment) => {
    setSelectedContract(contract);
    setIsDialogOpen(true);
  };

  const handleUnmapClick = async (contract: DenefitsPayment) => {
    if (window.confirm("Are you sure you want to unmap this contract?")) {
      try {
        await unmapContract({ contractId: contract.id });
      } catch (error) {
        console.error("Failed to unmap contract:", error);
      }
    }
  };

  const columns = React.useMemo(
    () => createColumns(handleMapClick, handleUnmapClick),
    []
  );

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
      <div className="rounded-md border flex">
        <ScrollArea type="always" className="w-1 flex-1">
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
          <ScrollBar orientation="horizontal" className="w-full" />
        </ScrollArea>
      </div>
      <DataTablePagination table={table} />

      {/* Map User Dialog */}
      {selectedContract && (
        <ResponsiveDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          title="Map Contract to Client"
          description="Select a client to map this denefits contract to."
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
