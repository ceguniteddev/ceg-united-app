import { Business } from "@/schema";
import { BusinessCard, AddBusinessCard } from "./BusinessCard";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import { Building2 } from "lucide-react";

type BusinessGridProps = {
  businesses: Business[];
  isLoading: boolean;
  onBusinessClick: (business: Business) => void;
  onAddBusinessClick: () => void;
};

export const BusinessGrid = ({
  businesses,
  isLoading,
  onBusinessClick,
  onAddBusinessClick,
}: BusinessGridProps) => {
  if (isLoading) {
    return <Spinner displayText="Loading businesses..." />;
  }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AddBusinessCard onClick={onAddBusinessClick} />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          onClick={() => onBusinessClick(business)}
        />
      ))}
      <AddBusinessCard onClick={onAddBusinessClick} />
    </div>
  );
};
