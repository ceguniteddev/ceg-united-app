"use client";
import { DataTablePagination } from "@/components/funding/pagination";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useUsersQuery } from "@/hooks/user";
import {
  UserActiveStatusEnum,
  UserFundMapStatus,
  UserWithId,
} from "@/schema/registration";
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
import { ChevronDownIcon, MoreHorizontal, ViewIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import IconMenu from "@/components/icon-menu";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useEffect, useMemo, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";
import SortableHeader from "@/components/SortableHeader";
import { useRouter } from "next/navigation";
import { useGetDenefitsContracts } from "@/hooks/denefits";
import { DenefitsRequest, DenefitsStatusEnum } from "@/schema/denefits";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const statusFilterFn: FilterFn<UserWithId> = (row, columnId, filterValue) => {
  const raw = row.getValue<string | undefined>(columnId);
  const v = (raw ?? "Active").toLowerCase();
  const sel = String(filterValue ?? "").toLowerCase();
  // exact match; swap to v.includes(sel) if you want partials
  return v === sel;
};

const denefitsStatusFilterFn: FilterFn<UserWithId> = (
  row,
  columnId,
  filterValue
) => {
  // The accessorFn provides the value, which will be "Active" or "Inactive"
  const value = row.getValue<string>(columnId);
  const selectedFilter = String(filterValue);

  // If no filter is selected, show all rows
  if (!selectedFilter) return true;

  return value === selectedFilter;
};

const premiumFilterFn: FilterFn<UserWithId> = (row, columnId, filterValue) => {
  const raw = row.getValue<boolean | undefined>(columnId);
  const isPremium = raw === true;
  const sel = String(filterValue);

  if (sel === "Yes") return isPremium;
  if (sel === "No") return !isPremium;
  return true;
};

const ClientsList = () => {
  const [roleFilter, setRoleFilter] = useState("all");
  const [denefitsStatusFilter, setDenefitsStatusFilter] = useState("all");
  const [premiumFilter, setPremiumFilter] = useState("all");

  const { users, isLoading } = useUsersQuery("Client");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const { denefitsContracts, isLoading: denefitsContractsLoading } =
    useGetDenefitsContracts();

  const denefitsContractsMap = useMemo(() => {
    if (!denefitsContracts) return new Map();
    return new Map(
      denefitsContracts.map((contract: DenefitsRequest) => [
        contract.userId,
        contract,
      ])
    );
  }, [denefitsContracts]);

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
      id: "denefitsContract",
      header: ({ column }) => (
        <SortableHeader column={column} title="Denefits Contract" />
      ),
      accessorFn: (row) => {
        const contract = denefitsContractsMap.get(row.id);
        return contract ? "Active" : "Inactive";
      },
      cell: ({ row }) => {
        const contract = denefitsContractsMap.get(row.original.id);
        const status = contract ? "Active" : "Inactive";
        return (
          <div>
            <CategoryBadge category={status} />
          </div>
        );
      },
      filterFn: denefitsStatusFilterFn,
    },
    {
      accessorKey: "isPremiumClient",
      id: "isPremiumClient",
      header: ({ column }) => (
        <SortableHeader column={column} title="Is Premium" />
      ),
      cell: ({ row }) => {
        const isPremium = row.getValue("isPremiumClient") as boolean;
        return (
          <div>
            <CategoryBadge category={isPremium ? "Yes" : "No"} />
          </div>
        );
      },
      filterFn: premiumFilterFn,
    },
    {
      accessorKey: "firstName",
      id: "firstName",
      header: ({ column }) => (
        <SortableHeader column={column} title="First Name" />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue("firstName")}</div>;
      },
    },
    {
      accessorKey: "middleName",
      id: "middleName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Middle Name" />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue("middleName")}</div>;
      },
    },
    {
      accessorKey: "lastName",
      id: "lastName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Last Name" />
      ),
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
      header: ({ column }) => (
        <SortableHeader column={column} title="Phone Number" />
      ),
      cell: ({ row }) => {
        return <div>{row.getValue("phoneNumber")}</div>;
      },
    },
    {
      id: "brokerName",
      accessorKey: "brokerName",
      header: ({ column }) => <SortableHeader column={column} title="Broker" />,
      cell: ({ row }) => {
        const brokerName = row.getValue("brokerName") as string | undefined;
        return (
          <div className={brokerName === "" ? "text-muted-foreground" : ""}>
            {brokerName}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const id = row.original.id;
        const status = undefined; // id ? approvedByIds.get(id) : undefined;
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

  useEffect(() => {
    const col = table.getColumn("activeStatus");
    if (!col) return;

    if (roleFilter === "all") {
      col.setFilterValue(undefined);
    } else {
      col.setFilterValue(roleFilter);
    }
  }, [roleFilter, table]);

  useEffect(() => {
    const col = table.getColumn("denefitsContract");
    if (!col) return;

    if (denefitsStatusFilter === "all") {
      col.setFilterValue(undefined);
    } else {
      col.setFilterValue(denefitsStatusFilter);
    }
  }, [denefitsStatusFilter, table]);

  useEffect(() => {
    const col = table.getColumn("isPremiumClient");
    if (!col) return;

    if (premiumFilter === "all") {
      col.setFilterValue(undefined);
    } else {
      col.setFilterValue(premiumFilter);
    }
  }, [premiumFilter, table]);

  if (isLoading) {
    return <Spinner displayText="Loading clients..." />;
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter"
          // value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
          value={globalFilter}
          // onChange={(event) => table.getColumn("email")?.setFilterValue(event.target.value)}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        <span className="ml-5">Status :</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <span className="mr-2">
                {roleFilter === "all" ? "All Status" : roleFilter}
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={roleFilter}
              onValueChange={setRoleFilter}
            >
              <DropdownMenuRadioItem value="all">
                All Status
              </DropdownMenuRadioItem>
              {UserActiveStatusEnum.options.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {status}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="ml-5">Denefits :</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <span className="mr-2">
                {denefitsStatusFilter === "all"
                  ? "All Status"
                  : denefitsStatusFilter}
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={denefitsStatusFilter}
              onValueChange={setDenefitsStatusFilter}
            >
              <DropdownMenuRadioItem value="all">
                All Status
              </DropdownMenuRadioItem>
              {DenefitsStatusEnum.options.map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {status}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="ml-5">Premium :</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <span className="mr-2">
                {premiumFilter === "all" ? "All" : premiumFilter}
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              value={premiumFilter}
              onValueChange={setPremiumFilter}
            >
              <DropdownMenuRadioItem value="all">All</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="Yes">Yes</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="No">No</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border flex">
        <ScrollArea type="always" className="w-1 flex-1">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
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
                      <TableCell key={cell.id} className="whitespace-nowrap">
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
      <DataTablePagination table={table} />
    </div>
  );
};

export default ClientsList;

const ActionCell = ({
  row,
  status,
}: {
  row: any;
  status?: UserFundMapStatus | null;
}) => {
  // const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const handleOpen = () => {
    router.push(`/admin/clients/${row.original.id}`);
  };

  return (
    <>
      {/* <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`Client Details`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-10/12 flex flex-col items-start justify-start min-h-[80vh] "
      >
        <TabView formSetOpen={setOpen} data={row.original} status={status} />
      </ResponsiveDialog> */}

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
              onClick={() => handleOpen()}
              className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
            >
              <IconMenu
                text="Details"
                icon={<ViewIcon className="h-4 w-4" />}
              />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
