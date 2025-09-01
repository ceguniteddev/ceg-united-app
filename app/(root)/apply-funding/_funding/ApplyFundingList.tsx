"use client";
import Spinner from "@/components/Spinner";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApplyFunding } from "@/schema/apply-funding";
import { cn, formatAmount, formatDateTime, getTransactionStatus } from "@/lib/utils";
import { transactionCategoryStyles } from "@/constant/common";
import { Button } from "@/components/ui/button";
import { RowActions } from "./RowActions";

const ApplyFundingList = () => {
  const { appliedFunding, isLoading } = useGetUserApplyFunding();

  if (isLoading) return <Spinner />;

  if (!appliedFunding || appliedFunding.length === 0)
    return <div className="text-center">No funding applied</div>;

  return (
    <Table>
      <TableHeader className="bg-[#f9fafb]">
        <TableRow>
          <TableHead className="px-2">Reference Number</TableHead>
          <TableHead className="px-2">Product</TableHead>
          <TableHead className="px-2 pr-2 text-right">Amount</TableHead>
          <TableHead className="px-2">Applied Date</TableHead>
          <TableHead className="px-2">Status</TableHead>
          <TableHead className="px-2 items-center text-center"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {appliedFunding?.map((t: ApplyFunding) => {
          const amount = formatAmount(t.amountFunding);

          return (
            <TableRow key={t.referenceNumber} className={`#F6FEF9 !over:bg-none !border-b-DEFAULT`}>
              <TableCell className="max-w-[250px] pl-2 pr-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-14 truncate font-semibold text-[#344054]">
                    {t.referenceNumber}
                  </h1>
                </div>
              </TableCell>

              <TableCell className="max-w-[250px] pl-2 pr-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-14 truncate font-semibold text-[#344054]">
                    {t.interestedProduct}
                  </h1>
                </div>
              </TableCell>

              <TableCell className={`pl-2 pr-2 font-semibold #039855 text-right`}>
                ${amount}
              </TableCell>

              <TableCell className="min-w-32 pl-2 pr-2">
                {formatDateTime(new Date(t.appliedDate)).dateTime}
              </TableCell>

              <TableCell className="pl-2 pr-2">
                <CategoryBadge category={t.status} />
              </TableCell>
              <TableCell className="text-right">
                <RowActions data={t} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ApplyFundingList;

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const { borderColor, backgroundColor, textColor, chipBackgroundColor } =
    transactionCategoryStyles[category as keyof typeof transactionCategoryStyles] ||
    transactionCategoryStyles.default;

  return (
    <div className={cn("category-badge", borderColor, chipBackgroundColor)}>
      <div className={cn("size-2 rounded-full", backgroundColor)} />
      <p className={cn("text-[12px] font-medium", textColor)}>{category}</p>
    </div>
  );
};
