import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  data: any;
  handleAccountChange: (id: string) => void;
};

const AccountList = ({ data, handleAccountChange }: Props) => {
  return (
    <Select onValueChange={(value) => handleAccountChange(value)}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="" />
      </SelectTrigger>
      <SelectContent>
        {data?.map((a: Account) => (
          <SelectItem key={a.id} value={`${a.id}-${a.bankItemId}`}>
            {a.name} {`(${a.institutionName})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default AccountList;
