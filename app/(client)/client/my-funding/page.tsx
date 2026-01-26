"use client";

import HeaderBox from "@/components/HeaderBox";
import ApplyFundingList from "./_funding/ApplyFundingList";
import { useAuth } from "@/provider/AuthContext";
import ApplyFunding from "@/components/fundingv2/ApplyFunding";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import Spinner from "@/components/Spinner";

const ApplyFundingPage = () => {
  const { user } = useAuth();
  const { appliedFunding, isLoading: isLoadingFunding } =
    useGetClientApplyFunding(user?.uid || "");

  const referenceOptions = useMemo(() => {
    if (!appliedFunding || appliedFunding.length === 0) return [];

    // Get unique reference numbers with their applied dates
    const uniqueReferences = appliedFunding
      .filter((app) => app.referenceNumber) // Only include items with reference numbers
      .reduce(
        (acc, app) => {
          if (!acc.find((item) => item.value === app.referenceNumber)) {
            acc.push({
              value: app.referenceNumber!,
              label: format(new Date(app.appliedDate), "MMM dd, yyyy"),
              date: new Date(app.appliedDate),
            });
          }
          return acc;
        },
        [] as Array<{ value: string; label: string; date: Date }>,
      );

    // Sort by date descending (newest first)
    return uniqueReferences.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [appliedFunding]);

  const [selectedReference, setSelectedReference] = useState<string>(
    referenceOptions[0]?.value || "",
  );

  // Update selected reference when reference options change
  useEffect(() => {
    if (referenceOptions.length > 0 && !selectedReference) {
      setSelectedReference(referenceOptions[0].value);
    }
  }, [referenceOptions, selectedReference]);

  if (!user) return null;

  if (isLoadingFunding) return <Spinner />;

  return (
    <section className="home-content">
      <div className="home-header flex flex-col md:flex-row md:justify-between gap-4">
        <HeaderBox
          title="Apply Funding"
          subtext="Manage your funding applications."
        />
        <ApplyFunding userId={user.uid} />
      </div>

      <div className="space-y-6">
        {/* Reference Number Filter */}
        {referenceOptions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
            <label
              htmlFor="reference-filter"
              className="text-sm font-medium text-gray-700"
            >
              Filter by Application:
            </label>
            <Select
              value={selectedReference}
              onValueChange={setSelectedReference}
              defaultValue={referenceOptions[0]?.value}
            >
              <SelectTrigger
                className="w-full sm:w-[280px]"
                id="reference-filter"
              >
                <SelectValue placeholder="Select application date" />
              </SelectTrigger>
              <SelectContent>
                {referenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label} - {option.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <section className="flex w-full flex-col gap-6">
          <ApplyFundingList selectedReference={selectedReference} />
        </section>
      </div>
    </section>
  );
};

export default ApplyFundingPage;
