"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import HeaderBox from "@/components/HeaderBox";
import BankManagement from "@/components/bank-products/bank-mananagement";
import ProductManagement from "@/components/bank-products/product-management";
import BankProductManagement from "@/components/bank-products/bank-product-management";
import { withAdminGuard } from "@/components/wrapper";

const BankProductsNew = () => {
  const [activeTab, setActiveTab] = useState("banks");

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            <HeaderBox
              title="Bank & Product Management"
              subtext="Manage banks, contacts, and funding products."
            />
          </div>
        </header>

        <div className="w-full">
          <div className="sm:hidden mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="banks">Banks</SelectItem>
                <SelectItem value="products">Products</SelectItem>
                <SelectItem value="bank-products">Bank Products</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-4 hidden sm:inline-flex">
              <TabsTrigger value="banks" className="w-[150px]">
                Banks
              </TabsTrigger>
              <TabsTrigger value="products" className="w-[150px]">
                Products
              </TabsTrigger>
              <TabsTrigger value="bank-products" className="w-[150px]">
                Bank Products
              </TabsTrigger>
            </TabsList>
            <TabsContent value="banks" className="space-y-4">
              <BankManagement />
            </TabsContent>
            <TabsContent value="products" className="space-y-4">
              <ProductManagement />
            </TabsContent>
            <TabsContent value="bank-products" className="space-y-4">
              <BankProductManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
};

export default withAdminGuard(BankProductsNew);
