"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { useAuth } from "@/provider/AuthContext";
import { ArrowRight, Check, KeyRound, LockKeyhole, Mail } from "lucide-react";

export default function PersonalSettingsPage() {
  const { user } = useAuth();
  const [openChangePassword, setOpenChangePassword] = useState(false);

  if (!user) {
    return null;
  }

  const displayName = user.displayName || "Your account";
  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((name) => name[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f6f7f9] text-slate-950">
      <ResponsiveDialog
        isOpen={openChangePassword}
        setIsOpen={setOpenChangePassword}
        title="Change password"
        description="Choose a strong, unique password for your account."
        className="w-11/12 max-w-md"
        isModal={false}
      >
        <ChangePasswordModal setOpen={setOpenChangePassword} />
      </ResponsiveDialog>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_15%_0%,rgba(37,99,235,0.14),transparent_34%),radial-gradient(circle_at_88%_10%,rgba(30,64,175,0.09),transparent_30%)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        <header className="mb-10 max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">
            Account settings
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
            Personal settings
          </h1>
          <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-slate-600">
            Review your account details and keep your sign-in credentials
            secure.
          </p>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
          <section
            aria-labelledby="security-heading"
            className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_70px_-42px_rgba(15,23,42,0.35)] ring-1 ring-slate-200/80"
          >
            <div className="border-b border-slate-100 px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-900/15">
                  <LockKeyhole className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <h2
                    id="security-heading"
                    className="text-xl font-semibold tracking-tight text-slate-950"
                  >
                    Sign-in & security
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Manage how you access your CEG United account.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 sm:px-8">
              <div className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <KeyRound className="size-[1.125rem]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">Password</p>
                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      Use at least 8 characters with a mix of letters and
                      numbers.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="group h-10 shrink-0 rounded-xl border-slate-200 px-4 font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                  onClick={() => setOpenChangePassword(true)}
                >
                  Change password
                  <ArrowRight
                    className="ml-2 size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Button>
              </div>
            </div>
          </section>

          <aside className="rounded-[1.5rem] bg-[#102a56] p-6 text-white shadow-[0_24px_70px_-38px_rgba(30,64,175,0.65)]">
            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold ring-1 ring-inset ring-white/10">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold">{displayName}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="my-6 h-px bg-white/10" />

            <div className="flex items-center gap-2.5 text-sm text-slate-300">
              <span className="flex size-6 items-center justify-center rounded-lg bg-blue-300/15 text-blue-200">
                <Check className="size-3.5" aria-hidden="true" />
              </span>
              Signed in securely
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
