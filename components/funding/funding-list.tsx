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
  BanknoteIcon,
  BanknoteX,
  CircleDollarSign,
  Loader2Icon,
  LockIcon,
  SendIcon,
  XCircle,
} from "lucide-react";

import { DialogFooter } from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/responsive-dialog";
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
// import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import { useAuth } from "@/provider/AuthContext";
import { useMembership } from "@/hooks/membership";
import { useRouter } from "next/navigation";
import { ApprovalOddsBadge } from "./v2/ApprovalOddsBadge";
import { LenderLogo } from "./v2/LenderLogo";
import { CheckCircle2 } from "lucide-react";
import BankPlaybookButton from "./BankPlaybookButton";
import IconMenu from "../icon-menu";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";

import { toast } from "sonner";
import { createMembershipCheckoutConfig } from "@/service/dodo";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { AddonCheckoutView } from "@/components/pricing-plans/AddonCheckoutView";
// import { useFeeSettings } from "@/hooks/fee-settings";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const FUNDING_PATHWAY_LABELS: Record<string, string> = {
  income_based: "Income-Based Lenders",
  business_credit_card_stacking: "Business Credit Card Stacking",
  business_lines_of_credit: "Business Lines of Credit",
  business_loan: "Business Loans",
  personal_loan: "Personal Loans",
  personal_credit_card: "Personal Credit Cards",
};

const getFundingPathwayLabel = (pathwayId?: string) => {
  if (!pathwayId) return "—";

  return (
    FUNDING_PATHWAY_LABELS[pathwayId] ||
    pathwayId
      .split("_")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

const getBaseColumns = (
  hasPaidContract: boolean,
): ColumnDef<BankFormData>[] => [
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
    cell: ({ row }) => {
      const data = row.original as ApprovedBankFormData;
      const displayBankName = hasPaidContract
        ? data.bankName
        : `Bank ${row.index + 1}`;

      const lenderId = data.bankId || data.id || "";
      const productId = data.id || (data.products?.[0] as any)?.id || "";

      return (
        <div className="flex items-center gap-3">
          <LenderLogo
            initial={
              hasPaidContract
                ? data.logoInitial || data.bankName.trim()[0]
                : "B"
            }
            bgClass={data.logoBg || "bg-blue-100"}
            colorClass={data.logoColor || "text-blue-600"}
            size="sm"
          />
          <div className="min-w-0 flex flex-col items-start gap-1">
            <p className="text-sm font-semibold text-gray-900 whitespace-normal break-words max-w-[250px] md:max-w-[300px] xl:max-w-[400px]">
              {displayBankName}
            </p>
            {data.userId && lenderId && productId && (
              <div className="flex items-center pt-0.5">
                <BankPlaybookButton
                  userId={data.userId}
                  lenderId={lenderId}
                  productId={productId}
                  referenceNumber={data.referenceNumber}
                  pathwayId={data.pathwayId}
                  fundMappingApprovedId={data.fundMappingApprovedId}
                />
              </div>
            )}
            {data.clientApplicationStatus === "Funded" && data.fundedAmount && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="size-3.5 text-blue-500" />
                <span className="text-xs text-gray-500">
                  Funded ${data.fundedAmount.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "products",
    id: "approvedProducts",
    header: ({ column }) => (
      <SortableHeader column={column} title="Approved Products" />
    ),
    cell: ({ row }) => {
      const data = row.original as ApprovedBankFormData;
      if (!data.products || data.products.length === 0) {
        return <div className="text-xs text-gray-400">—</div>;
      }
      return (
        <div className="flex flex-wrap gap-1.5 max-w-[250px]">
          {data.products.map((product: any, idx: number) => (
            <span
              key={idx}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 animate-fade-in"
            >
              {product.productName}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "pathwayId",
    id: "fundingPathway",
    header: ({ column }) => (
      <SortableHeader column={column} title="Funding Pathway" />
    ),
    cell: ({ row }) => {
      const pathwayId = (row.original as ApprovedBankFormData).pathwayId;
      if (!pathwayId) return null;

      const pathwayLabel = getFundingPathwayLabel(pathwayId);

      return (
        <span className="inline-flex max-w-[220px] rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          {pathwayLabel}
        </span>
      );
    },
  },
  {
    accessorKey: "approvalOdds",
    id: "approvalOdds",
    header: ({ column }) => (
      <SortableHeader column={column} title="Approval Odds" />
    ),
    cell: ({ row }) => {
      const data = row.original as ApprovedBankFormData;
      const odds = data.approvalOdds || 0;
      return odds > 0 ? (
        <ApprovalOddsBadge odds={odds} />
      ) : (
        <span className="text-xs text-gray-400">N/A</span>
      );
    },
  },
  {
    accessorKey: "requirements",
    id: "requirements",
    header: () => (
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Requirements
      </span>
    ),
    cell: ({ row }) => {
      const data = row.original as ApprovedBankFormData;

      // Display each product as a separate row
      if (!data.products || data.products.length === 0) {
        return <div className="text-sm text-gray-400">—</div>;
      }

      return (
        <div className="space-y-2">
          {data.products.map((product: any, idx: number) => {
            const parts: string[] = [];

            // Product Name
            if (product.productName) {
              parts.push(product.productName);
            }

            // Min FICO
            if (product.minimumFicoScore) {
              parts.push(`FICO ${product.minimumFicoScore}+`);
            }

            return (
              <div key={idx} className="text-xs text-gray-700 leading-relaxed">
                {parts.length > 0 ? parts.join(" • ") : "—"}
              </div>
            );
          })}
        </div>
      );
    },
  },

  {
    accessorKey: "clientApplicationStatus",
    id: "clientApplicationStatus",
    header: ({ column }) => (
      <SortableHeader column={column} title="Application Status" />
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
  viewColumns?: {
    columnId: string;
  }[];
};

const FundingList = ({ appliedFunding, isAdminView, viewColumns }: Props) => {
  // const { userData } = useAuth();
  const { data: membership } = useMembership(appliedFunding?.[0]?.userId);
  const hasPaidContract = membership?.status === "active" || !!isAdminView;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
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
          fund.clientApplicationStatus === "Funded",
      ) || false;

    const showFundedColumns =
      appliedFunding?.some(
        (fund) => fund.clientApplicationStatus === "Funded",
      ) || false;

    // 2. Filter the base columns based on all conditions.
    const baseCols = getBaseColumns(hasPaidContract);
    return baseCols.filter((column) => {
      if (viewColumns && viewColumns.length > 0) {
        const isVisible = viewColumns.some((vc) => vc.columnId === column.id);
        if (!isVisible) return false;
      }

      // Hide clientActions for admins
      if (isAdminView && column.id === "clientActions") {
        return false;
      }

      // Hide adminActions for non-admins
      if (!isAdminView && column.id === "adminActions") {
        return false;
      }

      if (
        isAdminView &&
        (column.id === "requirements" || column.id === "approvalOdds")
      ) {
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
  }, [isAdminView, appliedFunding, hasPaidContract, viewColumns]);

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
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden rounded-md border md:flex">
        <ScrollArea
          type="always"
          className="w-1 flex-1 h-[calc(100vh-400px)] min-h-[400px]"
        >
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
                table.getRowModel().rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`transition-colors hover:bg-blue-50/30 ${
                      idx === 0 ? "bg-blue-50/40" : ""
                    }`}
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

      {/* Mobile Card View */}
      <div className="space-y-4 md:hidden">
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map((row) => (
              <FundingCard
                key={row.id}
                row={row}
                isAdminView={isAdminView}
                columns={columns}
              />
            ))
        ) : (
          <div className="text-center py-8 text-gray-500">No results.</div>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
};
export default FundingList;

const FundingCard = ({
  row,
  isAdminView,
  columns,
}: {
  row: any;
  isAdminView?: boolean;
  columns: ColumnDef<any>[];
}) => {
  // const { userData } = useAuth();
  const { data: membership } = useMembership(row?.original?.userId);
  const hasPaidContract = membership?.status === "active" || !!isAdminView;
  const data = row.original;
  const displayBankName = hasPaidContract
    ? data.bankName
    : `Bank ${row.index + 1}`;

  const isColumnVisible = (columnId: string) => {
    return columns.some((col) => col.id === columnId);
  };

  return (
    <article className="space-y-4 rounded-lg border bg-white p-3 shadow-sm sm:p-4">
      {isColumnVisible("referenceNumber") && data.referenceNumber && (
        <div className="pb-2 border-b">
          <p className="text-xs text-gray-500">Reference Number</p>
          <p className="font-semibold text-sm">{data.referenceNumber}</p>
        </div>
      )}

      {isColumnVisible("bankName") && (
        <div className="space-y-3">
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <LenderLogo
                initial={
                  hasPaidContract
                    ? data.logoInitial || data.bankName.trim()[0]
                    : "B"
                }
                bgClass={data.logoBg || "bg-blue-100"}
                colorClass={data.logoColor || "text-blue-600"}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">Bank Name</p>
                <p className="truncate font-semibold text-gray-900">
                  {displayBankName}
                </p>
              </div>
            </div>
            {isAdminView && data.rank && (
              <div className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
                <span className="text-xs font-bold">{data.rank}</span>
              </div>
            )}
          </div>

          {data.userId &&
            (data.bankId || data.id) &&
            (data.id || data.products?.[0]?.id) && (
              <BankPlaybookButton
                userId={data.userId}
                lenderId={data.bankId || data.id}
                productId={data.id || data.products?.[0]?.id}
                referenceNumber={data.referenceNumber}
                pathwayId={data.pathwayId}
                fundMappingApprovedId={data.fundMappingApprovedId}
                className="flex w-full flex-col gap-2 min-[360px]:flex-row min-[360px]:flex-wrap [&>a]:min-h-11 [&>a]:justify-center [&>button]:min-h-11 [&>button]:justify-center"
              />
            )}

          <div>
            {isColumnVisible("fundedAmount") &&
              data.clientApplicationStatus === "Funded" &&
              data.fundedAmount && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="size-3.5 text-blue-500" />
                  <span className="text-xs text-gray-500">
                    Funded ${data.fundedAmount.toLocaleString()}
                  </span>
                </div>
              )}
          </div>
        </div>
      )}

      {isColumnVisible("approvalOdds") &&
        data.approvalOdds &&
        data.approvalOdds > 0 && (
          <div>
            <p className="text-xs text-gray-500">Approval Odds</p>
            <div className="mt-1">
              <ApprovalOddsBadge odds={data.approvalOdds} />
            </div>
          </div>
        )}

      {isColumnVisible("approvedProducts") &&
        data.products &&
        data.products.length > 0 && (
          <div>
            <p className="text-xs text-gray-500">Approved Products</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.products.map((product: any, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                >
                  {product.productName}
                </span>
              ))}
            </div>
          </div>
        )}

      {isColumnVisible("fundingPathway") && data.pathwayId && (
        <div>
          <p className="text-xs text-gray-500">Funding Pathway</p>
          <span className="mt-1 inline-flex rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {getFundingPathwayLabel(data.pathwayId)}
          </span>
        </div>
      )}

      {isColumnVisible("requirements") &&
        data.products &&
        data.products.length > 0 && (
          <div>
            <p className="text-xs text-gray-500">Requirements</p>
            <div className="space-y-2 mt-1">
              {data.products.map((product: any, idx: number) => {
                const parts: string[] = [];

                if (product.productName) parts.push(product.productName);
                if (product.minimumFicoScore)
                  parts.push(`FICO ${product.minimumFicoScore}+`);

                return (
                  <div key={idx} className="text-sm text-gray-700">
                    {parts.length > 0 ? parts.join(" • ") : "—"}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* <div>
        <p className="text-xs text-gray-500">Product Name</p>
        <div className="flex flex-col gap-1">
          {data.productName?.map((name: string, index: number) => (
            <span key={index} className="text-sm">
              {name}
            </span>
          ))}
        </div>
      </div> */}

      {isColumnVisible("clientApplicationStatus") && (
        <div>
          <p className="text-xs text-gray-500">Application Status</p>
          <div className="mt-1">
            <CategoryBadge category={data.clientApplicationStatus} />
          </div>
        </div>
      )}

      {isColumnVisible("approvedAmount") && (
        <div>
          <p className="text-xs text-gray-500">Approved Amount</p>
          <p className="font-semibold text-green-600">
            {formatAmount(data.approvedAmount)}
          </p>
        </div>
      )}

      {isColumnVisible("approvedRemarks") && (
        <div>
          <p className="text-xs text-gray-500">Approved Remarks</p>
          <p className="text-sm">{data.approvedRemarks || "—"}</p>
        </div>
      )}

      {isColumnVisible("fundedAmount") && (
        <div>
          <p className="text-xs text-gray-500">Funded Amount</p>
          <p className="font-semibold text-blue-600">
            {formatAmount(data.fundedAmount)}
          </p>
        </div>
      )}

      <div className="pt-2 flex gap-2">
        {isColumnVisible("clientActions") && <ActionCell row={row} />}
        {isColumnVisible("adminActions") && <AdminActionCell row={row} />}
      </div>
    </article>
  );
};

const ActionCell = ({ row }: { row: any }) => {
  const router = useRouter();
  // const [isDenefitsPaid, setIsDenefitsPaid] = React.useState(false);
  const [isSkipDialogOpen, setSkipDialogOpen] = React.useState(false);
  const [isPricingModalOpen, setPricingModalOpen] = React.useState(false);
  const [checkoutId, setCheckoutId] = React.useState<string | null>(null);
  const [isCheckoutSheetOpen, setCheckoutSheetOpen] = React.useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState<{
    id: string;
    amount: number;
  } | null>(null);
  const [isAddonCheckout, setIsAddonCheckout] = React.useState(false);
  const [pendingAddons, setPendingAddons] = React.useState<string[]>([]);
  // const { data: feeSettings } = useFeeSettings();
  const { userData, role } = useAuth();
  const { data: membership } = useMembership(row?.original?.userId);

  // const { denefitsContract } = useGetDenefitsContractsByUserId(
  //   row.original.userId,
  // );

  const { skipLenderAppliedBankProduct, isSkipping } =
    useApprovedMappedFundsMutation();

  const formSkip = useForm<SkipLenderFormValues>({
    resolver: zodResolver(skipLenderFormSchema),
    defaultValues: {
      skipReason: "",
    },
  });

  // React.useEffect(() => {
  //   if (denefitsContract && denefitsContract.length > 0) {
  //     setIsDenefitsPaid(true);
  //   }
  // }, [denefitsContract]);

  const handleApproveClickCapture = () => {
    if (role === "Admin") {
      router.push(
        `/admin/clients/${row.original.userId}/income-funding/apply/${row.original.fundMappingApprovedId}`,
      );
    } else {
      router.push(
        `/client/income-funding/apply/${row.original.fundMappingApprovedId}`,
      );
    }
  };

  const onSkipSubmit = async (data: SkipLenderFormValues) => {
    await skipLenderAppliedBankProduct({
      referenceNumber: row.original.referenceNumber,
      fundMappingApprovedId: row.original.fundMappingApprovedId,
      skipReason: data.skipReason,
    });
    setSkipDialogOpen(false);
    formSkip.reset();
  };

  const handleSelectPlan = async (
    planId: string,
    amount: number,
    selectedAddons: string[] = [],
  ) => {
    if (!row.original.userId) return;
    try {
      setIsCreatingCheckout(true);
      setPendingAddons(selectedAddons);
      setIsAddonCheckout(false);
      const res = await createMembershipCheckoutConfig({
        userId: row.original.userId,
        planId: planId as any,
        selectedAddonIds: selectedAddons,
      });
      setCheckoutId(res.checkoutId);
      setSelectedPlan({ id: planId, amount });
      setPricingModalOpen(false);
      setCheckoutSheetOpen(true);
    } catch (err: any) {
      toast.error("Failed to start checkout: " + err.message);
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  if (row.original.clientApplicationStatus !== "Not Applied") return null;

  return (
    <>
      <div className="flex gap-2 w-full lg:w-auto">
        {membership?.status === "active" ? (
          <>
            <Button
              type="button"
              variant="outline"
              className="group bg-blue-500 hover:bg-blue-600 text-white cursor-pointer flex-1 lg:flex-none transition-all"
              onClick={() => handleApproveClickCapture()}
            >
              <IconMenu
                icon={
                  <SendIcon className="h-4 w-4 transition-all group-hover:fill-white group-hover:stroke-[1.5]" />
                }
                text="Apply"
              />
            </Button>

            <Button
              type="button"
              variant="outline"
              className="group border-gray-300 hover:border-gray-400 hover:bg-gray-50 flex-1 lg:flex-none transition-all"
              onClick={() => setSkipDialogOpen(true)}
            >
              <IconMenu
                icon={
                  <XCircle className="h-4 w-4 text-gray-600 transition-all group-hover:text-gray-700" />
                }
                text="Skip"
              />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold cursor-pointer flex-1 lg:flex-none transition-all border-none shadow-md hover:shadow-lg"
            onClick={() => setPricingModalOpen(true)}
          >
            <span className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-700 ease-out -skew-x-12 -translate-x-full" />
            <IconMenu
              icon={
                <LockIcon className="h-4 w-4 transition-all group-hover:scale-110" />
              }
              text="Unlock to Apply"
            />
          </Button>
        )}

        <ResponsiveDialog
          isOpen={isPricingModalOpen}
          setIsOpen={setPricingModalOpen}
          title="Upgrade to Apply"
          description=""
          className="sm:max-w-[90vw] md:max-w-6xl max-h-[90vh] overflow-y-auto p-0 border-0"
        >
          <PricingPlans
            isLoading={isCreatingCheckout}
            onSelectPlan={handleSelectPlan}
          />
        </ResponsiveDialog>

        <Sheet open={isCheckoutSheetOpen} onOpenChange={setCheckoutSheetOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-2xl p-0 flex flex-col gap-0 overflow-hidden"
          >
            <SheetHeader className="px-6 py-4 border-b border-gray-200">
              <SheetTitle className="text-xl font-bold">
                Secure Checkout
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              {checkoutId &&
                selectedPlan &&
                (isAddonCheckout ? (
                  <AddonCheckoutView
                    checkoutId={checkoutId}
                    userId={row.original.userId}
                    addonId={selectedPlan.id}
                    amount={selectedPlan.amount}
                    prefillEmail={userData?.email || ""}
                    onPaymentCompleteAction={() => {
                      setCheckoutSheetOpen(false);
                      router.refresh();
                    }}
                  />
                ) : (
                  <MembershipCheckoutView
                    checkoutId={checkoutId}
                    userId={row.original.userId}
                    tierId={selectedPlan.id}
                    amount={selectedPlan.amount}
                    prefillEmail={userData?.email || ""}
                    pendingAddons={pendingAddons}
                    membershipAmount={selectedPlan?.amount ?? 0}
                    onPaymentCompleteAction={() => {
                      // Checkout is now 1-step, just close the modal
                      setCheckoutSheetOpen(false);
                      router.refresh();
                    }}
                  />
                ))}
            </div>
          </SheetContent>
        </Sheet>

        <ResponsiveDialog
          isOpen={isSkipDialogOpen}
          setIsOpen={setSkipDialogOpen}
          title="Skip Lender"
          description={
            <>
              Are you sure you want to skip applying to{" "}
              <span className="font-semibold">{row.original.bankName}</span>?
              You can optionally provide a reason below.
            </>
          }
          className="sm:max-w-md"
        >
          <Form {...formSkip}>
            <form
              onSubmit={formSkip.handleSubmit(onSkipSubmit)}
              className="space-y-4"
            >
              <CustomFormField
                name="skipReason"
                type="textarea"
                label="Reason (Optional)"
                placeholder="Enter reason for skipping this lender..."
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSkipDialogOpen(false)}
                  disabled={isSkipping}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSkipping}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  {isSkipping ? (
                    <>
                      <Loader2Icon className="animate-spin h-4 w-4 mr-2" />
                      Skipping...
                    </>
                  ) : (
                    "Confirm Skip"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ResponsiveDialog>
      </div>
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

const skipLenderFormSchema = z.object({
  skipReason: z
    .string()
    .max(500, { error: "Skip reason cannot exceed 500 characters." })
    .optional(),
});

// Infer the type from the schema for type safety
type ApprovalFormValues = z.infer<typeof approvalFormSchema>;
type DeclineFormValues = z.infer<typeof declineFormSchema>;
type FundedFormValues = z.infer<typeof fundedFormSchema>;
type SkipLenderFormValues = z.infer<typeof skipLenderFormSchema>;

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
      userId: row.original.userId,
      bankName: row.original.bankName,
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
    <div className="flex flex-col lg:flex-row gap-2 w-full">
      {showDeclineButton && (
        <>
          <Button
            type="button"
            variant="outline"
            className="bg-red-300 hover:bg-red-400 cursor-pointer w-full lg:w-auto"
            disabled={
              isDeclining ||
              isApproving ||
              row.original.clientApplicationStatus === "Declined"
            }
            onClick={() => setDeclineDialogOpen(true)}
          >
            {isDeclining ? (
              <>
                <Loader2Icon className="h-4 w-4 animate-spin" />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              <>
                <BanknoteX className="h-4 w-4" />
                <span className="ml-2">Decline</span>
              </>
            )}
          </Button>

          <ResponsiveDialog
            isOpen={isDeclineDialogOpen}
            setIsOpen={setDeclineDialogOpen}
            title="Decline Funding Application"
            description="Please provide a reason for declining this funding application."
            className="sm:max-w-md"
          >
            <Form {...formDecline}>
              <form
                onSubmit={formDecline.handleSubmit(onDeclineSubmit)}
                className="space-y-4"
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
          </ResponsiveDialog>
        </>
      )}

      {showApproveButton && (
        <>
          <Button
            type="button"
            variant="outline"
            className="bg-green-200 hover:bg-green-400 cursor-pointer w-full lg:w-auto"
            disabled={
              isApproving ||
              isDeclining ||
              row.original.clientApplicationStatus === "Approved"
            }
            onClick={() => setApproveDialogOpen(true)}
          >
            <BanknoteIcon className="h-4 w-4" />
            <span className="ml-2">Approve</span>
          </Button>

          <ResponsiveDialog
            isOpen={isApproveDialogOpen}
            setIsOpen={setApproveDialogOpen}
            title="Approve Funding Application"
            description="Enter the approved amount and any relevant remarks below. Click confirm to finalize."
            className="sm:max-w-md"
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onApproveSubmit)}
                className="space-y-4"
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
          </ResponsiveDialog>
        </>
      )}

      {showFundedButton && (
        <>
          <Button
            type="button"
            variant="outline"
            className="bg-green-200 hover:bg-green-400 cursor-pointer w-full lg:w-auto"
            disabled={isApproving || isDeclining || isFunding}
            onClick={() => setFundedDialogOpen(true)}
          >
            <CircleDollarSign className="h-4 w-4" />
            <span className="ml-2">Funded</span>
          </Button>

          <ResponsiveDialog
            isOpen={isFundedDialogOpen}
            setIsOpen={setFundedDialogOpen}
            title="Lender Funds"
            description="Enter the funded amount and any relevant remarks below. Click confirm to finalize."
            className="sm:max-w-md"
          >
            <Form {...formFunded}>
              <form
                onSubmit={formFunded.handleSubmit(onFundedSubmit)}
                className="space-y-4"
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
          </ResponsiveDialog>
        </>
      )}
    </div>
  );
};
