"use client";
import React from "react";
import dynamic from "next/dynamic";
import { withAdminGuard } from "@/components/wrapper";

const AdminDashboard = dynamic(() => import("./_component/Statistics"), {
  ssr: false,
});

const AdminPage = () => {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">Dashboard</h1>
      <AdminDashboard />
    </div>
  );
};

export default withAdminGuard(AdminPage);
