import IconMenu from "@/components/icon-menu";
import { Button } from "@/components/ui/button";
import { UserActiveStatus, UserActiveStatusEnum, UserWithId } from "@/schema/registration";
import { format } from "date-fns";
import { CircleX } from "lucide-react";
import type { Metadata } from "next";
import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateUserStatusMutation } from "@/hooks/user";

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

const ClientData = ({ user }: { user: UserWithId }) => {
  const { updateUserStatus, isUpdating } = useUpdateUserStatusMutation();
  const registered = toDate(user.registrationDate);

  const name = [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ");

  const handleStatusChange = useCallback(
    async (value: string) => {
      if (value) {
        await updateUserStatus({ id: user.id, status: value as UserActiveStatus });
      }
    },
    [updateUserStatus, user.id]
  );

  return (
    <main className="mx-auto w-full">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Personal Information</h1>
          <div className="flex items-center gap-2">
            Status{" "}
            <Select
              disabled={isUpdating}
              defaultValue={user.activeStatus || "Active"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {UserActiveStatusEnum.options.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
