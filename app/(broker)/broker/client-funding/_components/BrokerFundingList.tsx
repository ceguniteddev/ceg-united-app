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

import { BanknoteIcon, Loader2Icon } from "lucide-react";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTablePagination } from "@/components/funding/pagination";
import { formatAmount } from "@/lib/utils";
import CategoryBadge from "@/components/CategoryBadge";
import { ApprovedBankFormData } from "@/schema/bank-products";
import SortableHeader from "@/components/SortableHeader";
import { useApprovedMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";

const columns: ColumnDef<
  ApprovedBankFormData & {
    clientName?: string;
    clientEmail?: string;
    personalAmountFunding?: number;
    businessAmountFunding?: number;
  }
>[] = [
  {
    accessorKey: "clientName",
    id: "clientName",
    header: ({ column }) => (
      <SortableHeader column={column} title="Client Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("clientName")}</div>
    ),
  },
  {
    accessorKey: "clientEmail",
    id: "clientEmail",
    header: ({ column }) => (
      <SortableHeader column={column} title="Client Email" />
    ),
    cell: ({ row }) => (
      <div className="text-sm">{row.getValue("clientEmail")}</div>
    ),
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
          {productNames?.map((name, index) => (
            <span key={index}>{name}</span>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "personalAmountFunding",
    id: "personalAmountFunding",
    header: ({ column }) => (
      <SortableHeader column={column} title="Personal Amount" />
    ),
    cell: ({ row }) => (
      <div>{formatAmount(row.getValue("personalAmountFunding"))}</div>
    ),
  },
  {
    accessorKey: "businessAmountFunding",
    id: "businessAmountFunding",
    header: ({ column }) => (
      <SortableHeader column={column} title="Business Amount" />
    ),
    cell: ({ row }) => (
      <div>{formatAmount(row.getValue("businessAmountFunding"))}</div>
    ),
  },
  {
    accessorKey: "clientApplicationStatus",
    id: "clientApplicationStatus",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("clientApplicationStatus") as string;
      return status ? <CategoryBadge category={status} /> : null;
    },
  },
  {
    accessorKey: "declineReason",
    id: "declineReason",
    header: ({ column }) => (
      <SortableHeader column={column} title="Decline Reason" />
    ),
    cell: ({ row }) => {
      const reason = row.getValue("declineReason") as string;
      return reason ? (
        <div className="text-sm text-red-600">{reason}</div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
  },
  {
    accessorKey: "approvedAmount",
    id: "approvedAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Approved Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("approvedAmount");
      return amount ? (
        <div>{formatAmount(amount as number)}</div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
  },
  {
    accessorKey: "fundedAmount",
    id: "fundedAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Funded Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("fundedAmount");
      return amount ? (
        <div className="font-semibold text-emerald-600">
          {formatAmount(amount as number)}
        </div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
  },
  {
    id: "clientActions",
    header: "Actions",
    cell: ({ row }) => <ActionCell row={row} />,
  },
];

const ActionCell = ({ row }: { row: any }) => {
  const { applyApprovedMappedFund, isApplying } =
    useApprovedMappedFundsMutation();
  const [isDenefitsPaid, setIsDenefitsPaid] = React.useState(false);
  const { denefitsContract, isLoading } = useGetDenefitsContractsByUserId(
    row.original.userId
  );

  React.useEffect(() => {
    if (denefitsContract && denefitsContract.length > 0) {
      setIsDenefitsPaid(true);
    }
  }, [denefitsContract]);

  const handleApply = () => {
    applyApprovedMappedFund({
      referenceNumber: row.original.referenceNumber,
      fundMappingApprovedId: row.original.fundMappingApprovedId,
    });
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2Icon className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  if (row.original.clientApplicationStatus === "Not Applied") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleApply}
        className="bg-green-200 hover:bg-green-400 cursor-pointer"
        disabled={!isDenefitsPaid || isApplying}
      >
        {isApplying ? (
          <Loader2Icon className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <BanknoteIcon className="mr-2 h-4 w-4" />
            Apply
          </>
        )}
      </Button>
    );
  }

  return null;
};

type Props = {
  appliedFunding: (ApprovedBankFormData & {
    clientName?: string;
    clientEmail?: string;
  })[];
};

type StatusFilter =
  | "Not Applied"
  | "Sent to Lender"
  | "Declined"
  | "Approved"
  | "Funded";

const BrokerFundingList = ({ appliedFunding }: Props) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<StatusFilter>("Not Applied");

  // Calculate counts for each status
  const statusCounts = React.useMemo(() => {
    return {
      "Not Applied":
        appliedFunding?.filter(
          (f) => f.clientApplicationStatus === "Not Applied"
        ).length || 0,
      "Sent to Lender":
        appliedFunding?.filter(
          (f) => f.clientApplicationStatus === "Sent to Lender"
        ).length || 0,
      Declined:
        appliedFunding?.filter((f) => f.clientApplicationStatus === "Declined")
          .length || 0,
      Approved:
        appliedFunding?.filter((f) => f.clientApplicationStatus === "Approved")
          .length || 0,
      Funded:
        appliedFunding?.filter((f) => f.clientApplicationStatus === "Funded")
          .length || 0,
    };
  }, [appliedFunding]);

  // Filter data based on active tab
  const filteredData = React.useMemo(() => {
    return (
      appliedFunding?.filter(
        (fund) => fund.clientApplicationStatus === activeTab
      ) || []
    );
  }, [appliedFunding, activeTab]);

  // Determine which columns to show based on active tab
  const visibleColumns = React.useMemo(() => {
    return columns.filter((column) => {
      // Not Applied: Hide approvedAmount, fundedAmount, declineReason
      if (activeTab === "Not Applied") {
        if (
          column.id === "approvedAmount" ||
          column.id === "fundedAmount" ||
          column.id === "declineReason"
        ) {
          return false;
        }
      }

      // Sent to Lender: Hide approvedAmount, fundedAmount, clientActions, declineReason
      if (activeTab === "Sent to Lender") {
        if (
          column.id === "approvedAmount" ||
          column.id === "fundedAmount" ||
          column.id === "clientActions" ||
          column.id === "declineReason"
        ) {
          return false;
        }
      }

      // Declined: Hide approvedAmount, fundedAmount, clientActions
      if (activeTab === "Declined") {
        if (
          column.id === "approvedAmount" ||
          column.id === "fundedAmount" ||
          column.id === "clientActions"
        ) {
          return false;
        }
      }

      // Approved: Hide fundedAmount, clientActions, declineReason
      if (activeTab === "Approved") {
        if (
          column.id === "fundedAmount" ||
          column.id === "clientActions" ||
          column.id === "declineReason"
        ) {
          return false;
        }
      }

      // Funded: Hide clientActions, declineReason
      if (activeTab === "Funded") {
        if (column.id === "clientActions" || column.id === "declineReason") {
          return false;
        }
      }

      return true;
    });
  }, [activeTab]);

  const table = useReactTable({
    data: filteredData,
    columns: visibleColumns,
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
      <Tabs
        defaultValue="Not Applied"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as StatusFilter)}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="Not Applied" className="relative">
            Not Applied
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {statusCounts["Not Applied"]}
            </span>
          </TabsTrigger>
          <TabsTrigger value="Sent to Lender" className="relative">
            Sent to Lender
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
              {statusCounts["Sent to Lender"]}
            </span>
          </TabsTrigger>
          <TabsTrigger value="Declined" className="relative">
            Declined
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {statusCounts.Declined}
            </span>
          </TabsTrigger>
          <TabsTrigger value="Approved" className="relative">
            Approved
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {statusCounts.Approved}
            </span>
          </TabsTrigger>
          <TabsTrigger value="Funded" className="relative">
            Funded
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {statusCounts.Funded}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          <div className="flex items-center py-4">
            <Input
              placeholder="Search by client name, bank, or status..."
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
                      colSpan={visibleColumns.length}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerFundingList;
