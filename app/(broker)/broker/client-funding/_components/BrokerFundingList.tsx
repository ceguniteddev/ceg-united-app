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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTablePagination } from "@/components/funding/pagination";
import { formatAmount } from "@/lib/utils";
import CategoryBadge from "@/components/CategoryBadge";
import { ApprovedBankFormData } from "@/schema/bank-products";
import SortableHeader from "@/components/SortableHeader";
import { useApprovedMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BrokerFundingData = ApprovedBankFormData & {
  clientName?: string;
  clientEmail?: string;
  personalAmountFunding?: number;
  businessAmountFunding?: number;
  commissionRate?: number;
  commissionAmount?: number;
};

const columns: ColumnDef<BrokerFundingData>[] = [
  {
    accessorKey: "clientName",
    id: "clientName",
    header: ({ column }) => (
      <SortableHeader column={column} title="Client Name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium whitespace-nowrap">
        {row.getValue("clientName")}
      </div>
    ),
    size: 180,
  },
  {
    accessorKey: "clientEmail",
    id: "clientEmail",
    header: ({ column }) => (
      <SortableHeader column={column} title="Client Email" />
    ),
    cell: ({ row }) => (
      <div className="text-sm whitespace-nowrap">
        {row.getValue("clientEmail")}
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "bankName",
    id: "bankName",
    header: ({ column }) => (
      <SortableHeader column={column} title="Bank Name" />
    ),
    cell: ({ row }) => (
      <div className="whitespace-nowrap">{row.getValue("bankName")}</div>
    ),
    size: 180,
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
            <span key={index} className="whitespace-nowrap">
              {name}
            </span>
          ))}
        </div>
      );
    },
    size: 200,
  },
  {
    accessorKey: "personalAmountFunding",
    id: "personalAmountFunding",
    header: ({ column }) => (
      <SortableHeader column={column} title="Personal Amount" />
    ),
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {formatAmount(row.getValue("personalAmountFunding"))}
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: "businessAmountFunding",
    id: "businessAmountFunding",
    header: ({ column }) => (
      <SortableHeader column={column} title="Business Amount" />
    ),
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {formatAmount(row.getValue("businessAmountFunding"))}
      </div>
    ),
    size: 150,
  },
  {
    accessorKey: "clientApplicationStatus",
    id: "clientApplicationStatus",
    header: ({ column }) => <SortableHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status = row.getValue("clientApplicationStatus") as string;
      return status ? <CategoryBadge category={status} /> : null;
    },
    size: 150,
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
        <div className="text-sm text-red-600 whitespace-nowrap">{reason}</div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
    size: 180,
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
        <div className="whitespace-nowrap">
          {formatAmount(amount as number)}
        </div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
    size: 150,
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
        <div className="font-semibold text-emerald-600 whitespace-nowrap">
          {formatAmount(amount as number)}
        </div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
    size: 150,
  },
  {
    accessorKey: "commissionRate",
    id: "commissionRate",
    header: ({ column }) => (
      <SortableHeader column={column} title="Commission %" />
    ),
    cell: ({ row }) => {
      const rate = row.getValue("commissionRate") as number;
      return rate ? (
        <div className="font-medium whitespace-nowrap">{rate}%</div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
    size: 130,
  },
  {
    accessorKey: "commissionAmount",
    id: "commissionAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Commission Amount" />
    ),
    cell: ({ row }) => {
      const amount = row.getValue("commissionAmount");
      return amount ? (
        <div className="font-semibold text-blue-600 whitespace-nowrap">
          {formatAmount(amount as number)}
        </div>
      ) : (
        <div className="text-muted-foreground">-</div>
      );
    },
    size: 170,
  },
  {
    id: "clientActions",
    header: "Actions",
    cell: ({ row }) => <ActionCell row={row} />,
    size: 150,
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
        className="bg-green-200 hover:bg-green-400 cursor-pointer w-full md:w-auto"
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
  appliedFunding: BrokerFundingData[];
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
      // Not Applied: Hide approvedAmount, fundedAmount, declineReason, commission columns
      if (activeTab === "Not Applied") {
        if (
          column.id === "approvedAmount" ||
          column.id === "fundedAmount" ||
          column.id === "declineReason" ||
          column.id === "commissionRate" ||
          column.id === "commissionAmount"
        ) {
          return false;
        }
      }

      // Sent to Lender: Hide approvedAmount, fundedAmount, clientActions, declineReason, commission columns
      if (activeTab === "Sent to Lender") {
        if (
          column.id === "approvedAmount" ||
          column.id === "fundedAmount" ||
          column.id === "clientActions" ||
          column.id === "declineReason" ||
          column.id === "commissionRate" ||
          column.id === "commissionAmount"
        ) {
          return false;
        }
      }

      // Declined: Hide approvedAmount, fundedAmount, clientActions, commission columns
      if (activeTab === "Declined") {
        if (
          column.id === "approvedAmount" ||
          column.id === "fundedAmount" ||
          column.id === "clientActions" ||
          column.id === "commissionRate" ||
          column.id === "commissionAmount"
        ) {
          return false;
        }
      }

      // Approved: Hide fundedAmount, clientActions, declineReason, commission columns
      if (activeTab === "Approved") {
        if (
          column.id === "fundedAmount" ||
          column.id === "clientActions" ||
          column.id === "declineReason" ||
          column.id === "commissionRate" ||
          column.id === "commissionAmount"
        ) {
          return false;
        }
      }

      // Funded: Hide clientActions, declineReason (show commission columns)
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
        {/* Desktop Tabs */}
        <TabsList className="mb-4 hidden md:inline-flex">
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

        {/* Mobile Dropdown */}
        <div className="md:hidden px-4 sm:px-0 mb-4">
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as StatusFilter)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not Applied">
                Not Applied ({statusCounts["Not Applied"]})
              </SelectItem>
              <SelectItem value="Sent to Lender">
                Sent to Lender ({statusCounts["Sent to Lender"]})
              </SelectItem>
              <SelectItem value="Declined">
                Declined ({statusCounts.Declined})
              </SelectItem>
              <SelectItem value="Approved">
                Approved ({statusCounts.Approved})
              </SelectItem>
              <SelectItem value="Funded">
                Funded ({statusCounts.Funded})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value={activeTab} className="mt-0">
          <div className="flex items-center py-4 px-4 sm:px-0">
            <Input
              placeholder="Search by client name, bank, or status..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Desktop Table View */}
          <div className="rounded-md border hidden md:flex">
            <ScrollArea type="always" className="w-1 flex-1">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className="whitespace-nowrap"
                          >
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
                          <TableCell
                            key={cell.id}
                            className="whitespace-nowrap"
                          >
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

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 px-4 sm:px-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <Card key={row.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">
                          {row.original.clientName}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {row.original.clientEmail}
                        </p>
                      </div>
                      <CategoryBadge
                        category={row.original.clientApplicationStatus}
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-muted-foreground text-xs">Bank</p>
                        <p className="font-medium">{row.original.bankName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Personal Amount
                        </p>
                        <p className="font-medium">
                          {formatAmount(
                            row.original.personalAmountFunding || 0
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">
                          Business Amount
                        </p>
                        <p className="font-medium">
                          {formatAmount(
                            row.original.businessAmountFunding || 0
                          )}
                        </p>
                      </div>
                      {row.original.approvedAmount && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Approved Amount
                          </p>
                          <p className="font-medium">
                            {formatAmount(row.original.approvedAmount)}
                          </p>
                        </div>
                      )}
                      {row.original.fundedAmount && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Funded Amount
                          </p>
                          <p className="font-semibold text-emerald-600">
                            {formatAmount(row.original.fundedAmount)}
                          </p>
                        </div>
                      )}
                      {row.original.commissionRate && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Commission %
                          </p>
                          <p className="font-medium">
                            {row.original.commissionRate}%
                          </p>
                        </div>
                      )}
                      {row.original.commissionAmount && (
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Commission Amount
                          </p>
                          <p className="font-semibold text-blue-600">
                            {formatAmount(row.original.commissionAmount)}
                          </p>
                        </div>
                      )}
                    </div>
                    {row.original.productName && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">
                          Products
                        </p>
                        <div className="flex flex-col gap-1">
                          {row.original.productName.map(
                            (name: string, index: number) => (
                              <span key={index} className="text-sm">
                                {name}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                    {row.original.declineReason && (
                      <div>
                        <p className="text-muted-foreground text-xs mb-1">
                          Decline Reason
                        </p>
                        <p className="text-sm text-red-600">
                          {row.original.declineReason}
                        </p>
                      </div>
                    )}
                    {row.original.clientApplicationStatus === "Not Applied" && (
                      <div className="pt-2">
                        <ActionCell row={row} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No results.
                </CardContent>
              </Card>
            )}
          </div>

          <DataTablePagination table={table} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BrokerFundingList;
