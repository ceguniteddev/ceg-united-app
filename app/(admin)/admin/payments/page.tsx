"use client";
import HeaderBox from "@/components/HeaderBox";
import { withAdminGuard } from "@/components/wrapper";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DenefitsPaymentsPage from "./denefits/page";
import WhopPaymentsPage from "./whop/page";

const PaymentsPage = () => {
  return (
    <section className="space-y-6 p-4 sm:p-6 md:p-8">
      <HeaderBox title="Payments" subtext="Manage your payments" />
      <Tabs defaultValue="whop" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="whop">Whop</TabsTrigger>
          <TabsTrigger value="denefits">Denefits</TabsTrigger>
        </TabsList>
        <TabsContent value="whop">
          <WhopPaymentsPage />
        </TabsContent>
        <TabsContent value="denefits">
          <DenefitsPaymentsPage />
        </TabsContent>
      </Tabs>
    </section>
  );
};

export default withAdminGuard(PaymentsPage);
