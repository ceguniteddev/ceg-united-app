import IconMenu from "@/components/icon-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  UserActiveStatus,
  UserActiveStatusEnum,
  UserWithId,
} from "@/schema/registration";
// import { format } from "date-fns";
import {
  Loader2Icon,
  RefreshCcw,
  XIcon,
  Edit2Icon,
  Send,
  CreditCard,
  Save,
} from "lucide-react";
import type { Metadata } from "next";
import React, { useCallback, useState, useMemo } from "react";
import { getFreePullStatus } from "@/lib/crs-eligibility";
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
import {
  useUpdateUserStatusMutation,
  useUpdateUserProfileMutation,
  useSendClientServiceAgreementMutation,
  useDeleteUserMutation,
  useUsersQuery,
  useUpdateClientBrokerMutation,
} from "@/hooks/user";
import {
  useMembership,
  useAdminSetMembershipMutation,
} from "@/hooks/membership";
import { useRefreshCRSData } from "@/hooks/crs";
import { useAuth } from "@/provider/AuthContext";
import { useUserAddons, useAdminToggleAddonMutation } from "@/hooks/addons";
import { AddonTier } from "@/service/addons";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
// import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CRSAddressInfo, CRSPersonalInfo } from "@/types/crs";
// import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import { US_STATES } from "@/constant/common";
import { Separator } from "@/components/ui/separator";
import { useBusinessQuery } from "@/hooks/business";
import { Business } from "@/schema";
import { Switch } from "@/components/ui/switch";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { CustomFormField } from "@/components/CustomFormField";
import { Form } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registrationSchema } from "@/schema/registration";
import { sendPaymentLink } from "@/service/whop";
import { cn } from "@/lib/utils";
import { MembershipTier } from "@/schema/users";

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { data: membership } = useMembership(user.id);

  if (!user) {
    return <EmptyState title="User not found" description="" />;
  }

  const registered = toDate(user.registrationDate);
  const name = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ");

  const personalFreePullStatus = useMemo(
    () => getFreePullStatus(membership, user.lastFreePullAt, fmtDate),
    [membership, user.lastFreePullAt],
  );

  const businessFreePullStatus = useMemo(
    () => getFreePullStatus(membership, user.lastFreeBusinessPullAt, fmtDate),
    [membership, user.lastFreeBusinessPullAt],
  );

  return (
    <main className="mx-auto w-full px-2 sm:px-0">
      <Card className="max-w-full overflow-hidden border-none shadow-sm">
        <CardHeader className="pb-3 px-4 sm:px-5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
              Personal Information
            </CardTitle>
            {!isBrokerView && (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setEditModalOpen(true)}
                className="cursor-pointer h-8 px-3 hover:bg-blue-300 bg-blue-200"
              >
                <Edit2Icon className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs font-medium">Edit</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-5 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Info label="Name" value={name} />
              <Info label="SSN" value={user.ssn} />
              <Info label="Email" value={user.email} />
              <Info label="Phone" value={user.phoneNumber} />

              {!isBrokerView && (
                <Info label="Broker" value={user.brokerName || ""} />
              )}

              <Info label="Registered" value={fmtDate(registered)} />
              <Info
                label="Monthly Personal Free Pull"
                value={personalFreePullStatus}
              />
              <Info
                label="Monthly Business Free Pull"
                value={businessFreePullStatus}
              />
            </div>

            {!isBrokerView && (
              <div className="lg:col-span-1 space-y-4">
                <StatusPicker user={user} />
                <RefreshCRSData user={user} />
                <SendPaymentLink user={user} />
                <SendClientAgreement user={user} />
                <PaymentAmountDisplay user={user} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditClientModal
        isOpen={editModalOpen}
        setIsOpen={setEditModalOpen}
        user={user}
      />

      <MembershipSection user={user} />
      <AddonSection user={user} />

      <DangerZone user={user} />
    </main>
  );
};

export default ClientData;

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="group hover:bg-slate-50 rounded-lg p-3.5 transition-all duration-200 border border-gray-200 bg-white shadow-sm hover:shadow">
      <div className="text-[11px] font-bold uppercase tracking-wide text-gray-600 mb-2">
        {label}
      </div>
      <div className="text-base font-semibold break-words text-gray-900">
        {value || <span className="text-gray-400">—</span>}
      </div>
    </div>
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

function MembershipSection({ user }: { user: UserWithId }) {
  const { user: currentUser } = useAuth();
  const { data: membershipData, isLoading } = useMembership(user.id);
  const { mutate: updateMembership, isPending: isUpdating } =
    useAdminSetMembershipMutation();

  const currentAdminEmail = currentUser?.email || currentUser?.uid || "Admin";

  const handleTierChange = useCallback(
    (value: string) => {
      if (value) {
        updateMembership({
          userId: user.id,
          tier: value as MembershipTier,
          status: membershipData?.status || "active",
          updatedBy: currentAdminEmail,
        });
      }
    },
    [updateMembership, user.id, membershipData?.status, currentAdminEmail],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      if (value) {
        updateMembership({
          userId: user.id,
          tier: membershipData?.tier || "tier_starter",
          status: value,
          updatedBy: currentAdminEmail,
        });
      }
    },
    [updateMembership, user.id, membershipData?.tier, currentAdminEmail],
  );

  return (
    <Card className="mt-6 border-blue-200 shadow-sm bg-blue-50/10">
      <CardHeader className="pb-3 px-4 sm:px-5 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Membership Settings
          </CardTitle>
          {isLoading && (
            <Loader2Icon className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {`Adjust the client's membership tier and status. This will override
          their current subscription.`}
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tier</Label>
            <Select
              disabled={!!isUpdating || isLoading}
              value={membershipData?.tier || "unknown"}
              onValueChange={handleTierChange}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unknown" disabled>
                  Unknown Tier
                </SelectItem>
                <SelectItem value="tier_starter">Starter</SelectItem>
                <SelectItem value="tier_pro">Pro</SelectItem>
                <SelectItem value="tier_executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Status</Label>
            <Select
              disabled={!!isUpdating || isLoading}
              value={membershipData?.status || "inactive"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex flex-col justify-end pb-2">
            {isUpdating && (
              <p className="text-sm text-blue-600 flex items-center">
                <Loader2Icon className="h-3.5 w-3.5 animate-spin mr-1.5" />{" "}
                Updating membership...
              </p>
            )}
            {!isUpdating && membershipData?.updatedBy && (
              <p className="text-xs text-muted-foreground">
                Last updated by {membershipData.updatedBy}
                {membershipData.updatedAt
                  ? ` on ${fmtDate(new Date(membershipData.updatedAt))}`
                  : ""}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const AVAILABLE_ADDONS: {
  id: AddonTier;
  label: string;
  description: string;
}[] = [
  {
    id: "credit_module_pro",
    label: "Credit Repair Module",
    description:
      "Unlock the self-service AI credit optimization toolkit. Includes AI dispute letters, inquiry workflows, and bureau tracking.",
  },
];

function AddonSection({ user }: { user: UserWithId }) {
  const { user: currentUser } = useAuth();
  const { data: addons, isLoading } = useUserAddons(user.id);
  const { mutate: toggleAddon, isPending: isUpdating } =
    useAdminToggleAddonMutation();

  const currentAdminEmail = currentUser?.email || currentUser?.uid || "Admin";

  const handleToggle = (addonId: AddonTier, currentActive: boolean) => {
    toggleAddon({
      userId: user.id,
      addonId,
      active: !currentActive,
      updatedBy: currentAdminEmail,
    });
  };

  return (
    <Card className="mt-6 border-blue-200 shadow-sm bg-blue-50/10">
      <CardHeader className="pb-3 px-4 sm:px-5 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg sm:text-xl font-semibold text-gray-900">
            Add-on Features
          </CardTitle>
          {isLoading && (
            <Loader2Icon className="h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Enable or disable specific premium modules for this client.
        </p>
      </CardHeader>
      <CardContent className="px-4 sm:px-5 py-4">
        <div className="flex flex-col gap-4">
          {AVAILABLE_ADDONS.map((addon) => {
            const currentAddon = addons?.find((a) => a.addonId === addon.id);
            const isActive = currentAddon?.status === "active";

            return (
              <div
                key={addon.id}
                className="flex items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-white border border-gray-100 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Label
                      className="text-sm sm:text-base font-semibold text-gray-900 cursor-pointer"
                      htmlFor={`addon-${addon.id}`}
                    >
                      {addon.label}
                    </Label>
                    {isActive && (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {addon.description}
                  </p>
                  {!isUpdating && currentAddon?.updatedBy && (
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      Last updated by {currentAddon.updatedBy}
                      {currentAddon.updatedAt
                        ? ` on ${fmtDate(new Date(currentAddon.updatedAt))}`
                        : ""}
                    </p>
                  )}
                </div>
                <div className="flex items-center shrink-0">
                  {isUpdating ? (
                    <Loader2Icon className="h-4 w-4 animate-spin text-blue-500 mr-2" />
                  ) : null}
                  <Switch
                    id={`addon-${addon.id}`}
                    checked={isActive}
                    disabled={isUpdating || isLoading}
                    onCheckedChange={() => handleToggle(addon.id, isActive)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

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
    [updateUserStatus],
  );

  return (
    <div
      className={[
        "flex flex-col sm:flex-row items-start sm:items-center gap-2 rounded-lg px-3 py-2 border w-full transition-all duration-200 shadow-sm",
        styles.border,
        styles.chipBg,
      ].join(" ")}
    >
      <span
        className={[
          "text-xs font-semibold whitespace-nowrap",
          styles.text,
        ].join(" ")}
      >
        Status
      </span>

      <Select
        disabled={!!isUpdating}
        defaultValue={user.activeStatus ?? "Active"}
        value={user.activeStatus ?? "Active"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger
          value={user.activeStatus ?? "Active"}
          onReset={() => {
            handleStatusChange("Active");
          }}
          className={cn(
            "w-full sm:flex-1 sm:min-w-[140px] h-8 text-xs",
            "border",
            styles.border,
            "bg-white",
            "focus:ring-0 focus:outline-none",
          )}
        >
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {UserActiveStatusEnum.options.map((opt: StatusKey) => (
            <SelectItem key={opt} value={opt}>
              <div className="flex items-center gap-2">
                {/* a little color chip */}
                <span
                  className={cn(
                    "inline-block h-2.5 w-2.5 rounded-full",
                    STATUS_STYLES[opt].bg,
                  )}
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

const RefreshCRSData = ({ user }: { user: UserWithId }) => {
  const [refreshConfirmationOpen, setRefreshConfirmationOpen] =
    React.useState(false);
  const { isUpdating, refreshCRSData } = useRefreshCRSData();
  const { data: membershipData } = useMembership(user.id);
  const isPremium = membershipData?.status === "active";
  // const { appliedFunding } = useGetClientApplyFunding(user.id);
  const { businessData } = useBusinessQuery(user.id, true);
  const [selectedBureaus, setSelectedBureaus] = React.useState({
    equifax: false,
    experian: false,
    transunion: false,
  });

  const [showPersonalInfo, setShowPersonalInfo] = React.useState(false);
  const [showAddressInfo, setShowAddressInfo] = React.useState(false);
  const [refreshBusinessCredit, setRefreshBusinessCredit] =
    React.useState(false);
  const [selectedBusinessIds, setSelectedBusinessIds] = React.useState<
    string[]
  >([]);
  const [personalInfo, setPersonalInfo] = React.useState<CRSPersonalInfo>({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    middleName: user.middleName || "",
    suffix: "",
    ssn: user.ssn || "",
  });
  const [addressInfo, setAddressInfo] = React.useState<CRSAddressInfo>({
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
  });

  const handleRefreshCRSData = useCallback(async () => {
    const hasSelectedBureaus =
      selectedBureaus &&
      (selectedBureaus.equifax ||
        selectedBureaus.experian ||
        selectedBureaus.transunion);

    if (!hasSelectedBureaus && !refreshBusinessCredit) {
      toast.error("Please select at least one bureau or business credit.");
      return;
    }

    if (refreshBusinessCredit && selectedBusinessIds.length === 0) {
      toast.error("Please select at least one business.");
      return;
    }

    try {
      // console.log("Refreshing CRS data for bureaus:", selectedBureaus);
      await refreshCRSData({
        userId: user.id,
        bureaus: selectedBureaus,
        personalInfo: showPersonalInfo ? personalInfo : undefined,
        addressInfo: showAddressInfo ? addressInfo : undefined,
        refreshBusinessCredit,
        businessIds: refreshBusinessCredit ? selectedBusinessIds : [],
      });
      setRefreshConfirmationOpen(false);
    } catch (error) {
      console.error("Error refreshing CRS data:", error);
      toast.error("Failed to refresh CRS data. Please try again.");
    }
  }, [
    refreshCRSData,
    user.id,
    selectedBureaus,
    showPersonalInfo,
    personalInfo,
    showAddressInfo,
    addressInfo,
    refreshBusinessCredit,
    selectedBusinessIds,
  ]);

  return (
    <>
      <Button
        variant="outline"
        size={"lg"}
        className="w-full cursor-pointer bg-blue-50/50 hover:bg-blue-100 border-blue-200 text-blue-700 font-medium shadow-sm"
        onClick={() => setRefreshConfirmationOpen(true)}
      >
        <RefreshCcw className="h-4 w-4" />
        Refresh CRS Data
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
                Please confirm that you want to refresh the client&apos;s CRS
                data. Select the bureaus you want to refresh:
              </AlertDialogDescription>
              <div className="flex flex-col gap-2 py-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="equifax"
                    checked={selectedBureaus.equifax}
                    onCheckedChange={(checked) =>
                      setSelectedBureaus((prev) => ({
                        ...prev,
                        equifax: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="equifax">Equifax</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="experian"
                    checked={selectedBureaus.experian}
                    onCheckedChange={(checked) =>
                      setSelectedBureaus((prev) => ({
                        ...prev,
                        experian: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="experian">Experian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="transunion"
                    checked={selectedBureaus.transunion}
                    onCheckedChange={(checked) =>
                      setSelectedBureaus((prev) => ({
                        ...prev,
                        transunion: checked as boolean,
                      }))
                    }
                  />
                  <Label htmlFor="transunion">TransUnion</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="refreshBusinessCredit"
                    checked={refreshBusinessCredit}
                    disabled={!isPremium}
                    onCheckedChange={(checked) =>
                      setRefreshBusinessCredit(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="refreshBusinessCredit"
                    className={!isPremium ? "text-muted-foreground" : ""}
                  >
                    Refresh Business Credit {!isPremium && "(Premium Only)"}
                  </Label>
                </div>

                {refreshBusinessCredit &&
                  businessData &&
                  businessData.length > 0 && (
                    <div className="pl-6 flex flex-col gap-2">
                      <Label className="text-xs font-semibold">
                        Select Businesses:
                      </Label>
                      {businessData.map((business: Business) => (
                        <div
                          key={business.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`business-${business.id}`}
                            checked={selectedBusinessIds.includes(business.id!)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedBusinessIds((prev) => [
                                  ...prev,
                                  business.id!,
                                ]);
                              } else {
                                setSelectedBusinessIds((prev) =>
                                  prev.filter((id) => id !== business.id),
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`business-${business.id}`}
                            className="text-sm font-normal"
                          >
                            {business.businessName}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                {refreshBusinessCredit &&
                  (!businessData || businessData.length === 0) && (
                    <div className="pl-6 text-sm text-muted-foreground">
                      No businesses found for this client.
                    </div>
                  )}

                <Separator className="my-2" />
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showPersonalInfo"
                    checked={showPersonalInfo}
                    onCheckedChange={(checked) =>
                      setShowPersonalInfo(checked as boolean)
                    }
                  />
                  <Label htmlFor="showPersonalInfo">
                    Enter Personal Information
                  </Label>
                </div>

                {showPersonalInfo && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-xs">
                        First Name
                      </Label>
                      <Input
                        id="firstName"
                        value={personalInfo.firstName}
                        onChange={(e) =>
                          setPersonalInfo((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="middleName" className="text-xs">
                        Middle Name
                      </Label>
                      <Input
                        id="middleName"
                        value={personalInfo.middleName}
                        onChange={(e) =>
                          setPersonalInfo((prev) => ({
                            ...prev,
                            middleName: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-xs">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={personalInfo.lastName}
                        onChange={(e) =>
                          setPersonalInfo((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="suffix" className="text-xs">
                        Suffix
                      </Label>
                      <Input
                        id="suffix"
                        value={personalInfo.suffix}
                        onChange={(e) =>
                          setPersonalInfo((prev) => ({
                            ...prev,
                            suffix: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="ssn" className="text-xs">
                        SSN
                      </Label>
                      <Input
                        id="ssn"
                        value={personalInfo.ssn}
                        onChange={(e) =>
                          setPersonalInfo((prev) => ({
                            ...prev,
                            ssn: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showAddressInfo"
                    checked={showAddressInfo}
                    onCheckedChange={(checked) =>
                      setShowAddressInfo(checked as boolean)
                    }
                  />
                  <Label htmlFor="showAddressInfo">
                    Client has different address
                  </Label>
                </div>

                {showAddressInfo && (
                  <div className="grid grid-cols-2 gap-2 pl-6">
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="addressLine1" className="text-xs">
                        Address Line 1
                      </Label>
                      <Input
                        id="addressLine1"
                        value={addressInfo.addressLine1}
                        onChange={(e) =>
                          setAddressInfo((prev) => ({
                            ...prev,
                            addressLine1: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="city" className="text-xs">
                        City
                      </Label>
                      <Input
                        id="city"
                        value={addressInfo.city}
                        onChange={(e) =>
                          setAddressInfo((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="state" className="text-xs">
                        State
                      </Label>
                      <Select
                        value={addressInfo.state}
                        onValueChange={(value) =>
                          setAddressInfo((prev) => ({
                            ...prev,
                            state: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {US_STATES.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label htmlFor="postalCode" className="text-xs">
                        Postal Code
                      </Label>
                      <Input
                        id="postalCode"
                        value={addressInfo.postalCode}
                        onChange={(e) =>
                          setAddressInfo((prev) => ({
                            ...prev,
                            postalCode: e.target.value,
                          }))
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                This action cannot be undone.
              </div>
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

const SendPaymentLink = ({ user }: { user: UserWithId }) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendLink = async () => {
    setIsSending(true);
    try {
      await sendPaymentLink({ userId: user.id });
      toast.success("Payment link sent successfully!");
      setConfirmationOpen(false);
    } catch (error) {
      console.error("Error sending payment link:", error);
      toast.error("Failed to send payment link.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size={"lg"}
        className="w-full cursor-pointer bg-orange-50/50 hover:bg-orange-100 border-orange-200 text-orange-600 font-medium shadow-sm"
        onClick={() => setConfirmationOpen(true)}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        Send Payment Link
      </Button>

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Payment Link</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send a payment link to{" "}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              ? They will receive an email with instructions to complete their
              payment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-orange-600 hover:bg-orange-700"
              onClick={(e) => {
                e.preventDefault();
                handleSendLink();
              }}
              disabled={isSending}
            >
              {isSending ? (
                <IconMenu
                  icon={<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  text="Sending..."
                />
              ) : (
                <IconMenu
                  icon={<Send className="h-4 w-4 mr-2" />}
                  text="Send Payment Link"
                />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const SendClientAgreement = ({ user }: { user: UserWithId }) => {
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const { sendClientServiceAgreement, isSending } =
    useSendClientServiceAgreementMutation({
      userId: user.id,
    });

  const handleSend = async () => {
    try {
      await sendClientServiceAgreement();
      setConfirmationOpen(false);
    } catch (error) {
      console.error("Error sending agreement:", error);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size={"lg"}
        className="w-full cursor-pointer bg-green-50/50 hover:bg-green-100 border-green-200 text-green-700 font-medium shadow-sm"
        onClick={() => setConfirmationOpen(true)}
        disabled={isSending}
      >
        <IconMenu
          icon={<Send className="h-4 w-4 mr-2" />}
          text="Send Client Agreement"
        />
      </Button>

      <AlertDialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Client Service Agreement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to send the Client Service Agreement to{" "}
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              ? They will receive an email with instructions to sign the
              agreement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={(e) => {
                e.preventDefault();
                handleSend();
              }}
              disabled={isSending}
            >
              {isSending ? (
                <IconMenu
                  icon={<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                  text="Sending..."
                />
              ) : (
                <IconMenu
                  icon={<Send className="h-4 w-4 mr-2" />}
                  text="Send Agreement"
                />
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const PaymentAmountDisplay = ({ user }: { user: UserWithId }) => {
  const defaultAmount =
    process.env.NEXT_PUBLIC_WHOP_FULL_PAYMENT_AMOUNT || "15000";
  const [amount, setAmount] = useState<string>(
    String((user as any).paymentAmount ?? defaultAmount),
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/user/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentAmount: Number(amount) }),
      });
      if (!res.ok) throw new Error("Failed to update");
      toast.success("Payment amount updated.");
    } catch {
      toast.error("Failed to update payment amount.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-row items-center gap-2 rounded-lg px-3 py-2 border border-blue-200 bg-blue-50/50 shadow-sm w-full">
      <span className="text-xs font-semibold text-blue-700 whitespace-nowrap flex-shrink-0">
        Payment Amount
      </span>
      <div className="flex items-center gap-1 flex-1 min-w-0">
        <span className="text-xs font-semibold text-blue-700">$</span>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-7 text-sm font-semibold text-blue-900 border-blue-200 bg-white flex-1 min-w-0 px-1.5"
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 flex-shrink-0 text-blue-700 hover:bg-blue-100 cursor-pointer"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2Icon className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
};

const EditClientModal = ({
  isOpen,
  setIsOpen,
  user,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserWithId;
}) => {
  const { updateUserProfile, isUpdating: isUpdatingProfile } =
    useUpdateUserProfileMutation({
      userId: user.id,
    });
  const { updateClientBroker, isUpdating: isUpdatingBroker } =
    useUpdateClientBrokerMutation({
      userId: user.id,
    });
  const { users: brokers, isLoading: isBrokersLoading } =
    useUsersQuery("Broker");

  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [hasChangedBroker, setHasChangedBroker] = useState(false);

  const updateSchema = registrationSchema.partial().omit({
    password: true,
    email: true,
    role: true,
  });

  const form = useForm({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      phoneNumber: user.phoneNumber || "",
      ssn: user.ssn || "",
    },
  });

  // Initialize broker selection when modal opens
  React.useEffect(() => {
    if (isOpen && brokers) {
      // Find current broker ID from broker name
      const currentBroker = brokers.find(
        (b: any) => `${b.firstName} ${b.lastName}` === user.brokerName,
      );
      setSelectedBrokerId(currentBroker?.id || null);
      setHasChangedBroker(false);
    }
  }, [isOpen, brokers, user.brokerName]);

  const handleSubmit = async (data: any) => {
    try {
      // Update user profile
      await updateUserProfile(data);

      // Update broker assignment if changed
      if (hasChangedBroker) {
        const selectedBroker = brokers?.find(
          (b: any) => b.id === selectedBrokerId,
        );
        const brokerName = selectedBroker
          ? `${selectedBroker.firstName} ${selectedBroker.lastName}`
          : "";

        await updateClientBroker({
          brokerId: selectedBrokerId,
          brokerName,
        });
      }

      setIsOpen(false);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  const isUpdating = isUpdatingProfile || isUpdatingBroker;

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Edit Client Information"
      description="Update client personal information"
      className="max-w-4xl"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto px-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomFormField
                name="firstName"
                label="* First Name"
                placeholder=""
              />
              <CustomFormField
                name="middleName"
                label="Middle Name"
                placeholder=""
              />
              <CustomFormField
                name="lastName"
                label="* Last Name"
                placeholder=""
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CustomFormField
                name="phoneNumber"
                label="* Phone Number"
                placeholder=""
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CustomFormField
                name="ssn"
                type="ssn"
                label="SSN"
                placeholder="XXX-XX-XXXX"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Assigned Broker</Label>
              <Select
                value={selectedBrokerId || "none"}
                onValueChange={(value) => {
                  setSelectedBrokerId(value === "none" ? null : value);
                  setHasChangedBroker(true);
                }}
                disabled={isBrokersLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a broker" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No Broker</span>
                  </SelectItem>
                  {brokers?.map((broker: any) => (
                    <SelectItem key={broker.id} value={broker.id}>
                      {broker.firstName} {broker.lastName} ({broker.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {user.brokerName && (
                <p className="text-xs text-muted-foreground">
                  Current: {user.brokerName}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveDialog>
  );
};

const DangerZone = ({ user }: { user: UserWithId }) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  return (
    <>
      <Card className="mt-6 border-destructive/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-destructive">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete this client</p>
              <p className="text-sm text-muted-foreground">
                Once you delete a client, there is no going back. Please be
                certain.
              </p>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteModalOpen(true)}
            >
              Delete Client
            </Button>
          </div>
        </CardContent>
      </Card>
      <DeleteClientModal
        isOpen={deleteModalOpen}
        setIsOpen={setDeleteModalOpen}
        user={user}
      />
    </>
  );
};

const DeleteClientModal = ({
  isOpen,
  setIsOpen,
  user,
}: {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserWithId;
}) => {
  const { deleteUser, isDeleting } = useDeleteUserMutation({
    userId: user.id,
    onSuccess: () => {
      setIsOpen(false);
      window.location.href = "/admin/clients";
    },
  });

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!isDeleting) {
          setIsOpen(open);
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            client&apos;s account and remove all their data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isDeleting}
            onClick={async (e) => {
              e.preventDefault();
              await deleteUser();
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
