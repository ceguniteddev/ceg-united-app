"use client";
import Spinner from "@/components/Spinner";
import { useUserQuery } from "@/hooks/user";
import { useParams } from "next/navigation";
import React from "react";

const AccountDashboardPage = () => {
  const params = useParams();
  const { users, isLoading } = useUserQuery("xsuVjDYopJWVoh5djQTB");
  console.log(users);
  if (isLoading) return <Spinner />;
  return <div>AccountDashboardPage</div>;
};

export default AccountDashboardPage;
