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
import {
  BanknoteArrowUp,
  BanknoteIcon,
  BanknoteX,
  CircleDollarSign,
  Loader2Icon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";

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
import { formatAmount } from "@/lib/utils";
import CategoryBadge from "../CategoryBadge";
import { ApprovedBankFormData, BankFormData } from "@/schema/bank-products";
import SortableHeader from "@/components/SortableHeader";
import { useApprovedMappedFundsMutation } from "@/hooks/admin/funding-application/fund-mapping";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CustomFormField } from "../CustomFormField";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";

const baseColumns: ColumnDef<BankFormData>[] = [
  {
    accessorKey: "referenceNumber",
    id: "referenceNumber",
    header: ({ column }) => (
      <SortableHeader column={column} title="Reference Number" />
    ),
    cell: ({ row }) => <div>{row.getValue("referenceNumber")}</div>,
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
          {productNames?.map((name, index) => (
            <span key={index}>{name}</span>
          ))}
        </div>
      );
    },
  },
  // {
  //   accessorKey: "financingTerm",
  //   id: "financingTerm",
  //   header: ({ column }) => (
  //     <SortableHeader column={column} title="Financing Term" />
  //   ),
  //   cell: ({ row }) => <div>{row.getValue("financingTerm")}</div>,
  // },
  // {
  //   accessorKey: "maximumFundingAmount",
  //   id: "maximumFundingAmount",
  //   header: ({ column }) => (
  //     <SortableHeader column={column} title="Maximum Funding Amount" />
  //   ),
  //   cell: ({ row }) => (
  //     <div>{formatAmount(row.getValue("maximumFundingAmount"))}</div>
  //   ),
  // },
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
    accessorKey: "approvedAmount",
    id: "approvedAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Approved Amount" />
    ),
    cell: ({ row }) => (
      <div>{formatAmount(row.getValue("approvedAmount"))}</div>
    ),
  },
  {
    accessorKey: "approvedRemarks",
    id: "approvedRemarks",
    header: ({ column }) => (
      <SortableHeader column={column} title="Approved Remarks" />
    ),
    cell: ({ row }) => <div>{row.getValue("approvedRemarks")}</div>,
  },
  {
    accessorKey: "fundedAmount",
    id: "fundedAmount",
    header: ({ column }) => (
      <SortableHeader column={column} title="Funded Amount" />
    ),
    cell: ({ row }) => <div>{formatAmount(row.getValue("fundedAmount"))}</div>,
  },
  {
    id: "clientActions",
    cell: ({ row }) => <ActionCell row={row} />,
    size: 80,
  },
  {
    id: "adminActions",
    cell: ({ row }) => <AdminActionCell row={row} />,
    size: 80,
  },
];

type Props = {
  appliedFunding: ApprovedBankFormData[] | undefined;
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

  const columns = React.useMemo(() => {
    // 1. Determine if any funding application has been approved.
    // The optional chaining (?.) prevents errors if appliedFunding is undefined.
    const showApprovedColumns =
      appliedFunding?.some(
        (fund) =>
          fund.clientApplicationStatus === "Approved" ||
          fund.clientApplicationStatus === "Funded"
      ) || false;

    const showFundedColumns =
      appliedFunding?.some(
        (fund) => fund.clientApplicationStatus === "Funded"
      ) || false;

    // 2. Filter the base columns based on all conditions.
    return baseColumns.filter((column) => {
      // Hide clientActions for admins
      if (isAdminView && column.id === "clientActions") {
        return false;
      }

      // Hide adminActions for non-admins
      if (!isAdminView && column.id === "adminActions") {
        return false;
      }

      if (!isAdminView && column.id === "referenceNumber") {
        return false;
      }

      // Hide approval-related columns if no application is 'Approved'
      if (
        !showApprovedColumns &&
        (column.id === "approvedAmount" || column.id === "approvedRemarks")
      ) {
        return false;
      }

      if (!showFundedColumns && column.id === "fundedAmount") {
        return false;
      }

      // If none of the above conditions are met, keep the column
      return true;
    });
  }, [isAdminView, appliedFunding]);

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
      <div className="overflow-x-auto rounded-md border">
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
  const [isDenefitsPaid, setIsDenefitsPaid] = React.useState(false);

  const { denefitsContract, isLoading } = useGetDenefitsContractsByUserId(
    row.original.userId
  );

  React.useEffect(() => {
    if (denefitsContract && denefitsContract.length > 0) {
      setIsDenefitsPaid(true);
    }
  }, [denefitsContract]);

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
        disabled={isApplying || !isDenefitsPaid}
        className="bg-green-200 hover:bg-green-400 cursor-pointer"
        onClick={() => handleApproveClickCapture()}
      >
        {isApplying ? (
          <>
            <Loader2Icon className="h-4 w-4 animate-spin" />
            Applying...
          </>
        ) : (
          <>
            <BanknoteIcon className="h-4 w-4" /> Apply
          </>
        )}
      </Button>
    </>
  );
};

const approvalFormSchema = z.object({
  amountApproved: z.coerce
    .number<number>({ error: "Required" })
    .min(1, { error: "Amount must be greater than 0." }),
  remarks: z
    .string()
    .max(500, { error: "Remarks cannot exceed 500 characters." })
    .optional(),
});

const declineFormSchema = z.object({
  declineReason: z
    .string()
    .min(1, { error: "Decline reason is required." })
    .max(500, { error: "Decline reason cannot exceed 500 characters." }),
});

const fundedFormSchema = z.object({
  amountFunded: z.coerce
    .number<number>({ error: "Required" })
    .min(1, { error: "Amount must be greater than 0." }),
  remarksFunded: z
    .string()
    .max(500, { error: "Remarks cannot exceed 500 characters." })
    .optional(),
});

// Infer the type from the schema for type safety
type ApprovalFormValues = z.infer<typeof approvalFormSchema>;
type DeclineFormValues = z.infer<typeof declineFormSchema>;
type FundedFormValues = z.infer<typeof fundedFormSchema>;

const AdminActionCell = ({ row }: { row: any }) => {
  const [isApproveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [isDeclineDialogOpen, setDeclineDialogOpen] = React.useState(false);
  const [isFundedDialogOpen, setFundedDialogOpen] = React.useState(false);

  const {
    approveAppliedBankProduct,
    isApproving,
    declineAppliedBankProduct,
    isDeclining,
    fundedAppliedBankProduct,
    isFunding,
  } = useApprovedMappedFundsMutation();

  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalFormSchema),
    defaultValues: {
      remarks: "",
    },
  });

  const formDecline = useForm<DeclineFormValues>({
    resolver: zodResolver(declineFormSchema),
    defaultValues: {
      declineReason: "",
    },
  });

  const formFunded = useForm<FundedFormValues>({
    resolver: zodResolver(fundedFormSchema),
    defaultValues: {
      remarksFunded: "",
    },
  });

  const onDeclineSubmit = async (data: DeclineFormValues) => {
    await declineAppliedBankProduct({
      fundMappingApprovedId: row.original.fundMappingApprovedId,
      referenceNumber: row.original.referenceNumber,
      declineReason: data.declineReason,
    });
    formDecline.reset();
    setDeclineDialogOpen(false);
  };

  const onApproveSubmit = async (data: ApprovalFormValues) => {
    await approveAppliedBankProduct({
      fundMappingApprovedId: row.original.fundMappingApprovedId,
      referenceNumber: row.original.referenceNumber,
      approvedAmount: data.amountApproved,
      approvedRemarks: data.remarks,
    });
    form.reset();
    setApproveDialogOpen(false);
  };

  const onFundedSubmit = async (data: FundedFormValues) => {
    await fundedAppliedBankProduct({
      fundMappingApprovedId: row.original.fundMappingApprovedId,
      referenceNumber: row.original.referenceNumber,
      fundedAmount: data.amountFunded,
      fundedRemarks: data.remarksFunded,
    });
    form.reset();
    setFundedDialogOpen(false);
  };

  const showDeclineButton =
    row.original.clientApplicationStatus === "Approved" ||
    row.original.clientApplicationStatus === "Sent to Lender";

  const showApproveButton =
    row.original.clientApplicationStatus === "Sent to Lender" ||
    row.original.clientApplicationStatus === "Declined";

  const showFundedButton = row.original.clientApplicationStatus === "Approved";

  return (
    <div className="flex flex-row gap-2">
      {showDeclineButton && (
        <Dialog open={isDeclineDialogOpen} onOpenChange={setDeclineDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="bg-red-300 hover:bg-red-400 cursor-pointer"
              disabled={
                isDeclining ||
                isApproving ||
                row.original.clientApplicationStatus === "Declined"
              }
            >
              {isDeclining ? (
                <>
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <BanknoteX className="h-4 w-4 " /> Decline
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Decline Funding Application</DialogTitle>
              <DialogDescription>
                Please provide a reason for declining this funding application.
              </DialogDescription>
            </DialogHeader>

            <Form {...formDecline}>
              <form
                onSubmit={formDecline.handleSubmit(onDeclineSubmit)}
                className="space-y-4 py-4"
              >
                <CustomFormField
                  name="declineReason"
                  type="textarea"
                  label="Decline Reason *"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 cursor-pointer"
                    disabled={isDeclining}
                  >
                    {isDeclining ? (
                      <>
                        <Loader2Icon className=" h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Decline"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {showApproveButton && (
        <Dialog open={isApproveDialogOpen} onOpenChange={setApproveDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="bg-green-200 hover:bg-green-400 cursor-pointer"
              disabled={
                isApproving ||
                isDeclining ||
                row.original.clientApplicationStatus === "Approved"
              }
            >
              <BanknoteIcon className="h-4 w-4 " /> Approve
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Approve Funding Application</DialogTitle>
              <DialogDescription>
                Enter the approved amount and any relevant remarks below. Click
                confirm to finalize.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onApproveSubmit)}
                className="space-y-4 py-4"
              >
                <CustomFormField
                  name="amountApproved"
                  type="number"
                  label="Approved Amount *"
                />

                <CustomFormField
                  name="remarks"
                  type="textarea"
                  label="Remarks"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    disabled={isApproving}
                  >
                    {isApproving ? (
                      <>
                        <Loader2Icon className=" h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Approval"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {showFundedButton && (
        <Dialog open={isFundedDialogOpen} onOpenChange={setFundedDialogOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="bg-green-200 hover:bg-green-400 cursor-pointer"
              disabled={isApproving || isDeclining || isFunding}
            >
              <CircleDollarSign className="h-4 w-4" /> Funded
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Lender Funds</DialogTitle>
              {/* <DialogDescription>
                Enter the funded amount and any relevant remarks below. Click
                confirm to finalize.
              </DialogDescription> */}
            </DialogHeader>

            <Form {...formFunded}>
              <form
                onSubmit={formFunded.handleSubmit(onFundedSubmit)}
                className="space-y-4 py-4"
              >
                <CustomFormField
                  name="amountFunded"
                  type="number"
                  label="Funded Amount *"
                />

                <CustomFormField
                  name="remarksFunded"
                  type="textarea"
                  label="Remarks"
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                    disabled={isFunding}
                  >
                    {isFunding ? (
                      <>
                        <Loader2Icon className=" h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Confirm Funded"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
