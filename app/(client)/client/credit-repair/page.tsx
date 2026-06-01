import React from "react";
import HeaderBox from "@/components/HeaderBox";

export default function CreditRepairPage() {
  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 md:p-8">
      <header className="home-header">
        <HeaderBox
          title="Credit Repair"
          subtext="Manage and monitor your credit repair progress."
        />
      </header>

      <div className="flex flex-col gap-6 w-full flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Credit Module Pro</h2>
          <p className="text-gray-600 mb-6">
            Welcome to the Credit Repair module. Here you can track disputes,
            view your credit score updates, and take action to improve your
            credit profile.
          </p>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg border border-blue-100">
            <p className="font-medium">
              Module features are currently being initialized...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
