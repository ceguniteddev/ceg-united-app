"use client";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { Business, CompatibilityFactor } from "@/schema";

interface Props {
  business: Business;
  factors?: CompatibilityFactor[];
}

export function FundabilityAuditTab({ business, factors = [] }: Props) {
  const verificationItems = [
    {
      label: "EIN",
      value: business.employerIdentificationNumber || "—",
      met: !!business.employerIdentificationNumber,
    },
    {
      label: "Business Name",
      value: business.businessName || "—",
      met: !!business.businessName,
    },
    {
      label: "State",
      value: business.businessStateAddress || "—",
      met: !!business.businessStateAddress,
    },
    {
      label: "Email",
      value: business.businessEmail || "—",
      met: !!business.businessEmail,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Business Verification Checklist */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          Business Verification
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {verificationItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg"
            >
              {item.met ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-sm font-medium text-gray-900 break-all">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lender Compatibility Factors */}
      {factors.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-bold text-gray-900 mb-4">
            Lender Compatibility Factors
          </h3>
          <div className="space-y-3">
            {factors.map((f) => (
              <div
                key={f.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                {f.met ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {f.label}
                  </p>
                  <p className="text-xs text-gray-500">{f.detail}</p>
                </div>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    f.met
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-600"
                  }`}
                >
                  {f.met ? "Meets" : "Below"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center text-gray-400">
          <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">
            Lender compatibility analysis not yet available.
          </p>
        </div>
      )}
    </div>
  );
}
