"use client";
import React from "react";
import dynamic from "next/dynamic";

const AdminDashboard = dynamic(() => import("./_component/Statistics"), {
  ssr: false,
});

const AdminPage = () => {
  return (
    <div>
      <AdminDashboard />
    </div>
  );
};

export default AdminPage;
