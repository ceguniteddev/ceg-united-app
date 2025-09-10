// app/contact/page.tsx
"use client";

import React, { useMemo, useState } from "react";
import CalendlyScheduler from "./CalendlyScheduler";

// …import any auth helpers if you attach ID tokens to API calls

type ApiResult = { ok?: boolean; id?: string; error?: string };

export default function ContactPage() {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  // --- call request state (unchanged from your earlier form) ---
  const [callPending, setCallPending] = useState(false);
  const [callMsg, setCallMsg] = useState<string | null>(null);

  async function submitRequestCall(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCallMsg(null);
    setCallPending(true);

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = { ...data, timezone };

    try {
      const res = await fetch("/api/contact/request-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: ApiResult = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setCallMsg("✅ Your request has been submitted. We’ll reach out soon.");
      form.reset();
    } catch (err: any) {
      setCallMsg(`❌ ${err.message || "Submission failed"}`);
    } finally {
      setCallPending(false);
    }
  }

  // --- schedule state for toggle / prefill ---
  const [useCalendly, setUseCalendly] = useState(true);
  const [prefillName, setPrefillName] = useState("");
  const [prefillEmail, setPrefillEmail] = useState("");

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto w-full max-w-5xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="text-gray-600 mt-2">
            We’d love to hear from you. Choose the best way to get in touch.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Request Customer Service Call (form) */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Request Customer Service Call
            </h2>
            <p className="text-gray-600 mb-4">
              Need immediate assistance? Submit a request and we’ll call you back.
            </p>

            <form onSubmit={submitRequestCall} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">Full Name *</label>
                  <input
                    name="fullName"
                    required
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone *</label>
                  <input
                    name="phone"
                    required
                    inputMode="tel"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">Topic</label>
                  <select name="topic" className="mt-1 w-full rounded-lg border px-3 py-2">
                    <option>General</option>
                    <option>Billing</option>
                    <option>Technical</option>
                    <option>Account</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Preferred Window</label>
                  <select
                    name="preferredWindow"
                    className="mt-1 w-full rounded-lg border px-3 py-2"
                  >
                    <option>Any</option>
                    <option>Morning</option>
                    <option>Afternoon</option>
                    <option>Evening</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">Details</label>
                <textarea
                  name="details"
                  rows={4}
                  className="mt-1 w-full rounded-lg border px-3 py-2"
                />
              </div>

              <button
                type="submit"
                disabled={callPending}
                className="w-full rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {callPending ? "Submitting..." : "Request a Call"}
              </button>

              {callMsg && <p className="text-sm mt-2">{callMsg}</p>}
            </form>
          </div>

          {/* Schedule Consulting: toggle between Calendly and your existing form */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-800">
                Schedule One-on-One Consulting
              </h2>
            </div>

            <p className="text-gray-600 mb-4">
              Book a personalized consulting session with one of our experts.
            </p>

            <CalendlyScheduler />
            <p className="text-xs text-gray-500 mt-2">
              After scheduling, we automatically record your booking in our system.
            </p>
          </div>
        </div>

        {/* General contact info */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">General Phone</h3>
            <p className="text-gray-700 text-xl font-medium">
              <a href="tel:+18884915131">888-491-5131</a>
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">General Email</h3>
            <p className="text-blue-600 font-medium">
              <a href="mailto:Info@cegunited.com">Info@cegunited.com</a>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
