import Spinner from "@/components/Spinner";
import { useBusinessQuery } from "@/hooks/business";
import { Business } from "@/schema";
import React, { useState } from "react";
import { AddBusinessCard, BusinessCard } from "./BusinessCard";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ClientBusinessManagement from "@/components/ClientBusinessManagement";

const ClientBusiness = ({
  userId,
  isAdminView = false,
}: {
  userId: string;
  isAdminView?: boolean;
}) => {
  const { businessData, isLoading } = useBusinessQuery(userId, !!userId);
  const [isAddOpen, setIsAddOpen] = useState(false);

  if (!userId || isLoading) {
    return <Spinner displayText="Loading businesses..." />;
  }

  const businesses: Business[] = Array.isArray(businessData)
    ? businessData
    : [];

  return (
    <section className="home">
      <div className="home-content pb-8 sm:pb-0">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            My Businesses
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage and monitor your registered businesses
          </p>
        </div>

        {/* Business Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map((biz) => (
            <BusinessCard
              key={biz.id}
              business={biz}
              userId={userId}
              isAdminView={isAdminView}
            />
          ))}
          <AddBusinessCard onClick={() => setIsAddOpen(true)} />
        </div>

        {/* Business Count Footer */}
        {businesses.length > 0 && (
          <p className="mt-6 text-sm text-gray-400">
            {businesses.length} business{businesses.length !== 1 ? "es" : ""}{" "}
            registered
          </p>
        )}
      </div>

      {/* Add Business Modal */}
      <ResponsiveDialog
        isOpen={isAddOpen}
        setIsOpen={setIsAddOpen}
        title="Add New Business"
        className="sm:max-w-3xl w-full"
      >
        <div className="overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
          <ClientBusinessManagement
            userId={userId}
            editingBusiness={null}
            setEditingBusiness={() => {}}
            isModal
            setOpen={setIsAddOpen}
          />
        </div>
      </ResponsiveDialog>
    </section>
  );
};

export default ClientBusiness;
