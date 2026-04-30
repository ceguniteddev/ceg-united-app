import {
  Check,
  Clock,
  FileSearch,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";
import { mockCoordinator } from "@/lib/income-funding-mock";
import type { IncomeFundingDeal } from "@/lib/income-funding-types";

interface SubmittedViewProps {
  deal: IncomeFundingDeal;
}

const timelineSteps = [
  {
    key: "received",
    label: "Application received",
    icon: Send,
    status: "complete" as const,
  },
  {
    key: "verified",
    label: "Documents verified",
    icon: Check,
    status: "complete" as const,
  },
  {
    key: "underwriting",
    label: "Verification in progress",
    icon: FileSearch,
    status: "active" as const,
  },
  {
    key: "offers",
    label: "Offers coming soon",
    icon: Mail,
    status: "pending" as const,
  },
];

export function SubmittedView({ deal: _deal }: SubmittedViewProps) {
  return (
    <div className="space-y-6">
      {/* Status hero */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-8 animate-fade-in-up">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 relative">
            <span className="block w-3 h-3 rounded-full bg-amber-500 pulse-amber" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">
              Under review
            </div>
            <h1 className="mt-1 text-xl md:text-2xl font-bold text-gray-900">
              Your deal has been submitted for verification.
            </h1>
            <p className="mt-2 text-sm text-gray-500 ">
              We typically have offers back within{" "}
              <span className="font-semibold text-gray-700">24-48 hours</span>.
              You'll receive an email the moment your offers are ready.
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 md:p-7 animate-fade-in-up stagger-1">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">
          Deal Timeline
        </h2>
        <ol className="space-y-4">
          {timelineSteps.map((step, i) => {
            const Icon = step.icon;
            const isComplete = step.status === "complete";
            const isActive = step.status === "active";
            return (
              <li key={step.key} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors
                      ${
                        isComplete
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : isActive
                            ? "bg-amber-50 border-amber-300 text-amber-600 pulse-amber"
                            : "bg-white border-gray-200 text-gray-300"
                      }`}
                  >
                    {isComplete ? (
                      <Check className="w-4 h-4" strokeWidth={3} />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </span>
                  {i < timelineSteps.length - 1 && (
                    <span
                      className={`w-0.5 flex-1 mt-1 ${
                        isComplete ? "bg-emerald-200" : "bg-gray-100"
                      }`}
                      style={{ minHeight: "32px" }}
                    />
                  )}
                </div>
                <div className="flex-1 pt-1.5 pb-4">
                  <div
                    className={`text-sm font-semibold ${
                      isComplete
                        ? "text-gray-900"
                        : isActive
                          ? "text-amber-700"
                          : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </div>
                  {isActive && (
                    <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-amber-600">
                      <Clock className="w-3 h-3" />
                      In progress
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Coordinator card */}
      {/* <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-6 animate-fade-in-up stagger-2">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
          Your Loan Coordinator
        </h2>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-lg font-bold shadow-md shrink-0">
            {mockCoordinator.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900">{mockCoordinator.name}</div>
            <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              <a
                href={`mailto:${mockCoordinator.email}`}
                className="inline-flex items-center gap-1 hover:text-brand-600"
              >
                <Mail className="w-3.5 h-3.5" />
                {mockCoordinator.email}
              </a>
              <a
                href={`tel:${mockCoordinator.phone}`}
                className="inline-flex items-center gap-1 hover:text-brand-600"
              >
                <Phone className="w-3.5 h-3.5" />
                {mockCoordinator.phone}
              </a>
            </div>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold text-sm rounded-xl transition">
            <MessageSquare className="w-4 h-4" />
            Message
          </button>
        </div>
      </div> */}

      {/* Empty state for offers */}
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center animate-fade-in-up stagger-3">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center text-gray-400">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="mt-4 text-sm font-bold text-gray-700">
          Your funding offers will appear here once approved
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
          Sit tight — your dedicated coordinator is reviewing your file and
          matching you with the best lenders for your profile.
        </p>
      </div>
    </div>
  );
}
