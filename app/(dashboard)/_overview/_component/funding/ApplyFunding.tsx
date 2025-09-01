import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import { BanknoteIcon } from "lucide-react";
import React from "react";
import ApplyFundingForm from "./ApplyFundingForm";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ApplyFundingSuccessful from "./ApplyFundingSuccessful";
import { cn } from "@/lib/utils";

const ApplyFunding = () => {
  const [open, setOpen] = React.useState(false);
  const [congratsOpen, setCongratsOpen] = React.useState(false);

  return (
    <div>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title="Apply Funding"
        description="* Please make sure all the details are correct"
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-3/6"
      >
        <ApplyFundingForm setOpen={setOpen} setCongratsOpen={setCongratsOpen} />
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
        variant="outline"
        className="bg-green-200 hover:bg-green-400 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <BanknoteIcon className="mr-2 h-4 w-4" />
        {"Apply Funding"}
      </Button>
    </div>
  );
};

export default ApplyFunding;
