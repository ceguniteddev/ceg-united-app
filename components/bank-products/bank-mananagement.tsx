"use client";

import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BankManagement as BankManagementType,
  bankManagementSchema,
} from "@/schema/bank-management";
import {
  useBankManagementQuery,
  useBankManagementMutation,
} from "@/hooks/admin/bank-management";
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
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Globe,
  Phone,
  Mail,
  User,
  Save,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { CustomFormField } from "@/components/CustomFormField";
import { Form } from "@/components/ui/form";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import Spinner from "@/components/Spinner";
import IconMenu from "@/components/icon-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import SortableHeader from "../SortableHeader";
import { DataTablePagination } from "../funding/pagination";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const columnHelper = createColumnHelper<BankManagementType>();

import { Badge } from "@/components/ui/badge";

const BankManagement = () => {
  const { banks, isLoading } = useBankManagementQuery();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankManagementType | null>(
    null,
  );
  const [deletingBankId, setDeletingBankId] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [filterType, setFilterType] = useState<"all" | "brokerage" | "bank">(
    "all",
  );

  const { deleteBank, isDeleting } = useBankManagementMutation();

  const handleEdit = (bank: BankManagementType) => {
    setEditingBank(bank);
    setIsAddOpen(true);
  };

  const handleDelete = async () => {
    if (deletingBankId) {
      await deleteBank(deletingBankId);
      setDeletingBankId(null);
    }
  };

  const filteredBanks = React.useMemo(() => {
    if (!banks) return [];
    if (filterType === "brokerage") return banks.filter((b) => b.isBrokerage);
    if (filterType === "bank") return banks.filter((b) => !b.isBrokerage);
    return banks;
  }, [banks, filterType]);

  const columns = React.useMemo<ColumnDef<BankManagementType, any>[]>(
    () => [
      columnHelper.accessor("bankName", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Bank Name" />
        ),
        cell: (info) => (
          <div className="font-medium flex flex-col items-start gap-1">
            {info.row.original.isBrokerage && (
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300">
                Brokerage
              </Badge>
            )}
            {info.getValue()}
          </div>
        ),
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
          ) : null;
        },
      }),
      columnHelper.accessor("contacts", {
        header: ({ column }) => (
          <SortableHeader column={column} title="Contacts" />
        ),
        cell: (info) => {
          const contacts = info.getValue();
          return (
            <div className="flex flex-col gap-3">
              {contacts?.map(
                (
                  contact: { name: string; email: string; phone: string },
                  i: number,
                ) => (
                  <div key={i} className="text-sm">
                    <div className="font-semibold flex items-center gap-1">
                      <User className="h-3 w-3" /> {contact.name}
                    </div>
                    <div className="text-muted-foreground text-xs pl-4 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {contact.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {contact.phone}
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
          );
        },
        sortingFn: (rowA, rowB) => {
          const contactsA = rowA.getValue("contacts") as Array<{
            name: string;
          }>;
          const contactsB = rowB.getValue("contacts") as Array<{
            name: string;
          }>;

          const nameA = contactsA?.[0]?.name?.toLowerCase() || "";
          const nameB = contactsB?.[0]?.name?.toLowerCase() || "";

          return nameA.localeCompare(nameB);
        },
      }),
      columnHelper.display({
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: (info) => (
          <div className="text-right">
            <ActionMenu
              bank={info.row.original}
              onEdit={handleEdit}
              onDelete={(id) => setDeletingBankId(id)}
            />
          </div>
        ),
      }),
    ],
    [handleEdit],
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data: filteredBanks,
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
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
        Bank Management
      </h2>
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto items-center">
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full sm:max-w-[200px] h-10 sm:h-11"
          />
          <Select
            value={filterType}
            onValueChange={(val: any) => setFilterType(val)}
          >
            <SelectTrigger className="w-full sm:w-[150px] h-10 sm:h-11 bg-white">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="brokerage">Brokerages</SelectItem>
              <SelectItem value="bank">Banks</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditingBank(null);
            setIsAddOpen(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-9 sm:h-10 whitespace-nowrap"
        >
          <IconMenu text="Add Bank" icon={<Plus className="h-4 w-4" />} />
        </Button>
      </div>

      <div className="rounded-md border hidden md:flex">
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
                    className="h-24 text-center"
                  >
                    No banks found.
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

      <div className="md:hidden space-y-3 px-4 sm:px-0">
        {table.getRowModel().rows.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-dashed rounded-md">
            No banks found.
          </div>
        ) : (
          table.getRowModel().rows.map((row) => {
            const bank = row.original;
            return (
              <Card key={bank.id} className="overflow-hidden">
                <CardHeader className="bg-muted/30 p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1 items-start">
                      <CardTitle className="text-lg font-bold break-words flex flex-col gap-1 items-start">
                        {bank.isBrokerage && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-300">
                            Brokerage
                          </Badge>
                        )}
                        {bank.website ? (
                          <a
                            href={bank.website}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-2"
                          >
                            {bank.bankName}
                          </a>
                        ) : (
                          bank.bankName
                        )}
                      </CardTitle>
                    </div>
                    <ActionMenu
                      bank={bank}
                      onEdit={handleEdit}
                      onDelete={(id) => setDeletingBankId(id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-3">
                  {bank.contacts && bank.contacts.length > 0 ? (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Contacts
                      </div>
                      {bank.contacts.map((contact, i) => (
                        <div
                          key={i}
                          className="text-sm bg-slate-50 p-2.5 rounded-md border border-slate-100"
                        >
                          <div className="font-semibold flex items-center gap-1.5 mb-1.5 text-slate-800">
                            <User className="h-3.5 w-3.5 text-blue-500" />{" "}
                            {contact.name}
                          </div>
                          <div className="text-slate-600 text-xs pl-5 space-y-1">
                            <div className="flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-400" />{" "}
                              {contact.email}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Phone className="h-3 w-3 text-slate-400" />{" "}
                              {contact.phone}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      No contacts listed
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <DataTablePagination table={table} />

      <ResponsiveDialog
        isOpen={isAddOpen}
        setIsOpen={setIsAddOpen}
        title={editingBank ? "Edit Bank" : "Add Bank"}
        description={
          editingBank
            ? "Update bank details and contacts."
            : "Add a new bank to the directory."
        }
        className="w-full sm:max-w-3xl max-w-[95vw]"
      >
        <BankForm
          initialData={editingBank}
          onClose={() => setIsAddOpen(false)}
        />
      </ResponsiveDialog>

      <AlertDialog
        open={!!deletingBankId}
        onOpenChange={(open) => !open && setDeletingBankId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              bank.
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
  bank,
  onEdit,
  onDelete,
}: {
  bank: BankManagementType;
  onEdit: (bank: BankManagementType) => void;
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
            className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
            onClick={() => onEdit(bank)}
          >
            <IconMenu text="Edit" icon={<Pencil className="h-4 w-4" />} />
          </Button>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="p-0">
          <Button
            variant="ghost"
            className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
            onClick={() => onDelete(bank.id || "")}
          >
            <IconMenu text="Delete" icon={<Trash2 className="h-4 w-4" />} />
          </Button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

import { CustomFormCheckbox } from "@/components/CustomFormCheckbox";

const BankForm = ({
  initialData,
  onClose,
}: {
  initialData: BankManagementType | null;
  onClose: () => void;
}) => {
  const { createBank, updateBank, isCreating, isUpdating } =
    useBankManagementMutation();

  const form = useForm<BankManagementType>({
    resolver: zodResolver(bankManagementSchema),
    defaultValues: initialData || {
      bankName: "",
      website: "",
      contacts: [],
      isBrokerage: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contacts",
  });

  useEffect(() => {
    form.reset(
      initialData || {
        bankName: "",
        website: "",
        contacts: [],
        isBrokerage: false,
      },
    );
  }, [initialData, form]);

  const onSubmit = async (data: BankManagementType) => {
    if (initialData?.id) {
      await updateBank({ id: initialData.id, data });
    } else {
      await createBank(data);
    }
    onClose();
  };

  const isSubmitting = isCreating || isUpdating;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <CustomFormCheckbox
          name="isBrokerage"
          label="Set as Brokerage"
          className="bg-blue-50 border-blue-200 text-blue-900"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CustomFormField
            name="bankName"
            label="Bank Name"
            placeholder="e.g. Bank of America"
          />
          <CustomFormField
            name="website"
            label="Website"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Contacts</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ name: "", email: "", phone: "" })}
              className="text-xs h-8 border-dashed border-gray-300 hover:border-gray-400"
            >
              <IconMenu
                text="Add Contact"
                icon={<Plus className="h-3 w-3" />}
              />
            </Button>
          </div>

          {fields.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md">
              No contacts added.
            </div>
          )}

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
            {fields.map((field, index) => (
              <Card key={field.id} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-red-500"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <CustomFormField
                    name={`contacts.${index}.name`}
                    placeholder="Contact Name"
                    label="Name"
                  />
                  <CustomFormField
                    name={`contacts.${index}.email`}
                    placeholder="Email"
                    label="Email"
                    type="email"
                  />
                  <CustomFormField
                    name={`contacts.${index}.phone`}
                    placeholder="Phone"
                    label="Phone"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-24"
          >
            <IconMenu text="Cancel" icon={<XCircle className="h-4 w-4" />} />
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-32 bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <IconMenu
                text="Saving..."
                icon={<Loader2 className="h-4 w-4 animate-spin" />}
              />
            ) : (
              <IconMenu
                text={initialData ? "Update" : "Create"}
                icon={<Save className="h-4 w-4" />}
              />
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BankManagement;
