"use client";
import Spinner from "@/components/Spinner";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import React from "react";
import { RowActions } from "./RowActions";
import FundingList from "@/components/funding/funding-list";
import { ApplyFundingWithUser } from "@/schema/apply-funding";

const ApplyFundingList = () => {
  const { appliedFunding, isLoading } = useGetUserApplyFunding();

  if (isLoading) return <Spinner />;
  return (
    <FundingList
      appliedFunding={appliedFunding as ApplyFundingWithUser[]}
      rowActions={(data) => <RowActions data={data} />}
    />
  );
};

export default ApplyFundingList;
