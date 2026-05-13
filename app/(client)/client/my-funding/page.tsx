"use client";

import HeaderBox from "@/components/HeaderBox";
import { FundingBankProducts } from "./_funding/ApplyFundingList";
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
              label: `${format(new Date(app.appliedDate), "MMM d, yyyy")} - ${app.interestedProduct}`,
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
    <section className="space-y-6 p-4 sm:p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <HeaderBox
          title="Apply Funding"
          subtext="Manage your funding applications."
        />
        <div className="w-full md:w-auto">
          <ApplyFunding userId={user.uid} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Reference Number Filter */}
        {referenceOptions.length > 0 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <label
              htmlFor="reference-filter"
              className="text-sm font-medium text-gray-900"
            >
              Filter by Application:
            </label>
            <Select
              value={selectedReference}
              onValueChange={setSelectedReference}
              defaultValue={referenceOptions[0]?.value}
            >
              <SelectTrigger
                className="w-full sm:max-w-xs border-gray-200 focus:border-blue-600 focus:ring-blue-600"
                id="reference-filter"
              >
                <SelectValue placeholder="Select application date" />
              </SelectTrigger>
              <SelectContent>
                {referenceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <section className="flex w-full flex-col gap-6">
          <FundingBankProducts selectedReference={selectedReference} />
        </section>
      </div>

      {/* Floating assistant button */}
      {/* <button
        className="group fixed bottom-6 right-6 size-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center z-30 lg:bottom-8 lg:right-8"
        aria-label="Assistant"
      >
        <Bot className="size-5 transition-all group-hover:fill-white group-hover:stroke-[1.5]" />
      </button> */}
    </section>
  );
};

export default ApplyFundingPage;
