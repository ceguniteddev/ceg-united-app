"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Link2Icon, BanknoteIcon, FileTextIcon, BadgeDollarSignIcon } from "lucide-react";

type Props = {
  ready: boolean;
  openBankLink: () => void; // e.g. Plaid Link `open()`
  onAssetReport: () => void;
  onIncomeVerification: () => void;
};

export function LinkMenu({ ready, openBankLink, onAssetReport, onIncomeVerification }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          type="button"
          disabled={!ready}
          className="w-full justify-start rounded-md"
        >
          <Link2Icon className="mr-2 h-4 w-4" />
          Link Account
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onSelect={openBankLink}>
          <BanknoteIcon className="mr-2 h-4 w-4" />
          Bank Account
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onAssetReport}>
          <FileTextIcon className="mr-2 h-4 w-4" />
          Asset Report
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onIncomeVerification}>
          <BadgeDollarSignIcon className="mr-2 h-4 w-4" />
          Income Verification
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
