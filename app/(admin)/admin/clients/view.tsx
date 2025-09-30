import IconMenu from "@/components/icon-menu";
import { Button } from "@/components/ui/button";
import { UserWithId } from "@/schema/registration";
import { format } from "date-fns";
import { CircleX } from "lucide-react";
import type { Metadata } from "next";
import React from "react";

function toDate(d?: string | Date) {
  if (!d) return undefined;
  return d instanceof Date ? d : new Date(d);
}

function fmtDate(d?: Date) {
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

export const metadata: Metadata = {
  title: "User Profile",
};

const ClientData = ({ user, setOpen }: { user: UserWithId; setOpen: (open: boolean) => void }) => {
  const birth = toDate(user.birthdate);
  const registered = toDate(user.registrationDate);

  const name = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");

  return (
    <main className="mx-auto w-full">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">User Details</h1>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Info label="Name" value={name} />
          <Info label="SSN" value={user.ssn} />
          <Info label="Email" value={user.email} />
          <Info label="Phone" value={user.phoneNumber} />

          <Info label="Birthdate" value={format(user.birthdate, "MMM d, yyyy")} />
          <Info label="Gender" value={user.gender || "—"} />

          <Info label="Registered" value={fmtDate(registered)} />

          <Info label="Street" value={user.addressStreet} />
          <Info label="City" value={user.addressCity} />
          <Info label="State" value={user.addressState} />
          <Info label="Postal Code" value={user.addressPostal} />
        </div>
      </section>
      <div className="flex justify-end">
        <Button
          variant={"ghost"}
          onClick={() => setOpen(false)}
          className="mt-4 cursor-pointer bg-blue-200 hover:bg-blue-300"
        >
          <IconMenu icon={<CircleX className="h-4 w-4" />} text="Close" />
        </Button>
      </div>
    </main>
  );
};

export default ClientData;

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-gray-900">{value || "—"}</div>
    </div>
  );
}
