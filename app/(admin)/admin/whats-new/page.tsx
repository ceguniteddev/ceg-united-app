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

      <AdminWhatsNew />
    </section>
  );
};

export default withAdminGuard(Page);
