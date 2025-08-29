import React from "react";
import { Button } from "@/components/ui/button";

import { Link2Icon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import ItemLink from "./LinkItem";
import IncomeLink from "./LinkIncome";
import LinkAssetReport from "./LinkAssetReport";

const Link = () => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start rounded-md">
          <Link2Icon className="mr-2 h-4 w-4" />
          Link Account
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2">
        <div className="grid gap-1">
          <ItemLink />
          <IncomeLink />
          <LinkAssetReport />
        </div>
      </PopoverContent>
    </Popover>
  );
};

Link.displayName = "Link";

export default Link;
