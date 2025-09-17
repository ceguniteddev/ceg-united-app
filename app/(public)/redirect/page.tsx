"use client";
import Spinner from "@/components/Spinner";
import { LandmarkIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { Suspense } from "react";

function Search() {
  const searchParams = useSearchParams();
  console.log(searchParams);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex items-center space-x-4 rounded-lg bg-white p-12 shadow-lg dark:bg-gray-800">
        <LandmarkIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Welcome Bank!</h1>
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return (
    <Suspense fallback={<Spinner displayText="Loading..." />}>
      <Search />
    </Suspense>
  );
}
