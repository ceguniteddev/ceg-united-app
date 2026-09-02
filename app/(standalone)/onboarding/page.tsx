"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  DollarSign,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeeSettings } from "@/hooks/fee-settings";
import { useUpdateUserOnboardingMutation } from "@/hooks/user";

const steps = [
  {
    eyebrow: "Your account is ready",
    title: "Start free with income-based funding",
    description:
      "Explore your dashboard and use income-based funding without a paid membership.",
    icon: Sparkles,
    bullets: [
      "Free client account",
      "Income-based funding access",
      "Browse education pathways",
    ],
  },
  {
    eyebrow: "One monthly membership",
    title: "Unlock the CEG Brain platform",
    description:
      "Platform Access opens audits, analysis, credit reporting, and the paid baseline experience.",
    icon: DollarSign,
    bullets: [
      "Audits and diagnostics",
      "Analysis and credit reports",
      "Cancel and manage billing securely",
    ],
  },
  {
    eyebrow: "Education-led access",
    title: "Courses add knowledge and tools",
    description:
      "Purchase only the courses you need. Higher funding courses unlock cumulative tool sets, while course content remains individual.",
    icon: BookOpen,
    bullets: [
      "Credit to Capital unlocks disputes",
      "First $50K unlocks foundational tools",
      "$150K and $250K+ expand funding tools",
    ],
  },
  {
    eyebrow: "You are in control",
    title: "Choose your next step",
    description:
      "Continue to your dashboard now. You can upgrade from the Access Center whenever you are ready.",
    icon: Check,
    bullets: [
      "No forced checkout",
      "Clear locked-feature guidance",
      "Your access grows with verified purchases",
    ],
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { data: fees } = useFeeSettings();
  const { updateOnboarding, isUpdating } = useUpdateUserOnboardingMutation();
  const current = steps[step];
  const Icon = current.icon;

  const finish = async (destination = "/client/home") => {
    await updateOnboarding();
    router.replace(destination);
    router.refresh();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-3xl overflow-hidden rounded-2xl border border-blue-200 bg-white">
        <div className="h-1 bg-blue-100">
          <div
            className="h-full bg-blue-500 transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
        <div className="p-7 sm:p-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Icon className="h-6 w-6" />
          </div>
          <p className="mt-8 text-sm font-semibold text-blue-700">
            {current.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {current.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
            {current.description}
          </p>
          {step === 1 && (
            <p className="mt-4 text-2xl font-bold text-blue-700">
              ${(fees?.platformAccessPrice ?? 499).toLocaleString()}/month
            </p>
          )}
          <ul className="mt-8 grid gap-3 sm:grid-cols-3">
            {current.bullets.map((bullet) => (
              <li
                key={bullet}
                className="flex min-h-20 items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-5 text-blue-950"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-blue-600">
                  <CircleCheck className="size-4" aria-hidden="true" />
                </span>
                <span className="pt-0.5">{bullet}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="ghost"
              className="text-blue-700 hover:bg-blue-50 hover:text-blue-900"
              disabled={isUpdating}
              onClick={() => finish()}
            >
              <LayoutDashboard className="mr-2 size-4" aria-hidden="true" />
              Skip to dashboard
            </Button>
            {step < steps.length - 1 ? (
              <Button
                className="bg-blue-500 hover:bg-blue-600"
                onClick={() => setStep((value) => value + 1)}
              >
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="border-blue-200 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-900"
                  disabled={isUpdating}
                  onClick={() => finish()}
                >
                  <LayoutDashboard className="mr-2 size-4" aria-hidden="true" />
                  Open dashboard
                </Button>
                <Button
                  className="bg-blue-500 hover:bg-blue-600"
                  disabled={isUpdating}
                  onClick={() => finish("/client/platform-access")}
                >
                  View Platform Access
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
