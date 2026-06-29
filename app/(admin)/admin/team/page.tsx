"use client";

import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import AdminsList from "./list";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, UserPlus } from "lucide-react";
import React from "react";
import InviteAdminForm from "./invite-form";
import { CardTitle } from "@/components/ui/card";

const TeamPage = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="home">
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <CardTitle>Invite New Admin</CardTitle>
          </div>
        }
        description="Send an invitation email to a new administrator with their registration link"
        descriptionClassName="text-muted-foreground text-sm"
        className="w-[95vw] max-w-[95vw] sm:w-11/12 md:w-8/12 lg:w-6/12 xl:w-4/12"
      >
        <InviteAdminForm setOpen={setOpen} />
      </ResponsiveDialog>

      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <HeaderBox
              title="Admin Management"
              subtext="Invite and manage administrative users"
            />
            <Button
              variant={"outline"}
              className="bg-blue-200 hover:bg-blue-300 cursor-pointer w-full sm:w-auto"
              onClick={() => setOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Invite Admin
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            <AdminsList />
          </section>
        </div>
      </div>
    </section>
  );
};

export default withAdminGuard(TeamPage);
