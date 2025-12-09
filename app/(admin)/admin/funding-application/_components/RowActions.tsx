"use client";

import IconMenu from "@/components/icon-menu";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, SquarePen, View } from "lucide-react";
import { ApplyFunding } from "@/schema/apply-funding";
import ViewApplication from "@/components/funding/AdminViewApplication";
import { useState } from "react";
import { useRouter } from "next/navigation";
import ApplyFundingForm from "@/components/fundingv2/ApplyFundingForm";
import { useUserQuery } from "@/hooks/user";

type Props = {
  data: ApplyFunding;
};

export function RowActions({ data }: Props) {
  const [open, setOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { userData } = useUserQuery(data.userId);

  const router = useRouter();
  const handleOpen = () => {
    router.push(`/admin/funding-application/${data.referenceNumber}`);
  };

  return (
    <>
      <ResponsiveDialog
        isOpen={open}
        setIsOpen={setOpen}
        title={`View Application - ${data.referenceNumber}`}
        // title={`View Application`}
        description=""
        descriptionClassName="text-red-500 text-lg font-semibold"
        className="w-8/12 flex flex-col items-start justify-start min-h-[80vh] "
      >
        <ViewApplication formData={data} formSetOpen={setOpen} />
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={isEditOpen}
        setIsOpen={setIsEditOpen}
        title={`Edit Application - ${data.referenceNumber}`}
        description=""
        className="w-8/12 flex flex-col items-start justify-start min-h-[80vh]"
      >
        {userData && (
          <ApplyFundingForm
            setOpen={setIsEditOpen}
            data={data}
            isEditing={true}
            userData={userData}
          />
        )}
      </ResponsiveDialog>

      <DropdownMenu modal={true}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 cursor-pointer">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[160px] z-50">
          <DropdownMenuItem className="group flex w-full items-center justify-between  text-left p-0 text-sm font-base text-neutral-500 ">
            <button
              onClick={() => {
                handleOpen();
              }}
              className="cursor-pointer w-full justify-start flex rounded-md p-2 transition-all duration-75 hover:bg-neutral-100 cursor-pointer"
            >
              <IconMenu text="View" icon={<View className="h-4 w-4" />} />
            </button>
          </DropdownMenuItem>
          <DropdownMenuItem className="group flex w-full items-center justify-between  text-left p-0 text-sm font-base text-neutral-500 ">
            <button
              onClick={() => {
                setIsEditOpen(true);
              }}
              className="cursor-pointer w-full justify-start flex rounded-md p-2 transition-all duration-75 hover:bg-neutral-100 cursor-pointer"
            >
              <IconMenu text="Edit" icon={<SquarePen className="h-4 w-4" />} />
            </button>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
