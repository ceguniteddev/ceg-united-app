"use client";

import { DataTablePagination } from "@/components/funding/pagination";
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
  DownloadIcon,
  Loader2Icon,
  MoreHorizontal,
  PencilIcon,
  Trash2Icon,
  XIcon,
  PlusIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import IconMenu from "@/components/icon-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BankFormData } from "@/schema/bank-products";
import {
  useBankProductsMutation,
  useBankProductsQuery,
} from "@/hooks/admin/bank-products";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import BankProductsForm from "./bank-product-form";
import SortableHeader from "@/components/SortableHeader";

const columns: ColumnDef<BankFormData>[] = [
  {
    accessorKey: "bankName",
    id: "bankName",
    header: ({ column }) => (
      <SortableHeader column={column} title="Bank Name" />
    ),
    cell: ({ row }) => (
      <div className="max-w-[200px] break-words whitespace-normal font-medium">
        {row.getValue("bankName")}
      </div>
    ),
    size: 200,
  },
  {
    id: "bureau",
    accessorFn: (row) => {
      const products = row.products || [];
      const bureaus = products
        .map((p) => {
          if (Array.isArray(p.creditBureauPulled)) {
            return p.creditBureauPulled.join(", ");
          }
          return p.creditBureauPulled || "";
        })
        .filter(Boolean);

      // Get unique bureaus
      const uniqueBureaus = Array.from(
        new Set(bureaus.join(", ").split(", ")),
      ).filter(Boolean);
      return uniqueBureaus.join(", ");
    },
    header: ({ column }) => <SortableHeader column={column} title="Bureau" />,
    cell: ({ row }) => {
      const products = row.original.products || [];
      const bureaus = products
        .map((p) => {
          if (Array.isArray(p.creditBureauPulled)) {
            return p.creditBureauPulled.join(", ");
          }
          return p.creditBureauPulled || "";
        })
        .filter(Boolean);

      const uniqueBureaus = Array.from(
        new Set(bureaus.join(", ").split(", ")),
      ).filter(Boolean);

      return (
        <div className="flex flex-wrap gap-1 max-w-[180px]">
          {uniqueBureaus.length > 0 ? (
            uniqueBureaus.map((bureau, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {bureau}
              </span>
            ))
          ) : (
            <span className="text-muted-foreground text-sm">-</span>
          )}
        </div>
      );
    },
    size: 180,
  },
  {
    id: "products",
    accessorFn: (row) =>
      (row.products || []).map((p) => p.productName).join(", "),
    header: ({ column }) => (
      <SortableHeader column={column} title="Products & Terms" />
    ),
    cell: ({ row }) => {
      const products = row.original.products || [];
      // Handle legacy data or new data
      const displayProducts = Array.isArray(products) ? products : [];

      return (
        <div className="flex flex-col gap-1 max-w-[300px]">
          {displayProducts.map((p, index) => (
            <div
              key={index}
              className="flex justify-between text-xs border-b border-dashed last:border-0 pb-1 last:pb-0"
            >
              <span className="font-semibold">{p.productName}</span>
              <span className="text-muted-foreground">{p.financingTerm}</span>
            </div>
          ))}
          {displayProducts.length === 0 && (
            <span className="text-muted-foreground italic">No products</span>
          )}
        </div>
      );
    },
  },
  {
    id: "priorityLevel",
    accessorFn: (row) => {
      // Sort by the highest priority (lowest number)
      const priorities = (row.products || [])
        .map((p) => Number(p.priorityLevel))
        .filter((n) => !isNaN(n) && n > 0);
      return priorities.length > 0 ? Math.min(...priorities) : 999;
    },
    header: ({ column }) => <SortableHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const products = row.original.products || [];
      const priorities = Array.from(
        new Set(products.map((p) => p.priorityLevel).filter(Boolean)),
      ).sort();
      return <div>{priorities.length > 0 ? priorities.join(", ") : "-"}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <ActionCell row={row} />,
    size: 80,
  },
];

const BankProductManagement = () => {
  const { products, isLoading } = useBankProductsQuery();
  const [open, setOpen] = useState(false);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data: products || [],
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

  const handleExportCSV = () => {
    if (!products) return;

    const headers = [
      "ID",
      "Is Approved",
      "Bank Name",
      "Underwriting Notes",
      "Product Name",
      "Category",
      "Financing Term",
      "Priority Level",
      "Maximum Funding Amount",
      "Average Approval Amount",
      "Gross Funding Percentage",
      "Minimum FICO Score",
      "Double Dip Allowed",
      "Credit Bureau Pulled",
      "Maximum Inquiries Allowed",
      "Minimum Number Of Accounts On Credit",
      "Minimum Credit Age Required",
      "Minimum Income Required",
      "Maximum Debt To Income Ratio",
      "Maximum Debt Service Ratio",
      "Personal Verifiable Income Required",
      "No Documentation Required",
      "Business Bank Statements Required",
      "Profit And Loss Statement Required",
      "Balance Sheet Required",
      "Business Plan Required",
      "Membership Required Before Application Required",
      "Membership Required Upon Approval Required",
      "Account Opening Before Application Required",
      "Account Opening After Approval Required",
      "Business Taxes Required",
      "Personal Taxes Required",
      "Immigration Status Requirement",
      "State Availability",
      "Application Method",
      "Allows Forwarding Via Email",
      "Can Be Finalized Online",
      "Client Needs To Go To Branch",
      "Web Url",
    ];

    const csvRows = [headers.join(",")];

    for (const bank of products) {
      const bankProducts = bank.products || [];

      if (bankProducts.length === 0) {
        // Export bank without products
        const values = [
          `"${bank.id || ""}"`,
          `"${bank.isApproved ? "Yes" : "No"}"`,
          `"${bank.bankName || ""}"`,
          `"${bank.underwritingNotes || ""}"`,
          ...Array(headers.length - 4).fill('""'),
        ];
        csvRows.push(values.join(","));
      } else {
        for (const prod of bankProducts) {
          const creditBureauPulled = Array.isArray(prod.creditBureauPulled)
            ? prod.creditBureauPulled.join("; ")
            : prod.creditBureauPulled;

          const stateAvailability = Array.isArray(prod.stateAvailability)
            ? prod.stateAvailability.join("; ")
            : prod.stateAvailability;

          const applicationMethod = Array.isArray(prod.applicationMethod)
            ? prod.applicationMethod.join("; ")
            : prod.applicationMethod;

          const values = [
            `"${bank.id || ""}"`,
            `"${bank.isApproved ? "Yes" : "No"}"`,
            `"${bank.bankName || ""}"`,
            `"${bank.underwritingNotes || ""}"`,
            `"${prod.productName || ""}"`,
            `"${prod.category || ""}"`,
            `"${prod.financingTerm || ""}"`,
            `"${prod.priorityLevel || ""}"`,
            `"${prod.maximumFundingAmount || ""}"`,
            // `"${prod.averageApprovalAmount || ""}"`,
            `"${prod.grossFundingPercentage || ""}"`,
            `"${prod.minimumFicoScore || ""}"`,
            `"${prod.doubleDipAllowed || ""}"`,
            `"${creditBureauPulled || ""}"`,
            `"${prod.maximumInquiriesAllowed || ""}"`,
            `"${prod.minimumNumberOfAccountsOnCredit || ""}"`,
            // `"${prod.minimumCreditAgeRequired || ""}"`,
            // `"${prod.minimumIncomeRequired || ""}"`,
            `"${prod.maximumDebtToIncomeRatio || ""}"`,
            `"${prod.maximumDebtServiceRatio || ""}"`,
            `"${prod.personalVerifiableIncomeRequired || ""}"`,
            // `"${prod.noDocumentationRequired || ""}"`,
            `"${prod.businessBankStatementsRequired || ""}"`,
            `"${prod.profitAndLossStatementRequired || ""}"`,
            `"${prod.balanceSheetRequired || ""}"`,
            `"${prod.businessPlanRequired || ""}"`,
            `"${prod.membershipRequiredBeforeApplicationRequired || ""}"`,
            `"${prod.membershipRequiredUponApprovalRequired || ""}"`,
            `"${prod.accountOpeningBeforeApplicationRequired || ""}"`,
            `"${prod.accountOpeningAfterApprovalRequired || ""}"`,
            `"${prod.businessTaxesRequired || ""}"`,
            `"${prod.personalTaxesRequired || ""}"`,
            `"${prod.immigrationStatusRequirement || ""}"`,
            `"${stateAvailability || ""}"`,
            `"${applicationMethod || ""}"`,
            `"${prod.allowsForwardingViaEmail || ""}"`,
            `"${prod.canBeFinalizedOnline || ""}"`,
            `"${prod.clientNeedsToGoToBranch || ""}"`,
          ];
          csvRows.push(values.join(","));
        }
      }
    }

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("hidden", "");
    a.setAttribute("href", url);
    a.setAttribute("download", "bank-products.csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (isLoading) return <Spinner displayText="Loading bank products…" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Bank Product Management
        </h2>
        <Button
          onClick={() => setOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-9 sm:h-10"
        >
          <IconMenu
            text="Add Bank Product"
            icon={<PlusIcon className="h-4 w-4" />}
          />
        </Button>
      </div>

      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`Bank Product Form`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        // className="w-[calc(100vw-16px)] max-w-full sm:w-11/12 sm:max-w-8xl lg:w-10/12"
        className="w-[95vw] sm:w-11/12 md:w-10/12 lg:w-9/12 xl:w-4/5 max-w-6xl max-h-[90vh] flex flex-col"
      >
        <BankProductsForm setOpen={setOpen} />
      </ResponsiveDialog>

      <div className="flex flex-col sm:flex-row sm:items-center py-4 gap-3 px-4 sm:px-0">
        <Input
          placeholder="Filter"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-sm h-10 sm:h-11"
        />
        <Button
          variant="outline"
          className="w-full sm:w-auto sm:ml-auto h-11 cursor-pointer"
          onClick={handleExportCSV}
        >
          <DownloadIcon className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 px-4 sm:px-0">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              className="bg-white border rounded-lg p-4 shadow-sm space-y-2 w-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base break-words">
                    {row.getValue("bankName")}
                  </h3>

                  <div className="flex flex-col gap-2 mt-2">
                    {(row.original.products || []).map((prod, index) => (
                      <div
                        key={index}
                        className="bg-slate-50 p-2 rounded text-xs border"
                      >
                        <div className="font-semibold text-blue-700">
                          {prod.productName}
                        </div>
                        <div className="flex gap-2 text-gray-500 mt-1">
                          <span>{prod.financingTerm}</span>
                          {prod.priorityLevel && (
                            <span>• P{prod.priorityLevel}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <ActionCell row={row} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">No results.</div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden rounded-md border">
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
      </div>

      <DataTablePagination table={table} />
    </div>
  );
};

export default BankProductManagement;

const ActionCell = ({ row }: { row: any }) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const { deleteBankProduct, isDeleting, isDeleteSuccess } =
    useBankProductsMutation();

  const handleDelete = async () => {
    await deleteBankProduct(row.original.id);
  };

  useEffect(() => {
    if (isDeleteSuccess && !isDeleting) {
      setIsDeleteOpen(false);
    }
  }, [isDeleteSuccess, isDeleting]);

  return (
    <>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`Bank Product Form`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-full max-w-full sm:w-11/12 sm:max-w-6xl lg:w-9/12 max-h-[90vh] overflow-y-auto"
      >
        <BankProductsForm setOpen={setOpen} data={row.original} />
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
              <IconMenu text="Edit" icon={<PencilIcon className="h-4 w-4" />} />
            </Button>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="p-0">
            <Button
              variant="ghost"
              className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
              onClick={() => setIsDeleteOpen(true)}
            >
              <IconMenu
                text="Delete"
                icon={<Trash2Icon className="h-4 w-4" />}
              />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isDeleteOpen && (
        <AlertDialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            if (!isDeleting) setIsDeleteOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{" "}
                <span className="font-semibold">{row.original.bankName}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                disabled={isDeleting}
                className="cursor-pointer"
              >
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleDelete();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <IconMenu
                    text="Deleting..."
                    icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu
                    text="Delete"
                    icon={<Trash2Icon className="h-4 w-4 mr-2" />}
                  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
