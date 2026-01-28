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
} from "@tanstack/react-table";
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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import SortableHeader from "@/components/SortableHeader";
import { Link2, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import MapWhopPaymentForm from "./form";
import { useUnmapWhopPayment } from "@/hooks/admin/payments/whop";
import { format } from "date-fns";
import { currency } from "@/lib/utils";
import { WhopPayment } from "@/schema/payments";

const createColumns = (
  onMapClick: (payment: WhopPayment) => void,
  onUnmapClick: (payment: WhopPayment) => void,
): ColumnDef<WhopPayment>[] => [
  {
    accessorKey: "created_at",
    id: "created_at",
    header: ({ column }) => <SortableHeader column={column} title="Date" />,
    cell: ({ row }) => (
      <div>{format(new Date(row.getValue("created_at")), "MMM dd, yyyy")}</div>
    ),
  },
  {
    accessorFn: (row) => row.user?.email,
    id: "email",
    header: ({ column }) => <SortableHeader column={column} title="Email" />,
  },
  {
    accessorKey: "total",
    header: ({ column }) => <SortableHeader column={column} title="Amount" />,
    cell: ({ row }) => <div>{row.getValue("total")}</div>,
  },
  {
    accessorFn: (row) => row.status,
    id: "status",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
  },
  {
    accessorFn: (row) => row.product?.title,
    id: "product",
    header: ({ column }) => <SortableHeader column={column} title="Product" />,
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
      const payment = row.original;
      const hasUserId = !!payment.userId;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onMapClick(payment)}
            disabled={hasUserId}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {hasUserId ? "Already Mapped" : "Map User"}
          </Button>
          {hasUserId && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onUnmapClick(payment)}
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
  whopPayments: WhopPayment[] | undefined;
};

const WhopPaymentsList = ({ whopPayments }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [selectedPayment, setSelectedPayment] =
    React.useState<WhopPayment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const { unmapPayment } = useUnmapWhopPayment();

  const handleMapClick = (payment: WhopPayment) => {
    setSelectedPayment(payment);
    setIsDialogOpen(true);
  };

  const handleUnmapClick = async (payment: WhopPayment) => {
    if (window.confirm("Are you sure you want to unmap this payment?")) {
      try {
        await unmapPayment({ docId: payment.docId! });
      } catch (error) {
        console.error("Failed to unmap payment:", error);
      }
    }
  };

  const columns = React.useMemo(
    () => createColumns(handleMapClick, handleUnmapClick),
    [],
  );

  const table = useReactTable({
    data: whopPayments || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  });

  return (
    <div className="mx-auto w-full">
      <div className="flex items-center py-3 sm:py-4">
        <Input
          placeholder="Filter payments..."
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
            const hasUserId = !!data.userId;
            const fullName =
              data.mappedFirstName && data.mappedLastName
                ? `${data.mappedFirstName} ${data.mappedLastName}`
                : null;
            return (
              <div
                key={row.id}
                className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div className="font-semibold">{data.user?.email}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(data.created_at), "MMM dd, yyyy")}
                  </div>
                </div>
                <div className="border-t pt-2 space-y-1 text-sm">
                  <div>
                    <span className="font-medium">Product:</span>{" "}
                    {data.product?.title}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> $
                    {currency(data.total)}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {data.status}
                  </div>
                  <div className="pt-2 border-t">
                    <span className="font-medium">Mapped Client: </span>
                    {fullName ? (
                      <span>
                        {fullName} ({data.mappedEmail})
                      </span>
                    ) : (
                      <span className="text-gray-400">Not Mapped</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-10"
                    onClick={() => handleMapClick(data)}
                    disabled={hasUserId}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {hasUserId ? "Already Mapped" : "Map User"}
                  </Button>
                  {hasUserId && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full h-10"
                      onClick={() => handleUnmapClick(data)}
                    >
                      <Unlink className="mr-2 h-4 w-4" />
                      Unmap
                    </Button>
                  )}
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
      <div className="hidden md:flex rounded-md border">
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
          <ScrollBar orientation="horizontal" className="w-full" />
        </ScrollArea>
      </div>
      <DataTablePagination table={table} />

      {selectedPayment && (
        <ResponsiveDialog
          isOpen={isDialogOpen}
          setIsOpen={setIsDialogOpen}
          title="Map Payment to Client"
          description="Select a client to map this Whop payment to."
          className="w-full sm:w-11/12 max-w-4xl max-h-[90vh]"
        >
          <div className="max-h-[70vh] overflow-y-auto">
            <MapWhopPaymentForm
              payment={selectedPayment}
              setOpen={setIsDialogOpen}
            />
          </div>
        </ResponsiveDialog>
      )}
    </div>
  );
};

export default WhopPaymentsList;
