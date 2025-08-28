"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useAuth } from "@/provider/AuthContext";
import { notFound } from "next/navigation";

const Users = dynamic(() => import("./_component/user-list"), {
  ssr: false,
});

const AdminPage = () => {
  const { user, role } = useAuth();

  if (user && role === "Client") {
    return notFound();
  }

  return (
    <div>
      <Users />
    </div>
  );
};

export default AdminPage;
