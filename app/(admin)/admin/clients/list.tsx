"use client";
import { DataTablePagination } from "@/components/funding/pagination";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useUsersQuery } from "@/hooks/user";
import { UserFundMapStatus, UserWithId } from "@/schema/registration";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Banknote,
  ChartColumnIncreasing,
  MoreHorizontal,
  ViewIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import IconMenu from "@/components/icon-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useMemo } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ClientData from "@/app/(admin)/admin/clients/view";
import { useFundingApplicationsMappedFundsQuery } from "@/hooks/admin/funding-application/fund-mapping";
import CategoryBadge from "@/components/CategoryBadge";
import SortableHeader from "@/components/SortableHeader";
import AdminMappedFunds from "@/components/funding/AdminMappedFunds";
import AdminViewUserProfile from "@/components/funding/AdminViewUserProfile";
import { useAuth } from "@/provider/AuthContext";

const ClientsList = () => {
  const { mappedFund: approvedMappedFunds } = useFundingApplicationsMappedFundsQuery();

  const approvedByIds = useMemo(
    () => new Map((approvedMappedFunds ?? []).map((f) => [f.id, f.status])),
    [approvedMappedFunds]
  );

  const { users, isLoading } = useUsersQuery("Client");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");
  const STATUS_ORDER: Record<UserFundMapStatus, number> = { New: 0, Processing: 1 };
  const columns: ColumnDef<UserWithId>[] = [
    {
      accessorKey: "firstName",
      id: "firstName",
      header: ({ column }) => <SortableHeader column={column} title="First Name" />,
      cell: ({ row }) => {
        return <div>{row.getValue("firstName")}</div>;
      },
    },
    {
      accessorKey: "middleName",
      id: "middleName",
      header: ({ column }) => <SortableHeader column={column} title="Middle Name" />,
      cell: ({ row }) => {
        return <div>{row.getValue("middleName")}</div>;
      },
    },
    {
      accessorKey: "lastName",
      id: "lastName",
      header: ({ column }) => <SortableHeader column={column} title="Last Name" />,
      cell: ({ row }) => {
        return <div>{row.getValue("lastName")}</div>;
      },
    },
    {
      accessorKey: "email",
      id: "email",
      header: ({ column }) => <SortableHeader column={column} title="Email" />,
      cell: ({ row }) => {
        return <div>{row.getValue("email")}</div>;
      },
    },
    {
      id: "phoneNumber",
      accessorKey: "phoneNumber",
      header: ({ column }) => <SortableHeader column={column} title="Phone Number" />,
      cell: ({ row }) => {
        return <div>{row.getValue("phoneNumber")}</div>;
      },
    },
    {
      id: "status",
      accessorFn: (row) => approvedByIds.get(row.id) ?? null,
      header: ({ column }) => <SortableHeader column={column} title="Mapped Funding Status" />,
      cell: ({ row }) => {
        const id = row.original.id;
        const status = id ? approvedByIds.get(id) : undefined;
        return status ? <CategoryBadge category={status} /> : null;
      },
      sortingFn: (a, b, columnId) => {
        const va = a.getValue<UserFundMapStatus | null>(columnId);
        const vb = b.getValue<UserFundMapStatus | null>(columnId);

        const ra = va == null ? Number.POSITIVE_INFINITY : STATUS_ORDER[va];
        const rb = vb == null ? Number.POSITIVE_INFINITY : STATUS_ORDER[vb];

        if (ra < rb) return -1;
        if (ra > rb) return 1;
        return 0; // tie
      },
      sortDescFirst: false, // optional: first click = ascending (New -> Processing)
      enableSorting: true,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const id = row.original.id;
        const status = id ? approvedByIds.get(id) : undefined;
        return <ActionCell row={row} status={status} />;
      },
      size: 80,
    },
  ];

  const table = useReactTable({
    data: users || [],
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

  if (isLoading) {
    return <Spinner displayText="Loading clients..." />;
  }

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
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
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

export default ClientsList;

const ActionCell = ({ row, status }: { row: any; status?: UserFundMapStatus | null }) => {
  const [open, setOpen] = React.useState(false);
  const [mappedFundsOpen, setMappedFundsOpen] = React.useState(false);
  const [statisticsOpen, setStatisticsOpen] = React.useState(false);

  //BankProductsList
  return (
    <>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={``}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
      >
        <ClientData user={row.original} setOpen={setOpen} />
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={mappedFundsOpen}
        setIsOpen={setMappedFundsOpen}
        title={`Client's Mapped Funds`}
        description=""
        className="w-8/12 flex flex-col items-start justify-start min-h-[80vh] "
      >
        <AdminMappedFunds userId={row.original.id} setOpen={setMappedFundsOpen} />
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={statisticsOpen}
        setIsOpen={setStatisticsOpen}
        title={`Client Statistics`}
        description=""
        className="w-8/12 flex flex-col items-start justify-start min-h-[80vh] "
      >
        <AdminViewUserProfile userId={row.original.id} />
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
              onClick={() => setOpen(true)}
              className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
            >
              <IconMenu text="Details" icon={<ViewIcon className="h-4 w-4" />} />
            </Button>
          </DropdownMenuItem>
          {status && (
            <DropdownMenuItem className="p-0">
              <Button
                variant="ghost"
                onClick={() => setMappedFundsOpen(true)}
                className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
              >
                <IconMenu text="Mapped Funds" icon={<Banknote className="h-4 w-4" />} />
              </Button>
            </DropdownMenuItem>
          )}

          <DropdownMenuItem className="p-0">
            <Button
              variant="ghost"
              onClick={() => setStatisticsOpen(true)}
              className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
            >
              <IconMenu text="Statistics" icon={<ChartColumnIncreasing className="h-4 w-4" />} />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
