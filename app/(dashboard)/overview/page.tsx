"use client";
import React, { useEffect } from "react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "./_component/Link";
import dynamic from "next/dynamic";
import { useSelectedInstitutionStoreStore } from "@/store/plaid";
import Spinner from "@/components/Spinner";

const Dock = dynamic(() => import("./_component/Dock"), {
  ssr: false,
});
const Accounts = dynamic(() => import("./_component/Accounts"), {
  ssr: false,
});

const OverviewPage = () => {
  const { selectedInstitution } = useSelectedInstitutionStoreStore();

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
          {!selectedInstitution ? <Spinner /> : <Accounts />}
        </CardContent>
      </Card>

      <Dock />
    </div>
  );
};

export default OverviewPage;
