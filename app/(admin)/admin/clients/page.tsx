"use client";
import ClientsList from "@/app/(admin)/admin/clients/list";
import HeaderBox from "@/components/HeaderBox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

        <ClientsList />
      </div>
    </section>
  );
};

export default withAdminGuard(ClientsPage);
