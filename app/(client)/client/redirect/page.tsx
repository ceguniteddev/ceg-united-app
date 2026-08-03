"use client";
import { LandmarkIcon } from "lucide-react";
import Link from "next/link";

function Search() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 text-center shadow-lg dark:bg-gray-800 md:p-12">
        <div className="flex justify-center">
          <LandmarkIcon className="h-12 w-12 text-blue-600 dark:text-blue-400 md:h-16 md:w-16" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 md:text-4xl">
          Bank Connection
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Bank account linking is currently unavailable.
        </p>
        <div className="flex justify-center pt-4">
          <Link
            href="/client/home"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-offset-gray-800"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RedirectPage() {
  return <Search />;
}
