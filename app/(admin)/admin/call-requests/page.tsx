"use client";
import HeaderBox from "@/components/HeaderBox";
import Spinner from "@/components/Spinner";
import { withAdminGuard } from "@/components/wrapper";
import { useContactUsQuery } from "@/hooks/contact-us";
import React from "react";
import CallRequestList from "./list";
import { RowActions } from "./row-actions";

const CallRequestPage = () => {
  const { requestCalls, isLoading } = useContactUsQuery();
  if (isLoading) {
    return <Spinner displayText="Loading call requests…" />;
  }

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <HeaderBox title="Call Requests" subtext="Manage call requests." />
          </div>
        </header>
        {(!requestCalls || requestCalls.length === 0) && (
          <p className="text-center text-sm sm:text-base">No call requests</p>
        )}

        {requestCalls && requestCalls.length > 0 && (
          <div className="space-y-6">
            <section className="flex w-full flex-col gap-6">
              <CallRequestList
                callRequests={requestCalls}
                rowActions={(data) => <RowActions data={data} />}
              />
            </section>
          </div>
        )}
      </div>
    </section>
  );
};

export default withAdminGuard(CallRequestPage);
