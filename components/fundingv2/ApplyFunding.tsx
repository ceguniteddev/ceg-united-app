import { Button } from "@/components/ui/button";
import { BanknoteIcon } from "lucide-react";
import React from "react";
import ApplyFundingForm from "@/components/fundingv2/ApplyFundingForm";
import { ResponsiveDialog } from "@/components/responsive-dialog";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ApplyFundingSuccessful from "./ApplyFundingSuccessful";
import { cn } from "@/lib/utils";
import { useUserQuery } from "@/hooks/user";
import Spinner from "../Spinner";
const ApplyFunding = ({ userId }: { userId: string }) => {
  const [open, setOpen] = React.useState(false);

  const { userData, isLoading } = useUserQuery(userId);

  const [congratsOpen, setCongratsOpen] = React.useState(false);

  if (isLoading) return <Spinner displayText="Loading data..." />;

  return (
    <div>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title="Pre-Qualify"
        description={""}
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-[95vw] max-w-[95vw] sm:w-11/12 md:w-8/12 lg:w-8/12 xl:w-2/3 max-h-[90vh] sm:max-h-[85vh]"
      >
        <ApplyFundingForm
          setOpen={setOpen}
          setCongratsOpen={setCongratsOpen}
          userData={userData}
        />
      </ResponsiveDialog>

      <Dialog open={congratsOpen} onOpenChange={setCongratsOpen}>
        <DialogContent
          className={cn(
            "min-h-[30vh] overflow-y-auto w-11/12 md:w-3/5 lg:w-2/5",
          )}
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
        // className="w-full md:w-auto bg-green-200 hover:bg-green-400 cursor-pointer"
        className="cursor-pointer bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto h-10 sm:h-9"
        onClick={() => setOpen(true)}
      >
        <BanknoteIcon className="h-4 w-4" />
        {"Get Pre-Qualify"}
      </Button>
    </div>
  );
};

export default ApplyFunding;
