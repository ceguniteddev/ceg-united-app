import { Button } from "@/components/ui/button";
import { BanknoteIcon } from "lucide-react";
import React from "react";
import ApplyFundingForm from "@/components/fundingv2/ApplyFundingForm";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useAuth } from "@/provider/AuthContext";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ApplyFundingSuccessful from "./ApplyFundingSuccessful";
import { cn } from "@/lib/utils";
const ApplyFunding = ({ userId }: { userId: string }) => {
  const [open, setOpen] = React.useState(false);

  const [congratsOpen, setCongratsOpen] = React.useState(false);
  return (
    <div>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title="Pre-Qualify"
        description={""}
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-4/6"
      >
        <ApplyFundingForm
          setOpen={setOpen}
          userId={userId || ""}
          setCongratsOpen={setCongratsOpen}
        />
      </ResponsiveDialog>

      <Dialog open={congratsOpen} onOpenChange={setCongratsOpen}>
        <DialogContent
          className={cn("min-h-[30vh] overflow-y-auto w-2/5")}
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>{""}</DialogTitle>
          </DialogHeader>
          <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
            <ApplyFundingSuccessful fire={congratsOpen} />
          </div>
        </DialogContent>
      </Dialog>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className="bg-green-200 hover:bg-green-400 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <BanknoteIcon className="h-4 w-4" />
        {"Get Pre-Qualify"}
      </Button>
    </div>
  );
};

export default ApplyFunding;
