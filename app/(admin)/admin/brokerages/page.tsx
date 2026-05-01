"use client";

import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import BrokerageList from "./list";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Building2, PlusIcon } from "lucide-react";
import React from "react";
import BrokerageForm from "./form";
import { CardTitle } from "@/components/ui/card";

const BrokeragesPage = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="home">
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Add New Brokerage</CardTitle>
          </div>
        }
        description="Add a brokerage to shop loans directly from lenders."
        className="w-[95vw] max-w-[95vw] sm:w-11/12 md:w-8/12 lg:w-6/12 xl:w-4/12"
      >
        <BrokerageForm onSuccess={() => setOpen(false)} />
      </ResponsiveDialog>
      <div className="home-content">
        <header className="home-header">
          <div className="flex w-full items-center justify-between">
            <HeaderBox
              title="Brokerages"
              subtext="Manage brokerages and lenders for income-based funding."
            />

            <Button
              className="mt-4 shrink-0 bg-blue-600 hover:bg-blue-700 sm:mt-0"
              onClick={() => setOpen(true)}
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Add Brokerage
            </Button>
          </div>
        </header>
        <BrokerageList />
      </div>
    </section>
  );
};

export default withAdminGuard(BrokeragesPage);
