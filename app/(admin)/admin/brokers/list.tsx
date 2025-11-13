"use client";
import { DataTablePagination } from "@/components/funding/pagination";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { useGetAllBrokers } from "@/hooks/broker";
import { BrokerRegistration } from "@/schema/broker";
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
import { ChevronDownIcon } from "lucide-react";
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
import { useUpdateBrokerStatusMutation } from "@/hooks/broker";

const statusFilterFn: FilterFn<BrokerRegistration & { id: string }> = (
  row,
  columnId,
  filterValue
) => {
  const raw = row.getValue<string | undefined>(columnId);
  const v = (raw ?? "Active").toLowerCase();
  const sel = String(filterValue ?? "").toLowerCase();
  return v === sel;
};

const BrokersList = () => {
  const [roleFilter, setRoleFilter] = React.useState("all");
  const { brokers, isLoading } = useGetAllBrokers();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const columns: ColumnDef<BrokerRegistration & { id: string }>[] = [
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return <StatusPicker broker={row.original} />;
      },
      size: 200,
    },
  ];

  const table = useReactTable({
    data: brokers || [],
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

  if (isLoading) {
    return <Spinner displayText="Loading brokers..." />;
  }

  return (
    <div className="mx-auto w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Filter"
          value={globalFilter}
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
              {["Active", "InActive", "Paused"].map((status) => (
                <DropdownMenuRadioItem key={status} value={status}>
                  {status}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
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

export default BrokersList;

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
    border: "border-red-700",
    bg: "bg-red-700",
    text: "text-red-700",
    chipBg: "bg-inherit",
  },
  Paused: {
    border: "border-amber-500",
    bg: "bg-amber-500",
    text: "text-amber-700",
    chipBg: "bg-amber-100",
  },
  Active: {
    border: "border-emerald-300",
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    chipBg: "bg-emerald-50",
  },
};

const StatusPicker = ({
  broker,
}: {
  broker: BrokerRegistration & { id: string };
}) => {
  const styles =
    STATUS_STYLES[broker.activeStatus || "Active"] ?? STATUS_STYLES.Active;

  const { updateBrokerStatus, isUpdating } = useUpdateBrokerStatusMutation({
    brokerId: broker.id,
  });

  const handleStatusChange = React.useCallback(
    async (value: string) => {
      if (value) {
        await updateBrokerStatus({
          status: value as "Active" | "InActive" | "Paused",
        });
      }
    },
    [updateBrokerStatus]
  );

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-md p-3 border",
        styles.border,
        styles.chipBg,
      ].join(" ")}
    >
      <span className={["text-sm font-medium", styles.text].join(" ")}>
        Status
      </span>

      <Select
        disabled={!!isUpdating}
        defaultValue={broker.activeStatus ?? "Active"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger
          className={[
            "w-[180px] h-9",
            "border-2",
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
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full",
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
  );
};
