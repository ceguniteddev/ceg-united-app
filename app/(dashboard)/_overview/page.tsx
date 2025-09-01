"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "./_component/Link";
import dynamic from "next/dynamic";

const Dock = dynamic(() => import("./_component/Dock"), {
  ssr: false,
});
const Accounts = dynamic(() => import("./_component/Accounts"), {
  ssr: false,
});
const ApplyFundingList = dynamic(() => import("./_component/funding/ApplyFundingList"), {
  ssr: false,
});
const OverviewPage = () => {
  return (
    <div className="flex justify-center items-center flex-col gap-6">
      <Card className="w-3/4">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Link your bank account</CardDescription>
          <CardAction>
            <Link />
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <Accounts />
        </CardContent>
      </Card>

      <Card className="w-3/4">
        <CardHeader>
          <CardTitle>Funding Application</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplyFundingList />
        </CardContent>
      </Card>

      <Dock />
    </div>
  );
};

export default OverviewPage;
