"use client";

import { ArrowRight, BookOpen, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeeSettings } from "@/hooks/fee-settings";
import { useMembership } from "@/hooks/membership";
import { useAuth } from "@/provider/AuthContext";

interface PricingPlansProps {
  onSelectPlan?: (
    planId: string,
    amount: number,
    selectedAddonIds?: string[],
  ) => void;
  isLoading?: boolean;
}

const courses = [
  {
    title: "Credit to Capital",
    price: "$2,000",
    access: "Credit dispute module",
  },
  {
    title: "How to Raise Your First $50K",
    price: "$5,000",
    access: "Foundational funding tools",
  },
  {
    title: "How to Access Up to $150K",
    price: "$15,000",
    access: "Foundational + advanced funding tools",
  },
  {
    title: "How to Access $250K+",
    price: "$25,000",
    access: "All funding categories and expanded lender tools",
  },
];

export function PricingPlans({
  onSelectPlan,
  isLoading = false,
}: PricingPlansProps) {
  const { userData } = useAuth();
  const { data: feeSettings, isLoading: isLoadingSettings } = useFeeSettings();
  const { data: membership } = useMembership(userData?.id);
  const price = feeSettings?.platformAccessPrice ?? 499;
  const hasMembership = membership?.status === "active";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-12 px-4 py-10 sm:px-6">
      <header className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-sm font-semibold text-blue-700">
          <ShieldCheck className="h-4 w-4" /> One membership. Education-led
          growth.
        </span>
        <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
          Unlock CEG Brain Platform Access
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
          Start free with income-based funding, then unlock audits, analysis,
          credit reporting, and the paid platform experience with one monthly
          membership.
        </p>
      </header>

      <section className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-blue-200 bg-white md:grid-cols-[1fr_0.8fr]">
        <div className="p-7 sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">
            CEG Brain Platform Access
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-black tracking-tight text-slate-950">
              ${price.toLocaleString()}
            </span>
            <span className="pb-1 text-lg font-medium text-slate-500">
              / month
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Course purchases are optional and separate. They add specialized
            education and more tools to an active membership.
          </p>
          <Button
            className="mt-7 h-12 w-full bg-blue-600 text-base font-semibold hover:bg-blue-700"
            disabled={isLoading || isLoadingSettings || hasMembership}
            onClick={() => onSelectPlan?.("platform_access", price)}
          >
            {hasMembership ? "Membership Active" : "Get Platform Access"}
            {!hasMembership && <ArrowRight className="ml-2 h-5 w-5" />}
          </Button>
        </div>
        <div className="border-t border-blue-200 bg-blue-600 p-7 text-white sm:p-10 md:border-l md:border-t-0">
          <p className="font-semibold">Platform baseline includes</p>
          <ul className="mt-5 space-y-4 text-sm text-blue-50">
            {[
              "Audit and diagnostic tools",
              "Analysis and credit-report features",
              "Paid CEG Brain platform experience",
              "Eligibility for course-based tool unlocks",
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-white" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* <section>
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <BookOpen className="h-4 w-4" /> Optional education pathways
            </p>
            <h3 className="mt-2 text-2xl font-bold text-slate-950">
              Learn more. Unlock more tools.
            </h3>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {courses.map((course) => (
            <article
              key={course.title}
              className="rounded-xl border border-blue-100 bg-white p-5 transition-colors duration-200 hover:border-blue-300 motion-reduce:transition-none"
            >
              <div className="flex items-start justify-between gap-4">
                <h4 className="font-semibold text-slate-950">{course.title}</h4>
                <span className="whitespace-nowrap text-sm font-bold text-blue-700">
                  {course.price}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Adds: {course.access}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Tool permissions accumulate at higher funding-course levels. Course
          content is purchased individually; Credit to Capital separately
          unlocks the dispute module.
        </p>
      </section> */}
    </div>
  );
}
