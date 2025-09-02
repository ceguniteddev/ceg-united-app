"use client";

import React, { useCallback, useState } from "react";

import IconMenu from "@/components/icon-menu";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilesIcon, MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { ApplyFunding } from "@/schema/apply-funding";
import ApplyFundingForm from "@/components/funding/ApplyFundingForm";
import DeleteConfirmation from "@/components/delete-confirmation";
import { toast } from "sonner";
import { useApplyFunding } from "@/hooks/apply-funding";
import DocumentsDisplay from "@/components/funding/DocumentsDisplay";
import ViewApplication from "@/components/funding/ViewApplication";

type Props = {
  data: ApplyFunding;
};

export function RowActions({ data }: Props) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`View Application - ${data.referenceNumber}`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-3/6"
      >
        <ViewApplication formData={data} formSetOpen={setOpen} />
      </ResponsiveDialog>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[160px] z-50">
          <DropdownMenuItem className="group flex w-full items-center justify-between  text-left p-0 text-sm font-base text-neutral-500 ">
            <button
              onClick={() => {
                setOpen(true);
              }}
              className="w-full justify-start flex rounded-md p-2 transition-all duration-75 hover:bg-neutral-100"
            >
              <IconMenu text="View" icon={<SquarePen className="h-4 w-4" />} />
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
