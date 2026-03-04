"use client";
import HeaderBox from "@/components/HeaderBox";
import BusinessList from "./list";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import ClientBusinessManagement from "@/components/ClientBusinessManagement";
import { useState } from "react";
import { Business } from "@/schema";
// import PlaidLink from "@/components/PlaidLink";

const MyBusinessPage = () => {
  const { user } = useAuth();
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);

  if (!user) {
    return <Spinner displayText="Loading data..." />;
  }
  return (
    <section className="home">
      <div className="home-content mb-16 sm:mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <header className="home-header">
            <HeaderBox
              title="My Business"
              subtext="Manage your business information"
            />
          </header>
          {/* <div className="w-full sm:w-auto">
            <PlaidLink displayText="Link Business Account" />
          </div> */}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <ClientBusinessManagement
            userId={user.uid}
            editingBusiness={editingBusiness}
            setEditingBusiness={setEditingBusiness}
          />

          <aside className="lg:col-span-5 lg:pl-2 lg:sticky lg:top-24">
            <BusinessList onEdit={(business) => setEditingBusiness(business)} />
          </aside>
        </div>
      </div>
    </section>
  );
};

export default MyBusinessPage;
