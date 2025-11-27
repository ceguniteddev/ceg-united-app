"use client";
import ClientsList from "@/app/(admin)/admin/clients/list";
import HeaderBox from "@/components/HeaderBox";

import { withAdminGuard } from "@/components/wrapper";

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
