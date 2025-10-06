"use client";

import { z } from "zod";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, Globe, MapPin, Hash, Link as LinkIcon } from "lucide-react";
import { Business, businessRecordSchema } from "@/schema";

// ---- Utilities ----
const formatCurrency = (n?: number) =>
  typeof n === "number" ? n.toLocaleString(undefined, { style: "currency", currency: "USD" }) : "—";

const formatPhone = (raw: string) => {
  // very naive US phone prettifier; tweak as needed
  const digits = raw.replace(/\D+/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
};

const Address = ({ rec }: { rec: Business }) => (
  <div className="flex items-start gap-2 text-sm">
    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="leading-tight">
      <div className="font-medium">{rec.businessStreetAddress}</div>
      <div className="text-muted-foreground">
        {rec.businessCityAddress}, {rec.businessStateAddress} {rec.businessPostalAddress}
      </div>
    </div>
  </div>
);

function BusinessRecordCard({ rec }: { rec: Business }) {
  return (
    <Card className="group relative overflow-hidden border-2 border-transparent bg-gradient-to-b from-white to-muted/30 transition hover:border-primary/40 dark:from-background dark:to-muted/10">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />

      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl md:text-2xl">{rec.businessName}</CardTitle>
          </div>
          <Badge variant="secondary" className="whitespace-nowrap">
            User #{rec.userId}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1.5">
          <Hash className="h-4 w-4" /> EIN: {rec.employerIdentificationNumber}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Address rec={rec} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href={`mailto:${rec.businessEmail}`}
            className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted"
          >
            <Mail className="h-4 w-4" />
            <span className="truncate">{rec.businessEmail}</span>
          </a>

          <a
            href={`tel:${rec.businessPhoneNumber}`}
            className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted"
          >
            <Phone className="h-4 w-4" />
            <span>{formatPhone(rec.businessPhoneNumber)}</span>
          </a>

          {rec.businessWebsite && (
            <a
              href={
                rec.businessWebsite.startsWith("http")
                  ? rec.businessWebsite
                  : `https://${rec.businessWebsite}`
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted"
            >
              <Globe className="h-4 w-4" />
              <span className="truncate">{rec.businessWebsite}</span>
            </a>
          )}

          {rec.socialMedia && (
            <a
              href={
                rec.socialMedia.startsWith("http") ? rec.socialMedia : `https://${rec.socialMedia}`
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted"
            >
              <LinkIcon className="h-4 w-4" />
              <span className="truncate">{rec.socialMedia}</span>
            </a>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-md border p-3">
            <div className="text-xs uppercase text-muted-foreground">Last Year Taxes</div>
            <div className="text-lg font-semibold">{formatCurrency(rec.lastYearTaxes)}</div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs uppercase text-muted-foreground">Current Year Taxes</div>
            <div className="text-lg font-semibold">{formatCurrency(rec.currentYearTaxes)}</div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap items-center gap-2">
        {rec.businessWebsite && (
          <Button asChild size="sm" variant="outline">
            <a
              href={
                rec.businessWebsite.startsWith("http")
                  ? rec.businessWebsite
                  : `https://${rec.businessWebsite}`
              }
              target="_blank"
              rel="noreferrer"
            >
              <Globe className="mr-2 h-4 w-4" /> Visit Site
            </a>
          </Button>
        )}
        {rec.socialMedia && (
          <Button asChild size="sm" variant="ghost">
            <a
              href={
                rec.socialMedia.startsWith("http") ? rec.socialMedia : `https://${rec.socialMedia}`
              }
              target="_blank"
              rel="noreferrer"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Social
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// ---- Page ----
export default function BusinessRecordsPage({ records }: { records?: Business[] }) {
  // Demo data (remove when wiring to your backend)
  const demo: Business[] = [
    {
      id: "1",
      userId: "1001",
      businessName: "Somersby & Finch Pty Ltd",
      businessStreetAddress: "123 Market Street",
      businessCityAddress: "Sydney",
      businessStateAddress: "NSW",
      businessPostalAddress: "22000",
      employerIdentificationNumber: "12-3456789",
      businessPhoneNumber: "0287654321",
      businessEmail: "info@somersbyfinch.com",
      businessWebsite: "somersbyfinch.com",
      socialMedia: "twitter.com/somersbyfinch",
      lastYearTaxes: 84231.25,
      currentYearTaxes: 91200,
    },
    {
      id: "2",
      userId: "1002",
      businessName: "Blatt Consulting",
      businessStreetAddress: "55 Collins St",
      businessCityAddress: "Melbourne",
      businessStateAddress: "VIC",
      businessPostalAddress: "32000",
      employerIdentificationNumber: "98-7654321",
      businessPhoneNumber: "0399991111",
      businessEmail: "hello@blatt.com.au",
      businessWebsite: "https://blatt.com.au",
      socialMedia: "linkedin.com/company/blatt",
      lastYearTaxes: 125000,
      currentYearTaxes: 131500,
    },
  ];

  const list = (records && records.length > 0 ? records : demo).map((r) =>
    businessRecordSchema.parse(r)
  ); // validate each one

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            Business Records
          </h1>
          <p className="text-muted-foreground">All your business details at a glance.</p>
        </div>
        <Badge className="text-sm">
          {list.length} record{list.length === 1 ? "" : "s"}
        </Badge>
      </header>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((rec) => (
          <BusinessRecordCard key={rec.id ?? rec.businessName} rec={rec} />
        ))}
      </section>
    </main>
  );
}

/*
Usage (Next.js App Router):
- Save this file as app/business-records/page.tsx, or render <BusinessRecordsPage records={yourArray} /> from any page.
- Replace the `demo` data with your fetched records (e.g., from Firestore).
- If your schema lives elsewhere, import it and remove the duplicate here.

Accessibility/Responsiveness:
- Card contents are laid out as a single column on mobile and a responsive grid on larger screens.
- Interactive elements (email/phone/site) use <a> tags for native behaviors.
- Tailwind colors/adornments (gradients, subtle borders) give it a pleasant, colorful UI without sacrificing contrast.
*/
