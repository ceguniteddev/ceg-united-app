"use client";
import Link from "next/link";
import { TrendingUp, Building2 } from "lucide-react";
import { Business } from "@/schema";
import { cn } from "@/lib/utils";

interface Props {
  business: Business;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BusinessCard({ business }: Props) {
  return (
    <Link
      href={`/client/my-business/${business.id}`}
      className="block text-left bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 w-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {getInitials(business.businessName)}
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {business.businessName}
            </h3>
            <p className="text-xs text-gray-400">
              EIN: {business.employerIdentificationNumber}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0 ml-2">
          Active
        </span>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5 mb-4">
        {business.businessEmail && (
          <p className="text-xs text-gray-500 truncate">
            {business.businessEmail}
          </p>
        )}
        {business.businessCityAddress && business.businessStateAddress && (
          <p className="text-xs text-gray-400">
            {business.businessCityAddress}, {business.businessStateAddress}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
        <Building2 className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <span className="text-xs text-gray-400">View details →</span>
      </div>
    </Link>
  );
}

interface AddBusinessCardProps {
  onClick: () => void;
}

export function AddBusinessCard({ onClick }: AddBusinessCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white rounded-xl border-2 border-dashed border-blue-200 p-5 hover:border-blue-400 hover:from-blue-100 transition-all duration-200 min-h-[180px] w-full"
    >
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
        <span className="text-2xl text-blue-600 font-light leading-none">
          +
        </span>
      </div>
      <span className="text-sm font-semibold text-gray-700">
        Add New Business
      </span>
    </button>
  );
}
