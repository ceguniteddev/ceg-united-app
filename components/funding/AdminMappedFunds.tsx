import {
  useApproveMappedFundsQuery,
  useClientMappedFundingDetailsQuery,
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
import {
  ArrowUpDown,
  CheckCircle,
  MoreHorizontal,
  ViewIcon,
} from "lucide-react";
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
import SortableHeader from "../SortableHeader";
import CategoryBadge from "../CategoryBadge";

type Props = {
  referenceNumber: string;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string;
};

const AdminMappedFunds = ({ referenceNumber, setOpen, userId }: Props) => {
  return <BankProductsList referenceNumber={referenceNumber} userId={userId} />;
};

export default AdminMappedFunds;

const BankProductsList = ({
  referenceNumber,
  userId,
}: {
  referenceNumber: string;
  userId: string;
}) => {
  const { mappedFund = [], isLoading } =
    useFundingApplicationsMappedFundsQuery(referenceNumber);

  const { approvedMappedFunds = [] } =
    useApproveMappedFundsQuery(referenceNumber);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<BankFormData>[] = useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const isApproved =
            approvedMappedFunds?.some(
              (fund) => String(fund.id) === String(row.original.id)
            ) || false;

          return isApproved ? (
            <div className="flex items-center text-green-500">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved
            </div>
          ) : null;
        },
        size: 120,
      },
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
        id: "clientApplicationStatus",
        header: "Client Application Status",
        cell: ({ row }) => {
          const funds = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id)
          );

          const status = funds?.clientApplicationStatus;

          return status ? <CategoryBadge category={status} /> : null;
        },
      },

      {
        id: "actions",
        cell: ({ row }) => (
          <ActionCell row={row} referenceNumber={referenceNumber} />
        ),
        size: 80,
      },
    ],
    [referenceNumber, approvedMappedFunds]
  );

  const table = useReactTable({
    data: mappedFund || [],
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

  if (!mappedFund || mappedFund.length === 0)
    return <p className="text-center">No mapped funds found.</p>;

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
    </div>
  );
};

const ActionCell = ({
  row,
  referenceNumber,
}: {
  row: any;
  referenceNumber: string;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`View Bank Product - ${row.original.bankName}`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-8/12 flex flex-col items-start justify-start min-h-screen "
      >
        <BankProductsForm
          setOpen={setOpen}
          data={row.original}
          isAdminViewing={true}
          referenceNumber={referenceNumber}
        />
      </ResponsiveDialog>
      <DropdownMenu modal={true}>
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
              onClick={() => setOpen(true)}
            >
              <IconMenu text="View" icon={<ViewIcon className="h-4 w-4" />} />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
