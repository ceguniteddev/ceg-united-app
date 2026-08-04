"use client";

import { DataTablePagination } from "@/components/funding/pagination";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  useUsersQuery,
  useUpdateUserStatusMutation,
  useResendVerificationMutation,
  useDeleteUserMutation,
} from "@/hooks/user";
import { UserWithId, UserActiveStatus } from "@/schema/registration";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDownIcon, Trash2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useEffect } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import SortableHeader from "@/components/SortableHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

type StatusKey = "Active" | "Paused" | "InActive";

const STATUS_STYLES: Record<
  StatusKey,
  {
    border: string;
    bg: string;
    text: string;
    chipBg: string;
  }
> = {
  InActive: {
    border: "border-red-200",
    bg: "bg-red-600",
    text: "text-red-700",
    chipBg: "bg-red-50",
  },
  Paused: {
    border: "border-amber-200",
    bg: "bg-amber-500",
    text: "text-amber-700",
    chipBg: "bg-amber-50",
  },
  Active: {
    border: "border-emerald-200",
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    chipBg: "bg-emerald-50",
  },
};

const StatusPicker = ({ user }: { user: UserWithId }) => {
  const styles =
    STATUS_STYLES[(user.activeStatus as StatusKey) || "Active"] ??
    STATUS_STYLES.Active;

  const { updateUserStatus, isUpdating } = useUpdateUserStatusMutation({
    userId: user.id,
  });

  const { resendVerification, isResending } = useResendVerificationMutation();
  const { deleteUser, isDeleting } = useDeleteUserMutation({
    userId: user.id,
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleStatusChange = React.useCallback(
    async (value: string) => {
      if (value) {
        await updateUserStatus({
          status: value as UserActiveStatus,
        });
      }
    },
    [updateUserStatus],
  );

  const handleResend = React.useCallback(async () => {
    try {
      await resendVerification(user.id);
      toast.success("Verification email sent successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email");
    }
  }, [resendVerification, user.id]);

  const handleDeleteUser = React.useCallback(async () => {
    try {
      await deleteUser(user.id);
      setIsDeleteDialogOpen(false);
    } catch {
      // Error is handled in toast within mutation
    }
  }, [deleteUser, user.id]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
      <div
        className={[
          "flex items-center gap-2 sm:gap-3 rounded-md p-2 border transition-all duration-200 flex-1",
          styles.border,
          styles.chipBg,
        ].join(" ")}
      >
        <span
          className={[
            "text-xs font-semibold whitespace-nowrap",
            styles.text,
          ].join(" ")}
        >
          Status
        </span>

        <Select
          disabled={!!isUpdating}
          defaultValue={user.activeStatus ?? "Active"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger
            className={[
              "w-full sm:w-[130px] h-8 text-xs",
              "border",
              styles.border,
              "bg-white",
              "focus:ring-0 focus:outline-none",
            ].join(" ")}
          >
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {(["Active", "Paused", "InActive"] as StatusKey[]).map((opt) => (
              <SelectItem key={opt} value={opt}>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={[
                      "inline-block h-2 w-2 rounded-full",
                      STATUS_STYLES[opt].bg,
                    ].join(" ")}
                  />
                  {opt}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!user.emailVerified && (
        <Button
          variant="outline"
          size="sm"
          disabled={isResending}
          onClick={handleResend}
          className="h-8 text-xs font-medium border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/80 hover:text-amber-800"
        >
          {isResending ? "Resending..." : "Resend Link"}
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={isDeleting}
        onClick={() => setIsDeleteDialogOpen(true)}
        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        title="Delete User"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(open);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              <span className="font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </span>{" "}
              ({user.email}) as Administrator.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const statusFilterFn: FilterFn<UserWithId> = (row, columnId, filterValue) => {
  const raw = row.getValue<string | undefined>(columnId);
  const v = (raw ?? "Active").toLowerCase();
  const sel = String(filterValue ?? "").toLowerCase();
  return v === sel;
};

export default function AdminsList() {
  const [statusFilter, setStatusFilter] = React.useState("all");
  const { users, isLoading } = useUsersQuery("Admin");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<UserWithId>[] = [
    {
      accessorKey: "activeStatus",
      id: "activeStatus",
      header: ({ column }) => <SortableHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = (row.getValue("activeStatus") as string) ?? "Active";
        return (
          <div>
            <CategoryBadge category={status} />
          </div>
        );
      },
      filterFn: statusFilterFn,
    },
    {
      accessorKey: "name",
      id: "name",
      header: ({ column }) => <SortableHeader column={column} title="Name" />,
      accessorFn: (row) =>
        `${row.firstName || ""} ${row.lastName || ""}`.trim(),
      cell: ({ row }) => {
        const admin = row.original;
        return (
          <div className="font-semibold text-gray-900">
            {admin.firstName} {admin.lastName}
          </div>
        );
      },
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => <SortableHeader column={column} title="Email" />,
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex flex-col gap-1">
            <span className="lowercase text-gray-600">
              {row.getValue("email")}
            </span>
            {user.emailVerified ? (
              <span className="inline-flex items-center text-[10px] font-medium text-emerald-600">
                ✓ Verified
              </span>
            ) : (
              <span className="inline-flex items-center text-[10px] font-medium text-amber-600">
                ⚠ Unverified
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: "phoneNumber",
      accessorKey: "phoneNumber",
      header: ({ column }) => (
        <SortableHeader column={column} title="Phone Number" />
      ),
      cell: ({ row }) => {
        return (
          <div className="text-gray-600">
            {row.getValue("phoneNumber") || "-"}
          </div>
        );
      },
    },
    {
      id: "registrationDate",
      accessorKey: "registrationDate",
      header: ({ column }) => (
        <SortableHeader column={column} title="Date Joined" />
      ),
      cell: ({ row }) => {
        const val = row.getValue("registrationDate") as any;
        if (!val) return <div className="text-gray-400">-</div>;
        const d = val._seconds ? new Date(val._seconds * 1000) : new Date(val);
        return (
          <div className="text-gray-600">
            {isNaN(d.getTime()) ? "-" : d.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return <StatusPicker user={row.original} />;
      },
    },
  ];

  const table = useReactTable({
    data: (users || []) as UserWithId[],
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

  useEffect(() => {
    const col = table.getColumn("activeStatus");
    if (!col) return;

    if (statusFilter === "all") {
      col.setFilterValue(undefined);
    } else {
      col.setFilterValue(statusFilter);
    }
  }, [statusFilter, table]);

  if (isLoading) {
    return <Spinner displayText="Loading administrators..." />;
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex flex-col gap-3 py-4">
        <Input
          placeholder="Filter administrators..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full bg-white border-gray-200"
        />
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="text-sm font-medium text-gray-700">
            Status Filter:
          </label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-between bg-white border-gray-200"
              >
                <span>
                  {statusFilter === "all" ? "All Statuses" : statusFilter}
                </span>
                <ChevronDownIcon className="h-4 w-4 ml-2 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
              <DropdownMenuRadioGroup
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <DropdownMenuRadioItem value="all">
                  All Statuses
                </DropdownMenuRadioItem>
                {["Active", "InActive", "Paused"].map((status) => (
                  <DropdownMenuRadioItem key={status} value={status}>
                    {status}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const admin = row.original;
            const regVal = admin.registrationDate as any;
            const regDateStr = regVal
              ? (() => {
                  const d = regVal._seconds
                    ? new Date(regVal._seconds * 1000)
                    : new Date(regVal);
                  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString();
                })()
              : "-";

            return (
              <div
                key={row.id}
                className="border border-gray-100 rounded-xl p-4 shadow-sm bg-white space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base text-gray-900 truncate">
                      {admin.firstName} {admin.lastName}
                    </h3>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <p className="text-sm text-gray-600 truncate">
                        {admin.email}
                      </p>
                      {admin.emailVerified ? (
                        <span className="inline-flex items-center text-[10px] font-medium text-emerald-600 mt-0.5">
                          ✓ Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[10px] font-medium text-amber-600 mt-0.5">
                          ⚠ Unverified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {admin.phoneNumber || "No Phone"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1.5">
                      Joined: {regDateStr}
                    </p>
                  </div>
                  <CategoryBadge category={admin.activeStatus ?? "Active"} />
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <StatusPicker user={admin} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="border border-gray-100 rounded-xl p-8 text-center text-gray-500 bg-white shadow-sm">
            No administrators found.
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="rounded-xl border border-gray-100 hidden md:flex flex-col bg-white shadow-sm overflow-hidden">
        <ScrollArea
          type="always"
          className="w-full flex-1 h-[calc(100vh-380px)] min-h-[400px]"
        >
          <Table>
            <TableHeader className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent border-b border-gray-100"
                >
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="text-gray-500 font-semibold h-11"
                      >
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
                    className="border-b border-gray-50 hover:bg-gray-50/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
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
                    className="h-24 text-center text-gray-500"
                  >
                    No administrators found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="border-t border-gray-100 p-4">
          <DataTablePagination table={table} />
        </div>
      </div>
    </div>
  );
}
