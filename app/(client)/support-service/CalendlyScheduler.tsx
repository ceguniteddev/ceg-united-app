// app/contact/CalendlyScheduler.tsx
"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { useCalendlyEventListener } from "react-calendly";

const InlineWidget = dynamic(() => import("react-calendly").then((m) => m.InlineWidget), {
  ssr: false,
});

type Props = {
  prefill?: { name?: string; email?: string };
};

export default function CalendlyScheduler() {
  // Ensure a definite string for url
  const calendlyUrl: string =
    process.env.NEXT_PUBLIC_CALENDLY_URL || "https://calendly.com/your-org/consulting-30min";

  // Safety: run only on client
  useCalendlyEventListener({
    onEventScheduled: (evt: MessageEvent<any>) => {
      const payload = evt?.data?.payload;
      const invitee = payload?.invitee;
      const event = payload?.event;

      // Persist booking
      fetch("/api/contact/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: invitee?.name ?? "",
          email: invitee?.email ?? "",
          phone: null,
          company: null,
          topic: "Consulting",
          datetimeLocal: event?.start_time ?? null, // ISO string
          timezone: event?.start_time_zone ?? null,
          notes: "Booked via Calendly embed",
          source: "calendly",
        }),
      }).catch(() => {});
    },
  });

  return (
    <div className="rounded-xl border p-3">
      <InlineWidget
        url={calendlyUrl}
        // styles={{ height: "680px", width: "100%" }}
        // prefill={{ name: prefill?.name, email: prefill?.email }}
        pageSettings={{
          backgroundColor: "ffffff",
          primaryColor: "166534",
          textColor: "111827",
          hideEventTypeDetails: false,
          hideLandingPageDetails: false,
        }}
        utm={{ utmMedium: "contact_page", utmSource: "website" }}
      />
    </div>
  );
}
