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

const ApplyFundingList = () => {
  const { appliedFunding, isLoading } = useGetUserApplyFunding();

  if (isLoading) return <Spinner />;

  if (!appliedFunding || appliedFunding.length === 0)
    return <div className="text-center">No funding applied</div>;

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell className="font-medium">INV001</TableCell>
            <TableCell>Paid</TableCell>
            <TableCell>Credit Card</TableCell>
            <TableCell className="text-right">$250.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default ApplyFundingList;
