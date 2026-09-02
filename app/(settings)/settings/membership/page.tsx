import React from "react";
import { getUserMembership } from "@/service/membership";
import { getCurrentUser } from "@/service/user";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CreditCard, ExternalLink } from "lucide-react";
import { getUserAddons } from "@/service/addons";
import { getClientEntitlements } from "@/service/course-capabilities";

export default async function MembershipPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const membership = await getUserMembership(user.uid);
  const addons = await getUserAddons(user.uid, { includeInactive: true });
  const entitlements = await getClientEntitlements(user.uid);
  const hasBillingProfile = Boolean(
    membership?.customerId || membership?.subscriptionId,
  );
  const isRecovering = membership?.entitlementStatus === "grace";
  const effectivePlan =
    membership?.effectivePlan ||
    (membership?.status === "active" ? membership?.tier : "free");

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 h-full max-w-4xl">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-slate-800">
          Membership Settings
        </h2>
      </div>

      <div className="grid gap-6">
        <Card className="border-blue-200 bg-white">
          <CardHeader className="rounded-t-xl border-b border-blue-100 bg-blue-50 pb-4">
            <CardTitle className="text-xl text-slate-800">
              Current Plan
            </CardTitle>
            <CardDescription className="text-slate-500 mt-1.5">
              Manage your CEG Brain membership and billing details.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {membership ? (
              <div className="flex flex-col space-y-4">
                {isRecovering && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950"
                  >
                    <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                    <div className="space-y-2">
                      <p className="font-semibold">Payment update required</p>
                      <p className="text-sm leading-6">
                        Dodo Payments could not process your renewal. Your paid
                        access remains available during the retry period
                        {membership.retryAccessUntil
                          ? ` through ${format(new Date(membership.retryAccessUntil), "MMMM d, yyyy")}`
                          : ""}
                        . Update your payment method to avoid moving to the Free
                        plan.
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Plan
                    </p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {effectivePlan === "free" && "Free"}
                      {effectivePlan === "platform_access" &&
                        "CEG Brain Platform Access"}
                      {(effectivePlan === "tier_starter" ||
                        effectivePlan === "tier_pro" ||
                        effectivePlan === "tier_executive") &&
                        "Grandfathered CEG Brain Access"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full border px-3 py-1 text-sm font-semibold capitalize ${membership.status === "active" ? "border-blue-200 bg-blue-50 text-blue-700" : "border-blue-100 bg-white text-blue-900"}`}
                    >
                      {isRecovering ? "payment retry" : membership.status}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 border-b border-blue-100 pb-5 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Amount
                    </p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                      ${membership.amount}/mo
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Next billing date
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {membership.nextBillingDate
                        ? format(
                            new Date(membership.nextBillingDate),
                            "MMMM d, yyyy",
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Billing model
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {membership.legacyBillingModel ? "Legacy" : "Recurring"}
                    </p>
                  </div>
                  <div className="sm:text-right lg:text-left">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                      Member Since
                    </p>
                    <p className="text-md font-medium text-slate-900 mt-1">
                      {membership.createdAt
                        ? format(new Date(membership.createdAt), "MMMM d, yyyy")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 flex justify-end space-x-4">
                  {hasBillingProfile && (
                    <Button
                      asChild
                      className={
                        isRecovering
                          ? "bg-blue-700 text-white hover:bg-blue-800"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }
                    >
                      <a
                        href={`/api/user/${user.uid}/dodo/customer-portal`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <CreditCard className="mr-2 size-4" />
                        {isRecovering
                          ? "Update payment method"
                          : "Manage billing"}
                        <ExternalLink className="ml-2 size-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">
                  You do not have an active membership.
                </p>
                <Link href="/client/platform-access">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    View Platform Access
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-slate-800">
              Current Capabilities
            </CardTitle>
            <CardDescription>
              Course purchases add tools while Platform Access is active.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              ["Income-based funding", entitlements.hasIncomeFundingAccess],
              ["Audits and analysis", entitlements.hasAnalysisAccess],
              ["Credit reports", entitlements.hasCreditReportAccess],
              ["Credit disputes", entitlements.hasDisputeAccess],
              [
                "Expanded funding tools",
                entitlements.hasNonIncomeFundingAccess,
              ],
            ].map(([label, enabled]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50/40 p-3"
              >
                <span>{label}</span>
                <span
                  className={
                    enabled
                      ? "font-semibold text-blue-700"
                      : "font-medium text-blue-300"
                  }
                >
                  {enabled ? "Available" : "Locked"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        {addons.map((addon) => {
          const addonRecovering = addon.entitlementStatus === "grace";
          const addonActive = addon.status === "active";
          return (
            <Card key={addon.id} className="border-blue-200 bg-white">
              <CardHeader className="rounded-t-xl border-b border-blue-100 bg-blue-50 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl text-slate-800">
                      Credit Repair Addon
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-slate-500">
                      Manage this subscription separately from your CEG Brain
                      membership.
                    </CardDescription>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-semibold capitalize ${addonActive ? "border-blue-200 bg-blue-50 text-blue-700" : "border-blue-100 bg-white text-blue-900"}`}
                  >
                    {addonRecovering ? "payment retry" : addon.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 pt-6">
                {addonRecovering && (
                  <div
                    role="alert"
                    className="flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950"
                  >
                    <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Payment update required</p>
                      <p className="mt-1 text-sm leading-6">
                        Your addon remains available during Dodo&apos;s retry
                        period
                        {addon.retryAccessUntil
                          ? ` through ${format(new Date(addon.retryAccessUntil), "MMMM d, yyyy")}`
                          : ""}
                        . Update your payment method to avoid losing Credit
                        Repair access.
                      </p>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 border-b border-blue-100 pb-5 sm:grid-cols-3">
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Amount
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      ${addon.amount}/mo
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Next billing date
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {addon.nextBillingDate
                        ? format(
                            new Date(addon.nextBillingDate),
                            "MMMM d, yyyy",
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-slate-500">
                      Billing model
                    </p>
                    <p className="mt-1 font-medium text-slate-900">
                      {addon.legacyBillingModel ? "Legacy" : "Recurring"}
                    </p>
                  </div>
                </div>
                {(addon.customerId || addon.subscriptionId) && (
                  <div className="flex justify-end">
                    <Button
                      asChild
                      className={
                        addonRecovering
                          ? "bg-blue-700 text-white hover:bg-blue-800"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }
                    >
                      <a
                        href={`/api/user/${user.uid}/dodo/customer-portal`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <CreditCard className="mr-2 size-4" />
                        {addonRecovering
                          ? "Update addon payment"
                          : "Manage addon billing"}
                        <ExternalLink className="ml-2 size-4" />
                      </a>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
