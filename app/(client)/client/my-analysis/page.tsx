"use client";

import { FundingAnalysis } from "../my-funding/_funding/ApplyFundingList";
import { useAuth } from "@/provider/AuthContext";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import { useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import Spinner from "@/components/Spinner";
import { ChevronDown, FileSearch } from "lucide-react";

const MyAnalysisPage = () => {
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update selected reference when reference options change
  useEffect(() => {
    if (referenceOptions.length > 0 && !selectedReference) {
      setSelectedReference(referenceOptions[0].value);
    }
  }, [referenceOptions, selectedReference]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  const selectedOption = referenceOptions.find(
    (o) => o.value === selectedReference,
  );

  if (!user) return null;

  if (isLoadingFunding) return <Spinner />;

  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto">
        <div className="px-4 sm:px-6 md:px-8 py-5 sm:py-7 max-w-[1200px] mx-auto">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 rounded-xl p-5 sm:p-7 relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
            <div className="absolute bottom-0 left-8 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                <FileSearch className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-white">
                  My Analysis
                </h1>
                <p className="text-xs text-white/70 mt-0.5">
                  AI-powered underwriting assessment for your funding
                  applications
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Application Selector */}
            {referenceOptions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Filter by Application:
                </p>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="w-full sm:max-w-md flex items-center justify-between gap-2 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-50 transition-all shadow-sm min-h-[44px]"
                  >
                    <span className="truncate">
                      {selectedOption
                        ? `${selectedOption.label} — ${selectedOption.value}`
                        : "Select an application..."}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-30 mt-1 w-full sm:max-w-md bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                      {referenceOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSelectedReference(option.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors min-h-[44px] ${
                            option.value === selectedReference
                              ? "bg-blue-50 text-blue-700 font-semibold"
                              : "text-gray-700"
                          }`}
                        >
                          {option.label} — {option.value}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty State — no applications yet */}
            {referenceOptions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <FileSearch className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-700 mb-1">
                  No analysis available
                </h3>
                <p className="text-xs text-gray-400 text-center max-w-[260px]">
                  Submit a funding application to receive your AI-powered
                  underwriting analysis.
                </p>
              </div>
            )}

            {/* Analysis Content */}
            {referenceOptions.length > 0 && (
              <section className="flex w-full flex-col gap-6">
                <FundingAnalysis selectedReference={selectedReference} />
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default MyAnalysisPage;
