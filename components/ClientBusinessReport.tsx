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
import { Button } from "@/components/ui/button";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  Link as LinkIcon,
} from "lucide-react";
import { Business, businessRecordSchema } from "@/schema";
import { useBusinessQuery } from "@/hooks/business";
import Spinner from "@/components/Spinner";
import { EmptyState } from "./EmptyState";

// ---- Utilities ----
const formatCurrency = (n?: number) =>
  typeof n === "number"
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
    : "—";

const formatPhone = (raw: string) => {
  const digits = raw.replace(/\D+/g, "");
  if (digits.length === 10)
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return raw;
};

// --- New Social Link Helper ---
const getSocialLink = (platform: string, handle: string): string => {
  // Sanitize handle by removing a leading '@' if present
  const sanitizedHandle = handle.startsWith("@") ? handle.substring(1) : handle;
  switch (platform.toLowerCase()) {
    case "instagram":
      return `https://instagram.com/${sanitizedHandle}`;
    case "tiktok":
      return `https://tiktok.com/@${sanitizedHandle}`;
    case "facebook":
      return `https://facebook.com/${sanitizedHandle}`;
    case "youtube":
      return `https://youtube.com/@${sanitizedHandle}`;
    case "x":
      return `https://x.com/@${sanitizedHandle}`;
    default:
      // A reasonable fallback for other platforms
      return `https://www.${platform
        .toLowerCase()
        .replace(/\s+/g, "")}.com/${sanitizedHandle}`;
  }
};

const Address = ({ rec }: { rec: Business }) => (
  <div className="flex items-start gap-2 text-sm">
    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
    <div className="leading-tight">
      <div className="font-medium">
        {rec.businessStreetAddress}{" "}
        {rec.businessStreetHouseNumber
          ? `, ${rec.businessStreetHouseNumber}`
          : ``}
      </div>
      <div className="text-muted-foreground">
        {rec.businessCityAddress}, {rec.businessStateAddress}{" "}
        {rec.businessPostalAddress}
      </div>
    </div>
  </div>
);

function BusinessRecordCard({ rec }: { rec: Business }) {
  return (
    <Card className="group relative flex flex-col overflow-hidden border-2 border-transparent bg-gradient-to-b from-white to-muted/30 transition hover:border-primary/40 dark:from-background dark:to-muted/10">
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/20" />

      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl md:text-2xl">
              {rec.businessName}
            </CardTitle>
          </div>
        </div>
        <CardDescription className="flex items-center gap-1.5">
          <Hash className="h-4 w-4" /> EIN: {rec.employerIdentificationNumber}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        <Address rec={rec} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
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

          {/* --- MODIFIED: Social Media Links Display --- */}
          {Array.isArray(rec.socialMedia) &&
            rec.socialMedia.map((social, index) => (
              <a
                key={index}
                href={getSocialLink(
                  social?.platform ?? "",
                  social?.handle ?? ""
                )}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 rounded-md border p-2 hover:bg-muted"
              >
                <LinkIcon className="h-4 w-4" />
                <div>
                  <span className="font-medium capitalize">
                    {social?.platform}:{" "}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {social?.handle}
                  </span>
                </div>
              </a>
            ))}
        </div>

        {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-1">
          <div className="rounded-md border p-3">
            <div className="text-xs uppercase text-muted-foreground">
              Last Year Gross Income
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(rec.lastYearTaxes)}
            </div>
          </div>
          <div className="rounded-md border p-3">
            <div className="text-xs uppercase text-muted-foreground">
              Current Year Gross Income
            </div>
            <div className="text-lg font-semibold">
              {formatCurrency(rec.currentYearTaxes)}
            </div>
          </div>
        </div> */}
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
        {/* --- REMOVED: Old Social Media Button --- */}
      </CardFooter>
    </Card>
  );
}

// ---- Page ----
export default function BusinessRecordsPage({ userId }: { userId: string }) {
  const { businessData, isLoading } = useBusinessQuery(userId, true);

  const list = businessData?.map((r: Business) =>
    businessRecordSchema.parse(r)
  );

  if (isLoading) {
    return <Spinner displayText="Loading data…" />;
  }

  if (!list || list.length === 0) {
    return <EmptyState title="No Business Records" description="" />;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            Business Records
          </h1>
          <p className="text-muted-foreground">
            All your business details at a glance.
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list?.map((rec: Business) => (
          <BusinessRecordCard key={rec.id ?? rec.businessName} rec={rec} />
        ))}
      </section>
    </main>
  );
}
