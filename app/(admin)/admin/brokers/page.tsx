"use client";

import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import BrokersList from "./list";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { PlusIcon, UserPlus } from "lucide-react";
import React from "react";
import InviteBrokerForm from "./invite-form";
import { CardTitle } from "@/components/ui/card";

const BrokersPage = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <section className="home">
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            <CardTitle>Invite New Broker</CardTitle>
          </div>
        }
        description="Send an invitation email to a new broker with their registration link"
        descriptionClassName="text-muted-foreground text-sm"
        className="w-4/12 flex flex-col items-start justify-start"
      >
        <InviteBrokerForm setOpen={setOpen} />
      </ResponsiveDialog>
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-row justify-between">
            <HeaderBox
              title="Broker Management"
              subtext="Invite brokers to join your referral program"
            />
            <Button
              variant={"outline"}
              className="bg-blue-200 hover:bg-blue-300 cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <PlusIcon className="h-4 w-4" />
              Invite Broker
            </Button>
          </div>
        </header>

        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            <BrokersList />
          </section>
        </div>
      </div>
    </section>
  );
};

export default withAdminGuard(BrokersPage);
