"use client";
import ClientsList from "@/app/(admin)/admin/clients/list";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import React from "react";

const ClientsPage = () => {
  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-row justify-between">
            <HeaderBox title="Clients" />
          </div>
        </header>

        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            <ClientsList />
          </section>
        </div>
      </div>
    </section>
  );
};

export default withAdminGuard(ClientsPage);
