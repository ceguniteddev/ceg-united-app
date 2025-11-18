import IconMenu from "@/components/icon-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserActiveStatus,
  UserActiveStatusEnum,
  UserWithId,
} from "@/schema/registration";
import { format } from "date-fns";
import { Loader2Icon, RefreshCcw, XIcon } from "lucide-react";
import type { Metadata } from "next";
import React, { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUpdateUserStatusMutation } from "@/hooks/user";
import { useRefreshCRSData } from "@/hooks/crs";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";

function toDate(d?: string | Date) {
  if (!d) return undefined;
  return d instanceof Date ? d : new Date(d);
}

function fmtDate(d?: Date) {
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export const metadata: Metadata = {
  title: "User Profile",
};

const ClientData = ({
  user,
  isBrokerView,
}: {
  user: UserWithId;
  isBrokerView?: boolean;
}) => {
  if (!user) {
    return <EmptyState title="User not found" description="" />;
  }

  const registered = toDate(user.registrationDate);
  const name = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <main className="mx-auto w-full">
      <Card className="max-w-full overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl sm:text-2xl">
              Personal Information
            </CardTitle>
            {!isBrokerView && <DenefitsContract user={user} />}
          </div>
          {!isBrokerView && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
              <RefreshCRSData userId={user.id} />
              <StatusPicker user={user} />
            </div>
          )}
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Info label="Name" value={name} />
            <Info label="SSN" value={user.ssn} />
            <Info label="Email" value={user.email} />
            <Info label="Phone" value={user.phoneNumber} />

            <Info
              label="Birthdate"
              value={format(user.birthdate, "MMM d, yyyy")}
            />
            <Info label="Gender" value={user.gender || "—"} />

            <Info label="Registered" value={fmtDate(registered)} />

            {/* <Info label="Street" value={user.addressStreet} />
          <Info label="City" value={user.addressCity} />
          <Info label="State" value={user.addressState} />
          <Info label="Zip Code" value={user.addressPostal} /> */}
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default ClientData;

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </div>
        <div className="mt-1 text-sm break-words text-gray-900">
          {value || "—"}
        </div>
      </CardContent>
    </Card>
  );
}

type StatusKey = "Active" | "Paused" | "InActive";

const STATUS_STYLES: Record<
  StatusKey,
  {
    border: string;
    bg: string;
    text: string;
    chipBg: string;
  }
> = {
  InActive: {
    border: "border-red-700",
    bg: "bg-red-700",
    text: "text-red-700",
    chipBg: "bg-inherit",
  },
  Paused: {
    border: "border-amber-500",
    bg: "bg-amber-500",
    text: "text-amber-700",
    chipBg: "bg-amber-100",
  },
  Active: {
    border: "border-emerald-300",
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    chipBg: "bg-emerald-50",
  },
};

type ContractStatusKey = "Yes" | "No";
const DENEFITS_CONTRACT_STYLES: Record<
  ContractStatusKey,
  {
    border: string;
    bg: string;
    text: string;
    chipBg: string;
  }
> = {
  No: {
    border: "border-red-700",
    bg: "bg-red-700",
    text: "text-red-700",
    chipBg: "bg-inherit",
  },
  Yes: {
    border: "border-emerald-300",
    bg: "bg-emerald-600",
    text: "text-emerald-700",
    chipBg: "bg-emerald-50",
  },
};

const StatusPicker = ({ user }: { user: UserWithId }) => {
  const styles =
    STATUS_STYLES[user.activeStatus || "Active"] ?? STATUS_STYLES.Active;

  const { updateUserStatus, isUpdating } = useUpdateUserStatusMutation({
    userId: user.id,
  });

  const handleStatusChange = useCallback(
    async (value: string) => {
      if (value) {
        await updateUserStatus({
          status: value as UserActiveStatus,
        });
      }
    },
    [updateUserStatus]
  );

  return (
    <div
      className={[
        "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-md p-3 border w-full sm:w-auto",
        styles.border, // border color
        styles.chipBg, // container background
      ].join(" ")}
    >
      <span className={["text-sm font-medium", styles.text].join(" ")}>
        Status
      </span>

      <Select
        disabled={!!isUpdating}
        defaultValue={user.activeStatus ?? "Active"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger
          className={[
            "w-full sm:w-[180px] h-9",
            "border-2", // make color more visible
            styles.border, // trigger border color
            "bg-white", // readable input background
            "focus:ring-0 focus:outline-none",
          ].join(" ")}
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {UserActiveStatusEnum.options.map((opt: StatusKey) => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2">
                {/* a little color chip */}
                <span
                  className={[
                    "inline-block h-2.5 w-2.5 rounded-full",
                    STATUS_STYLES[opt].bg, // solid dot using your bg color
                  ].join(" ")}
                />
                {opt}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

const DenefitsContract = ({ user }: { user: UserWithId }) => {
  const { denefitsContract, isLoading } = useGetDenefitsContractsByUserId(
    user?.id
  );

  const result = denefitsContract && denefitsContract.length > 0 ? "Yes" : "No";

  const styles =
    DENEFITS_CONTRACT_STYLES[result || "No"] ?? DENEFITS_CONTRACT_STYLES.No;

  return (
    <div
      className={[
        "flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-md p-3 border w-full sm:w-auto",
        styles.border,
        styles.chipBg,
      ].join(" ")}
    >
      <span className={["text-sm font-medium", styles.text].join(" ")}>
        Denefits Contract Created?
      </span>

      <div className="flex items-center gap-2">
        {/* a little color chip */}
        <span
          className={[
            "inline-block h-2.5 w-2.5 rounded-full",
            DENEFITS_CONTRACT_STYLES[result || "No"].bg,
          ].join(" ")}
        />
        {result}
      </div>
    </div>
  );
};

const RefreshCRSData = ({ userId }: { userId: string }) => {
  const [refreshConfirmationOpen, setRefreshConfirmationOpen] =
    React.useState(false);
  const { isUpdating, refreshCRSData } = useRefreshCRSData();

  const handleRefreshCRSData = useCallback(async () => {
    try {
      await refreshCRSData({ userId });
      setRefreshConfirmationOpen(false);
    } catch (error) {
      console.error("Error refreshing CRS data:", error);
      toast.error("Failed to refresh CRS data. Please try again.");
    }
  }, [refreshCRSData, userId]);

  return (
    <>
      <Button
        variant={"ghost"}
        className="w-full sm:w-auto cursor-pointer bg-blue-200 hover:bg-blue-300"
        onClick={() => setRefreshConfirmationOpen(true)}
      >
        <IconMenu
          icon={<RefreshCcw className="h-4 w-4" />}
          text="Refresh CRS Data"
        />
      </Button>

      {refreshConfirmationOpen && (
        <AlertDialog
          open={refreshConfirmationOpen}
          onOpenChange={(open) => {
            if (!isUpdating) setRefreshConfirmationOpen(open);
          }}
        >
          <AlertDialogTrigger asChild></AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                {`Please confirm that you want to refresh the client's CRS data. This action cannot be
                undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="cursor-pointer"
                disabled={isUpdating}
              >
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleRefreshCRSData();
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <IconMenu
                    text="Refreshing..."
                    icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu
                    text="Refresh"
                    icon={<RefreshCcw className="h-4 w-4" />}
                  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};
