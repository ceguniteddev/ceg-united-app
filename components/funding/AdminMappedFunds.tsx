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
import BankProductsForm from "@/app/(admin)/admin/bank-products/form";
import ManualAddBankProduct from "./ManualAddBankProduct";
import SortableHeader from "../SortableHeader";
import CategoryBadge from "../CategoryBadge";
import { formatAmount } from "@/lib/utils";

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
              (fund) => String(fund.id) === String(row.original.id)
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
            (fund) => String(fund.id) === String(row.original.id)
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
            (fund) => String(fund.id) === String(row.original.id)
          );

          const approvedRemarks = funds?.approvedRemarks;

          return <div>{approvedRemarks}</div>;
        },
      },

      {
        id: "actions",
        cell: ({ row }) => {
          const approvedMappedFund = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id)
          );
          const isApproved = !!approvedMappedFund || false;

          const funds = approvedMappedFunds?.find(
            (fund) => String(fund.id) === String(row.original.id)
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
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <p>No mapped funds found.</p>
          <div className="flex gap-2">
            <Button
              variant={"outline"}
              className="bg-green-200 hover:bg-green-300"
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
              className="bg-blue-200 hover:bg-blue-300"
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
                This will re-analyze the funding application and update the
                mapped bank products. Existing approved products will not be
                affected.
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
          className="w-11/12 max-w-5xl"
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Mapped Bank Products</h3>
        <div className="flex gap-2">
          <Button
            variant={"outline"}
            className="bg-green-200 hover:bg-green-300"
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
            className="bg-blue-200 hover:bg-blue-300"
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
        className="w-11/12 max-w-5xl"
      >
        <ManualAddBankProduct
          referenceNumber={referenceNumber}
          userId={userId}
          onAdd={handleManualAdd}
          isAdding={isAddingManual}
          excludeIds={mappedProductIds}
        />
      </ResponsiveDialog>
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
    [clientApplicationStatus, isAdminApproved]
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
        className="w-8/12 flex flex-col items-start justify-start min-h-screen "
      >
        <BankProductsForm
          setOpen={setOpen}
          data={row.original}
          isAdminViewing={true}
          referenceNumber={referenceNumber}
        />
      </ResponsiveDialog>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel the approved bank product mapping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelClick}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isCancelling ? "Cancelling..." : "Yes, Cancel It"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bank Product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-semibold">{row.original.bankName}</span>{" "}
              from the fund mapping. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer" disabled={isRemoving}>
              Go Back
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
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
