"use client";

import HeaderBox from "@/components/HeaderBox";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import React from "react";
import BankProductsForm from "./form";
import { withAdminGuard } from "@/components/wrapper";
import BankProductsList from "./list";

const BankProductsPage = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="transactions">
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`Bank Product Form`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-full max-w-full sm:w-11/12 sm:max-w-5xl lg:w-8/12 max-h-[90vh] overflow-y-auto"
      >
        <BankProductsForm setOpen={setOpen} />
      </ResponsiveDialog>
      <div className="transactions-header flex flex-col sm:flex-row gap-3 sm:justify-between">
        <HeaderBox title="Bank Product Management" />
        <Button
          variant={"outline"}
          className="w-full sm:w-auto h-11 bg-blue-200 hover:bg-blue-300 cursor-pointer"
          onClick={() => setOpen(true)}
        >
          <PlusIcon className="h-4 w-4" />
          Add Bank Product
        </Button>
      </div>

      <div className="space-y-6">
        <section className="flex w-full flex-col gap-6">
          <BankProductsList />
        </section>
      </div>
    </section>
  );
};
export default withAdminGuard(BankProductsPage);
