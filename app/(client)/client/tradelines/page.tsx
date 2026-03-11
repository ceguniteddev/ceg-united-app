"use client";

import ClientTradelinesTable from "@/components/ClientTradelinesTable";
import ClientPurchasedTradelinesTable from "@/components/ClientPurchasedTradelinesTable";
import { withClientGuard } from "@/components/wrapper";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function TradelinesPage() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Tradelines</h2>
      </div>
      <Tabs defaultValue="available" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-8">
          <TabsTrigger value="available">Available Tradelines</TabsTrigger>
          <TabsTrigger value="purchased">Purchased Tradelines</TabsTrigger>
        </TabsList>
        <TabsContent value="available" className="mt-0">
          <ClientTradelinesTable />
        </TabsContent>
        <TabsContent value="purchased" className="mt-0">
          <ClientPurchasedTradelinesTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withClientGuard(TradelinesPage);
