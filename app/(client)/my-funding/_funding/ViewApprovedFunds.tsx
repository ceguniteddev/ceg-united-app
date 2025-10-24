// import {
//   useApproveMappedFundsQuery,
//   // useBankProductApplicationMutation,
// } from "@/hooks/admin/funding-application/fund-mapping";

// import Spinner from "@/components/Spinner";
// import { Button } from "@/components/ui/button";
// import {
//   ColumnDef,
//   ColumnFiltersState,
//   flexRender,
//   getCoreRowModel,
//   getFilteredRowModel,
//   getPaginationRowModel,
//   getSortedRowModel,
//   SortingState,
//   useReactTable,
//   VisibilityState,
// } from "@tanstack/react-table";
// import { CheckCircle, Loader2 } from "lucide-react";
// import React, { useMemo, useState } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from "@/components/ui/alert-dialog";

// import { BankFormData } from "@/schema/bank-products";
// import { formatAmount } from "@/lib/utils";
// import { Label } from "@/components/ui/label";
// import CategoryBadge from "@/components/CategoryBadge";
// import { toast } from "sonner";

type Props = {
  userId: string;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
};

const ApprovedFunds = ({ userId, setOpen }: Props) => {
  // return (
  //   <div className="space-y-4">
  //     <h1 className="text-2xl font-bold">Pre Approved Funds</h1>
  //     <BankProductsList userId={userId} />
  //   </div>
  // );
};

// export default ApprovedFunds;

// const BankProductsList = ({ userId }: { userId: string }) => {
//   const { approvedMappedFunds = [], isLoading } = useApproveMappedFundsQuery(userId);

//   const [sorting, setSorting] = React.useState<SortingState>([]);
//   const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
//   const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
//   const [rowSelection, setRowSelection] = React.useState({});
//   const [globalFilter, setGlobalFilter] = React.useState("");

//   const columns: ColumnDef<BankFormData>[] = useMemo(
//     () => [
//       {
//         accessorKey: "bankName",
//         id: "bankName",
//         header: ({ column }) => <Label>Bank Name</Label>,
//         cell: ({ row }) => <div>{row.getValue("bankName")}</div>,
//       },
//       {
//         accessorKey: "productName",
//         id: "productName",
//         header: ({ column }) => <Label>Product Name</Label>,
//         cell: ({ row }) => {
//           const productNames = row.getValue("productName") as string[];

//           return (
//             <div className="flex flex-col gap-1">
//               {" "}
//               {/* gap-1 adds a small space between items */}
//               {productNames.map((name, index) => (
//                 <span key={index}>{name}</span>
//               ))}
//             </div>
//           );
//         },
//       },
//       {
//         accessorKey: "maximumFundingAmount",
//         id: "maximumFundingAmount",
//         header: ({ column }) => <Label>Max Funding Amount</Label>,
//         cell: ({ row }) => <div>{formatAmount(row.getValue("maximumFundingAmount"))}</div>,
//       },
//       {
//         accessorKey: "clientApplicationStatus",
//         id: "clientApplicationStatus",
//         header: ({ column }) => <Label>Status</Label>,
//         cell: ({ row }) => <CategoryBadge category={row.getValue("clientApplicationStatus")} />,
//       },
//       {
//         id: "actions",
//         cell: ({ row }) => <ActionCell row={row} userId={userId} />,
//         size: 80,
//       },
//     ],
//     [userId]
//   );

//   const table = useReactTable({
//     data: approvedMappedFunds || [],
//     columns,
//     onSortingChange: setSorting,
//     onColumnFiltersChange: setColumnFilters,
//     onGlobalFilterChange: setGlobalFilter,
//     getCoreRowModel: getCoreRowModel(),
//     getPaginationRowModel: getPaginationRowModel(),
//     getSortedRowModel: getSortedRowModel(),
//     getFilteredRowModel: getFilteredRowModel(),
//     getColumnCanGlobalFilter: (column) => {
//       return true;
//     },
//     onColumnVisibilityChange: setColumnVisibility,
//     onRowSelectionChange: setRowSelection,
//     state: {
//       sorting,
//       columnFilters,
//       columnVisibility,
//       rowSelection,
//       globalFilter,
//     },
//   });

//   if (isLoading) return <Spinner displayText="Loading mapped funds..." />;

//   if (!approvedMappedFunds || approvedMappedFunds.length === 0)
//     return <p className="text-center">No approved funds found.</p>;

//   return (
//     <div className="mx-auto w-full">
//       <div className="overflow-hidden rounded-md border">
//         <Table>
//           <TableHeader>
//             {table.getHeaderGroups().map((headerGroup) => (
//               <TableRow key={headerGroup.id}>
//                 {headerGroup.headers.map((header) => {
//                   return (
//                     <TableHead key={header.id}>
//                       {header.isPlaceholder
//                         ? null
//                         : flexRender(header.column.columnDef.header, header.getContext())}
//                     </TableHead>
//                   );
//                 })}
//               </TableRow>
//             ))}
//           </TableHeader>
//           <TableBody>
//             {table.getRowModel().rows?.length ? (
//               table.getRowModel().rows.map((row) => (
//                 <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
//                   {row.getVisibleCells().map((cell) => (
//                     <TableCell key={cell.id}>
//                       {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                     </TableCell>
//                   ))}
//                 </TableRow>
//               ))
//             ) : (
//               <TableRow>
//                 <TableCell colSpan={columns.length} className="h-24 text-center">
//                   No results.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// };

// const ActionCell = ({ row, userId }: { row: any; userId: string }) => {
//   const { applyBankProduct, isApplying } = useBankProductApplicationMutation();
//   // State to control the dialog's visibility
//   const [isDialogOpen, setIsDialogOpen] = useState(false);

//   // This function handles the confirmation logic
//   const handleConfirm = async (event: React.MouseEvent<HTMLButtonElement>) => {
//     // 1. Prevent the dialog from closing immediately on click
//     event.preventDefault();

//     try {
//       await applyBankProduct({ userId, bankProductId: row.original.id });

//       // 4. On success, close the dialog and reset the submitting state
//       setIsDialogOpen(false);
//     } catch (error) {
//       toast.error("Failed to submit application.");
//       console.error("Submission failed:", error);
//     }
//   };

//   return (
//     <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
//       <AlertDialogTrigger asChild>
//         <Button
//           variant={"outline"}
//           disabled={row.original.clientApplicationStatus !== "Not Applied"}
//           className="cursor-pointer bg-green-200 hover:bg-green-300"
//         >
//           <CheckCircle className="mr-2 h-4 w-4" /> Apply
//         </Button>
//       </AlertDialogTrigger>
//       <AlertDialogContent>
//         <AlertDialogHeader>
//           <AlertDialogTitle>Are you sure you want to apply?</AlertDialogTitle>
//           <AlertDialogDescription>
//             This action will submit an application to{" "}
//             <span className="font-semibold">{row.original.bankName}</span> for the product{" "}
//             <span className="font-semibold">{row.original.productName.join(", ")}</span>.
//           </AlertDialogDescription>
//         </AlertDialogHeader>
//         <AlertDialogFooter>
//           <AlertDialogCancel className="cursor-pointer" disabled={isApplying}>
//             Cancel
//           </AlertDialogCancel>
//           <AlertDialogAction
//             className="cursor-pointer"
//             onClick={handleConfirm}
//             disabled={isApplying}
//           >
//             {isApplying ? (
//               <>
//                 <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 Submitting...
//               </>
//             ) : (
//               "Confirm & Apply"
//             )}
//           </AlertDialogAction>
//         </AlertDialogFooter>
//       </AlertDialogContent>
//     </AlertDialog>
//   );
// };
