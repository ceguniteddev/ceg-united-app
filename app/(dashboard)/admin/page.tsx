"use client";
import React from "react";
import dynamic from "next/dynamic";

const Users = dynamic(() => import("./_component/user-list"), {
  ssr: false,
});

const AdminPage = () => {
  return (
    <div>
      <Users />
    </div>
  );
};

export default AdminPage;
