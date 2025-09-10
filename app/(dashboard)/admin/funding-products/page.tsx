"use client";
import React from "react";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import FundingProductsPage from "./product-form";

const FundingProductPage = () => {
  return (
    <section className="transactions">
      <div className="transactions-header flex flex-row justify-between">
        <HeaderBox title="Funding Product Management" />
      </div>

      <div className="space-y-6">
        <section className="flex w-full flex-col gap-6">
          <FundingProductsPage />
        </section>
      </div>
    </section>
  );
};

export default withAdminGuard(FundingProductPage);
