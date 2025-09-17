"use client";
import { useSearchParams } from "next/navigation";
import React from "react";

const RedirectPage = () => {
  const searchParams = useSearchParams();

  console.log("redirect page", searchParams);
  return <div>RedirectPage</div>;
};

export default RedirectPage;
