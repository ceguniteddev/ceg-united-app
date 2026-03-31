"use client";

import PricingTable from "@/components/PricingTable";
import AdminPurchasedTradelinesTable from "@/components/AdminPurchasedTradelinesTable";
import SpecialDealsManagement from "@/components/admin/SpecialDealsManagement";
import { withAdminGuard } from "@/components/wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function AdminTradelinesPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Tradelines</h2>
      </div>
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[600px] mb-8">
          <TabsTrigger value="available">Available Tradelines</TabsTrigger>
          <TabsTrigger value="purchased">Purchased Tradelines</TabsTrigger>
          <TabsTrigger value="special-deals">Special Deals</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-0">
          <PricingTable />
        </TabsContent>
        <TabsContent value="purchased" className="mt-0">
          <AdminPurchasedTradelinesTable />
        </TabsContent>
        <TabsContent value="special-deals" className="mt-0">
          <SpecialDealsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAdminGuard(AdminTradelinesPage);
