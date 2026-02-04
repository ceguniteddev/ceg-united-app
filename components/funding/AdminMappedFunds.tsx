import {
  useApproveMappedFundsQuery,
  useFundingApplicationsMappedFundsMutation,
  useFundingApplicationsMappedFundsQuery,
} from "@/hooks/admin/funding-application/fund-mapping";

import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
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
  BanIcon,
  CheckCircle,
  MoreHorizontal,
  ViewIcon,
  PlusCircleIcon,
  Trash2Icon,
  RefreshCwIcon,
  XIcon,
  Loader2Icon,
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

import {
  ApprovedBankFormData,
  BankFormData,
  ClientApplicationStatus,
} from "@/schema/bank-products";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ManualAddBankProduct from "./ManualAddBankProduct";
import SortableHeader from "../SortableHeader";
import CategoryBadge from "../CategoryBadge";
import { formatAmount } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import BankProductsForm from "@/components/bank-products/bank-product-form";

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
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isRefreshAlertOpen, setIsRefreshAlertOpen] = useState(false);

  const {
    addManualMappedFund,
    isAddingManual,
    refreshBankProducts,
    isRefreshing,
  } = useFundingApplicationsMappedFundsMutation();

  // Get IDs of already mapped products to exclude from manual selection
  const mappedProductIds = useMemo(() => {
    return (mappedFund || []).map((fund) => fund.id || "").filter(Boolean);
  }, [mappedFund]);

  const handleManualAdd = async (selectedIds: string[]) => {
    await addManualMappedFund({
      bankProductIds: selectedIds,
      referenceNumber,
      userId,
    });
    setIsAddDialogOpen(false);
  };

  const handleRefresh = async () => {
    try {
      await refreshBankProducts({
        referenceNumber,
        userId,
      });
      setIsRefreshAlertOpen(false);
    } catch (error) {
      // Error is handled by the mutation's onError
      // Keep dialog open to show error state
    }
  };

  const columns: ColumnDef<BankFormData>[] = useMemo(
    () => [
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const isApproved =
            approvedMappedFunds?.some(
              (fund) => String(fund.id) === String(row.original.id),
            ) || false;

          return isApproved ? (
            <div className="flex items-center text-green-500">
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved
            </div>
          ) : (
            "Pending"
          );
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
        accessorKey: "products",
        id: "products",
        header: ({ column }) => (
          <SortableHeader column={column} title="Product Name" />
        ),
        cell: ({ row }) => {
          // console.log("ROW ORIGINAL:", row.original);
          // console.log("APPROVED MAPPED FUNDS:", approvedMappedFunds);
          const approvedFund = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id),
          );

          // console.log("APPROVED FUND:", approvedFund);

          // If the fund is approved, show the specific products that were approved.
          // Otherwise, show all products from the bank's profile.
          const productsToDisplay = approvedFund
            ? approvedFund.products
            : row.original.products;

          return (
            <div className="flex flex-col gap-1">
              {productsToDisplay?.map((product, index) => (
                <span key={index}>{product.productName}</span>
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
            (fund) => String(fund.id) === String(row.original.id),
          );

          const status = funds?.clientApplicationStatus;

          return status ? (
            <CategoryBadge category={status} />
          ) : (
            <CategoryBadge category={"Not Applied"} />
          );
        },
      },

      {
        id: "approvedAmount",
        header: "Approved Amount",
        cell: ({ row }) => {
          const funds = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id),
          );

          const approvedAmount = funds?.approvedAmount;

          return <div>{formatAmount(approvedAmount || 0)}</div>;
        },
      },

      {
        id: "approvedRemarks",
        header: "Approved Remarks",
        cell: ({ row }) => {
          const funds = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id),
          );

          const approvedRemarks = funds?.approvedRemarks;

          return <div>{approvedRemarks}</div>;
        },
      },

      {
        id: "actions",
        cell: ({ row }) => {
          const approvedMappedFund = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id),
          );
          const isApproved = !!approvedMappedFund || false;

          const funds = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id),
          );

          const status = funds?.clientApplicationStatus;

          // Hide actions if status is Approved or Funded
          if (status === "Approved" || status === "Funded") {
            return null;
          }

          return (
            <ActionCell
              row={row}
              referenceNumber={referenceNumber}
              isAdminApproved={isApproved}
              clientApplicationStatus={status || "Not Applied"}
              approvedMappedFund={approvedMappedFund}
            />
          );
        },
        size: 80,
      },
    ],
    [referenceNumber, approvedMappedFunds],
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
    return (
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <p className="text-sm sm:text-base">No mapped funds found.</p>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant={"outline"}
              className="bg-green-200 hover:bg-green-300 w-full sm:w-auto h-10 sm:h-9"
              onClick={() => setIsRefreshAlertOpen(true)}
              disabled={isRefreshing}
            >
              <RefreshCwIcon
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh Bank Products"}
            </Button>
            <Button
              variant={"outline"}
              className="bg-blue-200 hover:bg-blue-300 w-full sm:w-auto h-10 sm:h-9"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <PlusCircleIcon className="h-4 w-4" />
              Add Bank Product
            </Button>
          </div>
        </div>

        <AlertDialog
          open={isRefreshAlertOpen}
          onOpenChange={(open) => {
            if (!isRefreshing) setIsRefreshAlertOpen(open);
          }}
        >
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Refresh Bank Products?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This will re-analyze the funding application and update the
                mapped bank products. Existing approved products will not be
                affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                className="cursor-pointer w-full sm:w-auto"
                disabled={isRefreshing}
              >
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={async (e) => {
                  e.preventDefault();
                  await handleRefresh();
                }}
                disabled={isRefreshing}
                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer w-full sm:w-auto"
              >
                {isRefreshing ? (
                  <IconMenu
                    text="Refreshing..."
                    icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu
                    text="Yes, Refresh"
                    icon={<RefreshCwIcon className="h-4 w-4 mr-2" />}
                  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <ResponsiveDialog
          isOpen={isAddDialogOpen}
          setIsOpen={setIsAddDialogOpen}
          title="Add Bank Products"
          description="Select bank products to manually add to this funding application."
          className="w-full sm:w-11/12 max-w-5xl"
        >
          <ManualAddBankProduct
            referenceNumber={referenceNumber}
            userId={userId}
            onAdd={handleManualAdd}
            isAdding={isAddingManual}
            excludeIds={mappedProductIds}
          />
        </ResponsiveDialog>
      </div>
    );

  return (
    <div className="mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold">
          Mapped Bank Products
        </h3>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant={"outline"}
            className="bg-green-200 hover:bg-green-300 w-full sm:w-auto h-10 sm:h-9"
            onClick={() => setIsRefreshAlertOpen(true)}
            disabled={isRefreshing}
          >
            <RefreshCwIcon
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh Bank Products"}
          </Button>
          <Button
            variant={"outline"}
            className="bg-blue-200 hover:bg-blue-300 w-full sm:w-auto h-10 sm:h-9"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircleIcon className="h-4 w-4" />
            Add Bank Product
          </Button>
        </div>
      </div>

      <AlertDialog
        open={isRefreshAlertOpen}
        onOpenChange={(open) => {
          if (!isRefreshing) setIsRefreshAlertOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refresh Bank Products?</AlertDialogTitle>
            <AlertDialogDescription>
              This will re-analyze the funding application and update the mapped
              bank products. Existing approved products will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="cursor-pointer"
              disabled={isRefreshing}
            >
              <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async (e) => {
                e.preventDefault();
                await handleRefresh();
              }}
              disabled={isRefreshing}
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
            >
              {isRefreshing ? (
                <IconMenu
                  text="Refreshing..."
                  icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                />
              ) : (
                <IconMenu
                  text="Yes, Refresh"
                  icon={<RefreshCwIcon className="h-4 w-4 mr-2" />}
                />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ResponsiveDialog
        isOpen={isAddDialogOpen}
        setIsOpen={setIsAddDialogOpen}
        title="Add Bank Products to Fund Mapping"
        description="Select bank products to manually add to this funding application."
        className="w-full sm:w-11/12 max-w-5xl"
      >
        <ManualAddBankProduct
          referenceNumber={referenceNumber}
          userId={userId}
          onAdd={handleManualAdd}
          isAdding={isAddingManual}
          excludeIds={mappedProductIds}
        />
      </ResponsiveDialog>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 mb-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const data = row.original;
            const approvedFund = approvedMappedFunds?.find(
              (fund) => String(fund.id) === String(data.id),
            );
            const isApproved = !!approvedFund;
            const status =
              approvedFund?.clientApplicationStatus || "Not Applied";
            const approvedAmount = approvedFund?.approvedAmount;
            const approvedRemarks = approvedFund?.approvedRemarks;
            const showActions = status !== "Approved" && status !== "Funded";

            return (
              <div
                key={row.id}
                className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm break-words">
                      {data.bankName}
                    </h3>
                    {/* <p className="text-xs text-muted-foreground mt-1">
                      {data.financingTerm}
                    </p> */}
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {isApproved ? (
                      <div className="flex items-center text-green-500 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Pending
                      </span>
                    )}
                    {showActions && (
                      <ActionCell
                        row={row}
                        referenceNumber={referenceNumber}
                        isAdminApproved={isApproved}
                        clientApplicationStatus={status}
                        approvedMappedFund={approvedFund}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">
                      Product Names:
                    </span>
                    <div className="flex flex-col gap-0.5 mt-1">
                      {data.products?.map((product, index) => (
                        <span key={index} className="text-xs">
                          {product.productName}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between gap-2 pt-2 border-t">
                    <span className="text-muted-foreground text-xs">
                      Client Status:
                    </span>
                    <CategoryBadge category={status} />
                  </div>

                  {approvedAmount && (
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground text-xs">
                        Approved Amount:
                      </span>
                      <span className="font-medium text-xs">
                        {formatAmount(approvedAmount)}
                      </span>
                    </div>
                  )}

                  {approvedRemarks && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground text-xs block mb-1">
                        Remarks:
                      </span>
                      <p className="text-xs break-words">{approvedRemarks}</p>
                    </div>
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
      {/* <div className="hidden md:block overflow-hidden rounded-md border"> */}
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
    </div>
  );
};

const ActionCell = ({
  row,
  referenceNumber,
  isAdminApproved,
  clientApplicationStatus,
  approvedMappedFund,
}: {
  row: any;
  referenceNumber: string;
  isAdminApproved: boolean;
  clientApplicationStatus: ClientApplicationStatus;
  approvedMappedFund?: ApprovedBankFormData;
}) => {
  const [open, setOpen] = useState(false);
  const {
    cancelMappedFund,
    isCancelling,
    removeMappedBankProduct,
    isRemoving,
  } = useFundingApplicationsMappedFundsMutation();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const showCancelButton = useMemo(
    () => isAdminApproved && clientApplicationStatus !== "Approved",
    [clientApplicationStatus, isAdminApproved],
  );

  // Show delete button only if not approved
  const showDeleteButton = useMemo(() => !isAdminApproved, [isAdminApproved]);

  const handleCancelClick = async () => {
    await cancelMappedFund({
      fundMappingApprovedId: approvedMappedFund?.fundMappingApprovedId || "",
      referenceNumber: referenceNumber,
    });
    setIsAlertOpen(false);
  };

  const handleDeleteClick = async () => {
    await removeMappedBankProduct({
      referenceNumber,
      bankProductId: row.original.id || "",
    });
    setIsDeleteAlertOpen(false);
  };

  return (
    <>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`View Bank Product - ${row.original.bankName}`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        // className="w-full sm:w-11/12 md:w-10/12 lg:w-8/12 max-w-4xl max-h-[90vh]"
        className="w-[95vw] sm:w-11/12 md:w-10/12 lg:w-9/12 xl:w-4/5 max-w-6xl max-h-[90vh] flex flex-col"
      >
        <BankProductsForm
          setOpen={setOpen}
          data={row.original}
          isAdminViewing={true}
          referenceNumber={referenceNumber}
        />
      </ResponsiveDialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Confirmation?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will cancel the approved bank product mapping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="cursor-pointer w-full sm:w-auto">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelClick}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer w-full sm:w-auto"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel It"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">
              Delete Bank Product?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              This will permanently remove{" "}
              <span className="font-semibold">{row.original.bankName}</span>{" "}
              from the fund mapping. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel
              className="cursor-pointer w-full sm:w-auto"
              disabled={isRemoving}
            >
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer w-full sm:w-auto"
            >
              {isRemoving ? "Deleting..." : "Yes, Delete It"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          {showDeleteButton && (
            <DropdownMenuItem className="p-0">
              <Button
                variant="ghost"
                className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
                onClick={() => setIsDeleteAlertOpen(true)}
              >
                <IconMenu
                  text="Delete"
                  icon={<Trash2Icon className="h-4 w-4" />}
                />
              </Button>
            </DropdownMenuItem>
          )}
          {showCancelButton && (
            <DropdownMenuItem className="p-0">
              <Button
                variant="ghost"
                className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
                // onClick={() => handleCancelClick()}
                onClick={() => setIsAlertOpen(true)}
              >
                <IconMenu
                  text="Cancel"
                  icon={<BanIcon className="h-4 w-4" color="red" />}
                />
              </Button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
