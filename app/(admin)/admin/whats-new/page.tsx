"use client";
import React from "react";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import AdminWhatsNew from "./form";

const Page = () => {
  return (
    <section className="transactions">
      <div className="transactions-header flex flex-row justify-between">
        <HeaderBox title="New Features Management" />
      </div>

      <div className="space-y-6">
        <section className="flex w-full flex-col gap-6">
          <AdminWhatsNew />
        </section>
      </div>
    </section>
  );
};

export default withAdminGuard(Page);
