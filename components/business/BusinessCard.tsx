import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Business } from "@/schema";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBusinessDetails } from "@/hooks/business-details";

type BusinessCardProps = {
  business: Business;
  onClick: () => void;
};

export const BusinessCard = ({ business, onClick }: BusinessCardProps) => {
  const { businessDetails, isLoading: isLoadingDetails } = useBusinessDetails(
    business?.id ?? null,
    !!business,
  );

  const profile = businessDetails?.crsBusinessProfile?.report;
  const isActive =
    profile?.commercialFraudShieldSummary?.activeBusinessIndicator;

  const getStatusBadge = () => {
    if (isLoadingDetails) {
      return (
        <Badge variant="secondary" className="text-xs">
          Loading...
        </Badge>
      );
    }

    if (isActive === true) {
      return (
        <Badge variant="secondary" className="bg-green-600 text-white text-xs">
          Active
        </Badge>
      );
    }

    if (isActive === false) {
      return (
        <Badge variant="destructive" className="text-xs">
          Inactive
        </Badge>
      );
    }

    return (
      <Badge variant="secondary" className="text-xs">
        Unknown
      </Badge>
    );
  };

  return (
    <Card
      className="group relative flex h-48 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-transparent bg-gradient-to-b from-white to-muted/30 transition-all hover:scale-105 hover:border-primary/40 hover:shadow-xl dark:from-background dark:to-muted/10"
      onClick={onClick}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />

      <CardContent className="relative flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50">
          <Building2 className="text-white" />
        </div>

        <div className="space-y-2">
          <h3 className="font-semibold text-base line-clamp-2">
            {business.businessName}
          </h3>
          <p className="text-xs text-muted-foreground">
            EIN: {business.employerIdentificationNumber}
          </p>
          {getStatusBadge()}
        </div>
      </CardContent>
    </Card>
  );
};

type AddBusinessCardProps = {
  onClick: () => void;
};

export const AddBusinessCard = ({ onClick }: AddBusinessCardProps) => {
  return (
    <Card
      className="group relative flex h-48 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed border-muted-foreground/25 bg-gradient-to-b from-muted/10 to-muted/30 transition-all hover:scale-105 hover:border-primary/40 hover:bg-muted/50"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Building2 className="text-muted-foreground" />
        </div>

        <div className="space-y-1">
          <h3 className="font-semibold text-base">Add Business</h3>
          <p className="text-xs text-muted-foreground">
            Create a new business profile
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
