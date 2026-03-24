"use client";
import HeaderBox from "@/components/HeaderBox";
import { useAuth } from "@/provider/AuthContext";
import Spinner from "@/components/Spinner";
import ClientBusinessManagement from "@/components/ClientBusinessManagement";
import { useState } from "react";
import { Business } from "@/schema";
import { BusinessGrid } from "@/components/business/BusinessGrid";
import { BusinessDetailView } from "@/components/business/BusinessDetailView";
import { useBusinessQuery } from "@/hooks/business";
import { useBusinessDetails } from "@/hooks/business-details";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const MyBusinessPage = () => {
  const { user } = useAuth();
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null,
  );
  const [isAddingBusiness, setIsAddingBusiness] = useState(false);

  const { businessData, isLoading } = useBusinessQuery(user?.uid ?? "", !!user);

  // Fetch detailed business data when a business is selected
  const { businessDetails, isLoading: isLoadingDetails } = useBusinessDetails(
    selectedBusiness?.id ?? null,
    !!selectedBusiness,
  );

  if (!user) {
    return <Spinner displayText="Loading data..." />;
  }

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business);
  };

  const handleAddBusinessClick = () => {
    setEditingBusiness(null);
    setIsAddingBusiness(true);
  };

  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setSelectedBusiness(null);
    setIsAddingBusiness(true);
  };

  const handleCloseForm = () => {
    setIsAddingBusiness(false);
    setEditingBusiness(null);
  };

  return (
    <section className="home">
      <div className="home-content mb-16 sm:mb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-6">
          <header className="home-header">
            <HeaderBox
              title="My Business"
              subtext="Manage your business information and credit profiles"
            />
          </header>
        </div>

        <BusinessGrid
          businesses={businessData || []}
          isLoading={isLoading}
          onBusinessClick={handleBusinessClick}
          onAddBusinessClick={handleAddBusinessClick}
        />

        {/* Business Detail Modal */}
        <ResponsiveDialog
          isOpen={!!selectedBusiness}
          setIsOpen={(open) => !open && setSelectedBusiness(null)}
          title="Business Details"
          description="View comprehensive business information and credit reports"
          className="max-w-4xl"
        >
          {selectedBusiness && (
            <ScrollArea className="h-[70vh]">
              <div className="p-4">
                {isLoadingDetails ? (
                  <Spinner displayText="Loading business details..." />
                ) : (
                  <BusinessDetailView
                    business={businessDetails || selectedBusiness}
                    crsBusinessProfile={businessDetails?.crsBusinessProfile}
                    crsBusinessScore={businessDetails?.crsBusinessScore}
                    onEdit={(business) => {
                      handleEditBusiness(business);
                    }}
                  />
                )}
              </div>
            </ScrollArea>
          )}
        </ResponsiveDialog>

        {/* Add/Edit Business Form Modal */}
        <ResponsiveDialog
          isOpen={isAddingBusiness}
          setIsOpen={(open) => !open && handleCloseForm()}
          title={editingBusiness ? "Edit Business" : "Add Business"}
          description={
            editingBusiness
              ? "Update your business information"
              : "Create a new business profile"
          }
          className="max-w-4xl"
        >
          <ScrollArea className="h-[70vh]">
            <div className="p-4">
              <ClientBusinessManagement
                userId={user.uid}
                editingBusiness={editingBusiness}
                setEditingBusiness={setEditingBusiness}
                setOpen={setIsAddingBusiness}
                isModal={true}
              />
            </div>
          </ScrollArea>
        </ResponsiveDialog>
      </div>
    </section>
  );
};

export default MyBusinessPage;
