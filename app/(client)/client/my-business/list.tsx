import { DataTablePagination } from "@/components/funding/pagination";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  Loader2Icon,
  MoreHorizontal,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import React, { use, useEffect, useMemo, useState } from "react";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import IconMenu from "@/components/icon-menu";
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
import { Business } from "@/schema";
import { useBusinessMutation, useBusinessQuery } from "@/hooks/business";
import { useAuth } from "@/provider/AuthContext";

type BusinessListProps = {
  onEdit: (business: Business) => void;
};

const BusinessList = ({ onEdit }: BusinessListProps) => {
  const { user } = useAuth();
  const { businessData, isLoading } = useBusinessQuery(user?.uid ?? "", true);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const columns: ColumnDef<Business>[] = useMemo(
    () => [
      {
        accessorKey: "businessName",
        id: "businessName",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Business Name <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => <div>{row.getValue("businessName")}</div>,
      },
      {
        accessorKey: "employerIdentificationNumber",
        id: "employerIdentificationNumber",
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Employer Identification Number <ArrowUpDown />
          </Button>
        ),
        cell: ({ row }) => (
          <div>{row.getValue("employerIdentificationNumber")}</div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => <ActionCell row={row} onEdit={onEdit} />,
        size: 80,
      },
    ],
    [onEdit]
  );

  const table = useReactTable({
    data: businessData || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
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
    },
  });

  if (isLoading) return <Spinner displayText="Loading data…" />;

  if (!businessData || businessData.length === 0)
    return <p className="text-center">No Business Found</p>;

  return (
    <div className="mx-auto w-full">
      {/* Desktop Table View */}
      <div className="overflow-hidden rounded-md border hidden md:block">
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

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <Card key={row.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base">
                      {row.original.businessName}
                    </h3>
                  </div>
                  <ActionCell row={row} onEdit={onEdit} />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">EIN</p>
                  <p className="font-medium">
                    {row.original.employerIdentificationNumber}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No results.
            </CardContent>
          </Card>
        )}
      </div>

      <DataTablePagination table={table} />
    </div>
  );
};

export default BusinessList;

const ActionCell = ({
  row,
  onEdit,
}: {
  row: any;
  onEdit: (product: Business) => void;
}) => {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const { deleteBusiness, isDeleting, isDeleteSuccess } = useBusinessMutation();

  const handleDelete = async () => {
    await deleteBusiness(row.original.id);
  };

  useEffect(() => {
    if (isDeleteSuccess && !isDeleting) {
      setIsDeleteOpen(false);
    }
  }, [isDeleteSuccess, isDeleting]);

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
              className="cursor-pointer w-full justify-start rounded-md p-2 hover:bg-neutral-100"
              onClick={() => onEdit(row.original)}
            >
              <IconMenu text="Edit" icon={<PencilIcon className="h-4 w-4" />} />
            </Button>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem className="p-0">
            <Button
              variant="ghost"
              className="cursor-pointer w-full justify-start rounded-md p-2 text-red-500 hover:bg-neutral-100"
              onClick={() => setIsDeleteOpen(true)}
            >
              <IconMenu
                text="Delete"
                icon={<Trash2Icon className="h-4 w-4" />}
              />
            </Button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {isDeleteOpen && (
        <AlertDialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            if (!isDeleting) setIsDeleteOpen(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete{" "}
                <span className="font-semibold">
                  {row.original.productName}
                </span>
                .
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleDelete();
                }}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <IconMenu
                    text="Deleting..."
                    icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu
                    text="Delete"
                    icon={<Trash2Icon className="h-4 w-4 mr-2" />}
                  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
