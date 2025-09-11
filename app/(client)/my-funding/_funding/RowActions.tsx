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
import { MoreHorizontal, SquarePen, Trash2 } from "lucide-react";
import { ApplyFunding } from "@/schema/apply-funding";
import ApplyFundingForm from "@/components/funding/ApplyFundingForm";
import DeleteConfirmation from "@/components/delete-confirmation";
import { toast } from "sonner";
import { useApplyFunding } from "@/hooks/apply-funding";

type Props = {
  data: ApplyFunding;
};

export function RowActions({ data }: Props) {
  const [open, setOpen] = React.useState(false);
  const [openDeleteConfirmation, setOpenDeleteConfirmation] = React.useState(false);
  const { deleteAppliedFunding, isDeleting } = useApplyFunding();

  const handleDeleteConfirmation = useCallback(async () => {
    if (data?.referenceNumber) {
      try {
        await deleteAppliedFunding(data.referenceNumber);
        setOpenDeleteConfirmation(false);
      } catch (error) {
        console.log(error);
        toast.error("Error deleting person!");
      }
    }
  }, [data?.referenceNumber, deleteAppliedFunding]);

  return (
    <>
      <ResponsiveDialog
        isOpen={openDeleteConfirmation}
        setIsOpen={setOpenDeleteConfirmation}
        title="Delete Application"
        className="w-3/12"
      >
        <DeleteConfirmation
          handleDelete={handleDeleteConfirmation}
          isDeleting={isDeleting}
          info={`${data?.referenceNumber}`}
          setModalOpen={setOpenDeleteConfirmation}
        />
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`View Application - ${data.referenceNumber}`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-3/6"
      >
        <ApplyFundingForm data={data} setOpen={setOpen} />
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

          {data.status === "New" && (
            <DropdownMenuItem className="group flex w-full items-center justify-between  text-left p-0 text-sm font-base text-neutral-500 ">
              <button
                onClick={() => {
                  setOpenDeleteConfirmation(true);
                }}
                className="w-full justify-start flex text-red-500 rounded-md p-2 transition-all duration-75 hover:bg-neutral-100"
              >
                <IconMenu text="Delete" icon={<Trash2 className="h-4 w-4" />} />
              </button>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
