"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brokerage } from "@/schema/brokerage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Globe,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useState } from "react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import BrokerageForm from "./form";
import { ConfirmButton } from "@/components/Confirmation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import IconMenu from "@/components/icon-menu";
import Spinner from "@/components/Spinner";

const columnHelper = createColumnHelper<Brokerage>();

export default function BrokerageList() {
  const queryClient = useQueryClient();
  const [editingBrokerage, setEditingBrokerage] = useState<Brokerage | null>(
    null,
  );
  const [deletingBrokerage, setDeletingBrokerage] = useState<Brokerage | null>(
    null,
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const { data: brokerages, isLoading } = useQuery<Brokerage[]>({
    queryKey: ["brokerages"],
    queryFn: async () => {
      const res = await fetch("/api/admin/brokerages");
      if (!res.ok) throw new Error("Failed to fetch brokerages");
      return res.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/brokerages/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete brokerage");
    },
    onSuccess: () => {
      toast.success("Brokerage deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["brokerages"] });
      setDeletingBrokerage(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const columns = React.useMemo<ColumnDef<Brokerage, any>[]>(
    () => [
      columnHelper.accessor("companyName", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Company Name" />
        ),
        cell: (info) => <div className="font-medium">{info.getValue()}</div>,
      }),
      columnHelper.accessor("website", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Website" />
        ),
        cell: (info) => {
          const website = info.getValue();
          return website ? (
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center text-blue-600 hover:underline"
            >
              <Globe className="mr-1 h-3 w-3" />
              {website}
            </a>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
      }),
      columnHelper.accessor("email", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Email" />
        ),
        cell: (info) => (
          <div className="flex items-center gap-1.5 text-sm">
            <Mail className="h-3.5 w-3.5 text-slate-400" />
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor("contactNumbers", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Contact Numbers" />
        ),
        cell: (info) => {
          const contacts = info.getValue();
          return contacts && contacts.length > 0 ? (
            <div className="flex flex-col gap-1">
              {contacts.map((c: { number: string }, i: number) => (
                <span key={i} className="text-sm flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-slate-400" />
                  {c.number}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          );
        },
        sortingFn: (rowA, rowB) => {
          const contactsA = rowA.getValue("contactNumbers") as Array<{
            number: string;
          }>;
          const contactsB = rowB.getValue("contactNumbers") as Array<{
            number: string;
          }>;
          const numA = contactsA?.[0]?.number || "";
          const numB = contactsB?.[0]?.number || "";
          return numA.localeCompare(numB);
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => (
          <div className="text-right">
            <ActionMenu
              brokerage={info.row.original}
              onEdit={setEditingBrokerage}
              onDelete={setDeletingBrokerage}
            />
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: brokerages || [],
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
    <div className="space-y-4 mt-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <Input
          placeholder="Search brokerages..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full sm:max-w-sm h-10 sm:h-11 bg-white"
        />
      </div>

      <div className="rounded-md border bg-white hidden md:flex">
        <ScrollArea
          type="always"
          className="w-1 flex-1 h-[calc(100vh-380px)] min-h-[400px]"
        >
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
                    className="h-24 text-center text-gray-500"
                  >
                    No brokerages found.
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="align-top pt-4">
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

      <div className="md:hidden space-y-3 px-1 sm:px-0">
        {table.getRowModel().rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md bg-white">
            No brokerages found.
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const brokerage = row.original;
            return (
              <Card key={brokerage.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-bold break-words">
                        {brokerage.website ? (
                          <a
                            href={brokerage.website}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-2"
                          >
                            <Building2 className="w-4 h-4 text-blue-500" />
                            {brokerage.companyName}
                          </a>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-500" />
                            {brokerage.companyName}
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <ActionMenu
                      brokerage={brokerage}
                      onEdit={setEditingBrokerage}
                      onDelete={setDeletingBrokerage}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {brokerage.email}
                    </div>
                    {brokerage.contactNumbers &&
                    brokerage.contactNumbers.length > 0 ? (
                      <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-100">
                        {brokerage.contactNumbers.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 text-slate-700"
                          >
                            <Phone className="h-4 w-4 text-slate-400" />
                            {c.number}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground italic mt-2 pt-2 border-t border-slate-100">
                        No contact numbers
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

      <ResponsiveDialog
        isOpen={!!editingBrokerage}
        setIsOpen={(open) => !open && setEditingBrokerage(null)}
        title={
          <div className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            <CardTitle>Edit Brokerage</CardTitle>
          </div>
        }
        description="Update brokerage details."
        className="w-[95vw] max-w-[95vw] sm:w-11/12 md:w-8/12 lg:w-6/12 xl:w-4/12"
      >
        {editingBrokerage && (
          <BrokerageForm
            initialData={editingBrokerage}
            onSuccess={() => setEditingBrokerage(null)}
            onClose={() => setEditingBrokerage(null)}
          />
        )}
      </ResponsiveDialog>

      <ConfirmButton
        open={!!deletingBrokerage}
        onOpenChange={(open: boolean) => !open && setDeletingBrokerage(null)}
        onConfirm={() => {
          if (deletingBrokerage?.id)
            deleteMutation.mutate(deletingBrokerage.id);
        }}
        isLoading={deleteMutation.isPending}
        showTrigger={false}
        description={`Are you sure you want to delete the brokerage "${deletingBrokerage?.companyName}"? This action cannot be undone.`}
      />
    </div>
  );
}

const ActionMenu = ({
  brokerage,
  onEdit,
  onDelete,
}: {
  brokerage: Brokerage;
  onEdit: (b: Brokerage) => void;
  onDelete: (b: Brokerage) => void;
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
            className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
            onClick={() => onEdit(brokerage)}
          >
            <IconMenu text="Edit" icon={<Pencil className="h-4 w-4" />} />
          </Button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0">
          <Button
            variant="ghost"
            className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
            onClick={() => onDelete(brokerage)}
          >
            <IconMenu text="Delete" icon={<Trash2 className="h-4 w-4" />} />
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
