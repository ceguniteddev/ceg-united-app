import React from "react";
import { Button } from "@/components/ui/button";

import { BanknoteIcon, Link2Icon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ItemLink from "./LinkItem";
import IncomeLink from "./LinkIncome";
import ApplyFunding from "./funding/ApplyFunding";

const Link = () => {
  return (
    <div className="flex flex-row gap-2">
      <ApplyFunding />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="cursor-pointer">
            <Link2Icon className="mr-2 h-4 w-4" />
            Link Account
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2">
          <div className="grid gap-1">
            <ItemLink />
            <IncomeLink />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

Link.displayName = "Link";

export default Link;
