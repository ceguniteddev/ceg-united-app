"use client";

import React, { useMemo, useState } from "react";
import CalendlyScheduler from "./CalendlyScheduler";
import RequestCall from "./RequestCall";

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <section className="mx-auto w-full max-w-5xl space-y-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Contact Us</h1>
          <p className="text-gray-600 mt-2">
            {`We'd love to hear from you. Choose the best way to get in touch.`}
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-4">
            <RequestCall />
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
      </section>
    </main>
  );
}
