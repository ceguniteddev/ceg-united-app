"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useLeadsQuery, useDeleteLeadMutation } from "@/hooks/admin/leads";
import { Lead } from "@/types/lead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Trash2,
  Loader2,
  Phone,
  Mail,
  User,
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import Spinner from "@/components/Spinner";
import IconMenu from "@/components/icon-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  VisibilityState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import SortableHeader from "@/components/SortableHeader";
import { DataTablePagination } from "@/components/funding/pagination";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

const columnHelper = createColumnHelper<Lead>();

export const LeadManagement = () => {
  const router = useRouter();
  const { data: leads, isLoading } = useLeadsQuery();
  const [deletingLeadId, setDeletingLeadId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const { mutateAsync: deleteLead, isPending: isDeleting } =
    useDeleteLeadMutation();

  const handleDelete = async () => {
    if (deletingLeadId) {
      await deleteLead(deletingLeadId);
      setDeletingLeadId(null);
    }
  };

  const columns = React.useMemo<ColumnDef<Lead, any>[]>(
    () => [
      columnHelper.accessor(
        (row) => `${row.firstName || ""} ${row.lastName || ""}`.trim(),
        {
          id: "name",
          header: ({ column }) => (
            <SortableHeader column={column} title="Name" />
          ),
          cell: (info) => (
            <div className="flex flex-col gap-1 items-start">
              {info.row.original.status && (
                <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                  {info.row.original.status}
                </Badge>
              )}
              <div className="font-medium text-blue-600 hover:underline">
                {info.getValue() || "N/A"}
              </div>
            </div>
          ),
        },
      ),
      columnHelper.accessor("email", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Email" />
        ),
        cell: (info) => (
          <div className="flex items-center text-sm">
            <Mail className="mr-2 h-3 w-3 text-muted-foreground" />
            {info.getValue() || "N/A"}
          </div>
        ),
      }),
      columnHelper.accessor("phoneNumber", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Phone" />
        ),
        cell: (info) => (
          <div className="flex items-center text-sm">
            <Phone className="mr-2 h-3 w-3 text-muted-foreground" />
            {info.getValue() || "N/A"}
          </div>
        ),
      }),
      columnHelper.accessor("fundingType", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Funding Type" />
        ),
        cell: (info) => {
          const type = info.getValue();
          if (!type) return null;
          return (
            <Badge variant="outline" className="bg-slate-50">
              {type}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("createdAt", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Created" />
        ),
        cell: (info) => {
          const date = info.getValue();
          if (!date) return "N/A";
          return (
            <div className="flex items-center text-sm whitespace-nowrap">
              <Calendar className="mr-2 h-3 w-3 text-muted-foreground" />
              {new Date(date).toLocaleDateString()}
            </div>
          );
        },
      }),
    ],
    [],
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: leads || [],
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

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-4">
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Leads</h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
          <Input
            placeholder="Search leads..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full sm:max-w-[300px] h-10 sm:h-11"
          />
        </div>
      </div>

      <div className="rounded-md border hidden md:flex">
        <ScrollArea type="always" className="w-full max-h-[calc(100vh-280px)]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No leads found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/admin/leads/${row.original.id}`)
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-middle">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" className="w-full" />
        </ScrollArea>
      </div>

      <div className="md:hidden space-y-3 px-4 sm:px-0">
        {table.getRowModel().rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
            No leads found.
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const lead = row.original;
            return (
              <Card
                key={lead.id}
                className="overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => router.push(`/admin/leads/${lead.id}`)}
              >
                <CardHeader className="bg-muted/30 p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 items-start">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300 text-[10px] h-4 px-1.5 rounded-sm">
                        {lead.status || "New"}
                      </Badge>
                      <CardTitle className="text-lg font-bold break-words flex flex-col gap-1 items-start text-blue-600">
                        {lead.firstName} {lead.lastName}
                      </CardTitle>
                      {lead.fundingType && (
                        <Badge variant="outline" className="bg-white text-xs">
                          {lead.fundingType}
                        </Badge>
                      )}
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ActionMenu
                        lead={lead}
                        onDelete={(id) => setDeletingLeadId(id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3 space-y-2">
                  <div className="text-sm flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {lead.email || "N/A"}
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {lead.phoneNumber || "N/A"}
                    </div>
                    {lead.createdAt && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <DataTablePagination table={table} />

      <AlertDialog
        open={!!deletingLeadId}
        onOpenChange={(open) => !open && setDeletingLeadId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              lead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ActionMenu = ({
  lead,
  onDelete,
}: {
  lead: Lead;
  onDelete: (id: string) => void;
}) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px] z-50">
        <DropdownMenuItem className="p-0">
          <Button
            variant="ghost"
            className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
            onClick={() => onDelete(lead.id || "")}
          >
            <IconMenu text="Delete" icon={<Trash2 className="h-4 w-4" />} />
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
