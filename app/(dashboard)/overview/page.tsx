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
import { useAuth } from "@/provider/AuthContext";

const Dock = dynamic(() => import("./_component/Dock"), {
  ssr: false,
});
const Accounts = dynamic(() => import("./_component/Accounts"), {
  ssr: false,
});

const OverviewPage = () => {
  return (
    <div className="flex justify-center items-center">
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

      <Dock />
    </div>
  );
};

export default OverviewPage;
