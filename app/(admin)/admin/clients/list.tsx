"use client";
import { DataTablePagination } from "@/components/funding/pagination";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useUsersQuery } from "@/hooks/user";
import { UserFundMapStatus, UserWithId } from "@/schema/registration";
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
import { DenefitsRequest, DenefitsStatusEnum } from "@/schema/payments";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGetWhopPayments } from "@/hooks/admin/payments/whop";
import { useGetAllMemberships } from "@/hooks/membership";
import { MultiSelect } from "@/components/multi-select";

const MEMBERSHIP_OPTIONS = [
  { label: "None", value: "None" },
  { label: "Starter", value: "Starter" },
  { label: "Pro", value: "Pro" },
  { label: "Executive", value: "Executive" },
];

const membershipFilterFn: FilterFn<UserWithId> = (
  row,
  columnId,
  filterValue,
) => {
  const value = row.getValue<string>(columnId);
  if (
    !filterValue ||
    (Array.isArray(filterValue) && filterValue.length === 0)
  ) {
    return true;
  }
  if (Array.isArray(filterValue)) {
    return filterValue.includes(value);
  }
  return value === String(filterValue);
};

const denefitsStatusFilterFn: FilterFn<UserWithId> = (
  row,
  columnId,
  filterValue,
) => {
  // The accessorFn provides the value, which will be "Active" or "InActive"
  const value = row.getValue<string>(columnId);
  const selectedFilter = String(filterValue);
  // If no filter is selected, show all rows
  if (!selectedFilter) return true;

  return value === selectedFilter;
};

const whopPaymentFilterFn: FilterFn<UserWithId> = (
  row,
  columnId,
  filterValue,
) => {
  // The accessorFn provides the value, which will be "Active" or "InActive"
  const value = row.getValue<string>(columnId);
  const selectedFilter = String(filterValue);
  // If no filter is selected, show all rows
  if (!selectedFilter) return true;

  return value === selectedFilter;
};

const ClientsList = () => {
  const [membershipFilter, setMembershipFilter] = useState<string[]>([]);
  const [denefitsStatusFilter, setDenefitsStatusFilter] = useState("all");
  const [whopPaymentFilter, setWhopPaymentFilter] = useState("all");

  const { users, isLoading } = useUsersQuery("Client");
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "registrationDate", desc: true },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const { denefitsContracts, isLoading: denefitsContractsLoading } =
    useGetDenefitsContracts();
  const { whopPayments, isLoading: whopPaymentsLoading } = useGetWhopPayments();
  const { data: allMemberships, isLoading: membershipsLoading } =
    useGetAllMemberships();

  const denefitsContractsMap = useMemo(() => {
    if (!denefitsContracts) return new Map();
    return new Map(
      denefitsContracts.map((contract: DenefitsRequest) => [
        contract.userId,
        contract,
      ]),
    );
  }, [denefitsContracts]);

  const whopPaymentsMap = useMemo(() => {
    if (!whopPayments) return new Map();
    return new Map(
      whopPayments.map((payment: any) => [payment.userId, payment]),
    );
  }, [whopPayments]);

  const membershipsMap = useMemo(() => {
    if (!allMemberships) return new Map();
    return new Map(allMemberships.map((m: any) => [m.userId, m]));
  }, [allMemberships]);

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<UserWithId>[] = [
    {
      id: "clientName",
      header: ({ column }) => (
        <SortableHeader column={column} title="Client Name" />
      ),
      accessorFn: (row) =>
        [row.firstName, row.middleName, row.lastName].filter(Boolean).join(" "),
      cell: ({ row }) => <div>{row.getValue("clientName")}</div>,
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
      id: "registrationDate",
      accessorKey: "registrationDate",
      header: ({ column }) => (
        <SortableHeader column={column} title="Date Added" />
      ),
      cell: ({ row }) => {
        const val = row.getValue("registrationDate") as string | undefined;
        if (!val) return <div>-</div>;
        return <div>{new Date(val).toLocaleDateString()}</div>;
      },
    },
    {
      id: "denefitsContract",
      header: ({ column }) => (
        <SortableHeader column={column} title="Denefits Contract" />
      ),
      accessorFn: (row) => {
        const contract = denefitsContractsMap.get(row.id);
        return contract ? "Active" : "InActive";
      },
      cell: ({ row }) => {
        const contract = denefitsContractsMap.get(row.original.id);
        const status = contract ? "Active" : "InActive";
        return (
          <div>
            <CategoryBadge category={status} />
          </div>
        );
      },
      filterFn: denefitsStatusFilterFn,
    },
    {
      id: "whopPayment",
      header: ({ column }) => (
        <SortableHeader column={column} title="Whop Payment" />
      ),
      accessorFn: (row) => {
        const payment = whopPaymentsMap.get(row.id);
        return payment ? "Active" : "InActive";
      },
      cell: ({ row }) => {
        const payment = whopPaymentsMap.get(row.original.id);
        const status = payment ? "Active" : "InActive";
        return (
          <div>
            <CategoryBadge category={status} />
          </div>
        );
      },
      filterFn: whopPaymentFilterFn,
    },

    {
      id: "membershipType",
      header: ({ column }) => (
        <SortableHeader column={column} title="Membership" />
      ),
      accessorFn: (row) => {
        const membership = membershipsMap.get(row.id);
        if (!membership || membership.status !== "active") return "None";
        if (membership.tier === "tier_starter") return "Starter";
        if (membership.tier === "tier_pro") return "Pro";
        if (membership.tier === "tier_executive") return "Executive";
        return "None";
      },
      cell: ({ row }) => {
        const val = row.getValue("membershipType") as string;
        if (val === "None")
          return (
            <Badge variant="secondary" className="text-xs">
              None
            </Badge>
          );
        return (
          <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300">
            {val}
          </Badge>
        );
      },
      filterFn: membershipFilterFn,
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
    const col = table.getColumn("membershipType");
    if (!col) return;

    if (membershipFilter.length === 0) {
      col.setFilterValue(undefined);
    } else {
      col.setFilterValue(membershipFilter);
    }
  }, [membershipFilter, table]);

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
    const col = table.getColumn("whopPayment");
    if (!col) return;

    if (whopPaymentFilter === "all") {
      col.setFilterValue(undefined);
    } else {
      col.setFilterValue(whopPaymentFilter);
    }
  }, [whopPaymentFilter, table]);

  if (
    isLoading ||
    denefitsContractsLoading ||
    whopPaymentsLoading ||
    membershipsLoading
  ) {
    return <Spinner displayText="Loading clients..." />;
  }

  return (
    <div className="mx-auto w-full">
      <div className="py-4 space-y-3">
        <Input
          placeholder="Filter"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Membership Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Membership
            </label>
            <MultiSelect
              options={MEMBERSHIP_OPTIONS}
              onValueChange={setMembershipFilter}
              value={membershipFilter}
              placeholder="All Membership"
              className="h-9"
            />
          </div>

          {/* Denefits Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Denefits
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between"
                >
                  <span>
                    {denefitsStatusFilter === "all"
                      ? "All Status"
                      : denefitsStatusFilter}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
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
          </div>
          {/* Whop Payment Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted-foreground">
              Whop Payment
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-9 w-full justify-between"
                >
                  <span>
                    {whopPaymentFilter === "all"
                      ? "All Status"
                      : whopPaymentFilter}
                  </span>
                  <ChevronDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[200px]">
                <DropdownMenuRadioGroup
                  value={whopPaymentFilter}
                  onValueChange={setWhopPaymentFilter}
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
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const client = row.original;
            const contract = denefitsContractsMap.get(client.id);
            const denefitsStatus = contract ? "Active" : "Inactive";
            const whopPayment = whopPaymentsMap.get(client.id);
            const whopPaymentStatus = whopPayment ? "Active" : "Inactive";

            return (
              <Card key={row.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base truncate">
                        {row.getValue("clientName")}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {client.email}
                      </p>
                    </div>
                    <ActionCell row={row} status={undefined} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Denefits:</span>
                    <CategoryBadge category={denefitsStatus} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Whop Payment:</span>
                    <CategoryBadge category={whopPaymentStatus} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Membership:</span>
                    <span className="font-medium">
                      {row.getValue("membershipType") === "None" ? (
                        <Badge variant="secondary" className="text-xs">
                          None
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300">
                          {row.getValue("membershipType") as string}
                        </Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium">{client.phoneNumber}</span>
                  </div>
                  {client.brokerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Broker:</span>
                      <span className="font-medium">{client.brokerName}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No results.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="rounded-md border hidden md:flex">
        <ScrollArea
          type="always"
          className="w-1 flex-1 h-[calc(100vh-380px)] min-h-[400px]"
        >
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
                      <TableCell key={cell.id} className="whitespace-nowrap">
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
