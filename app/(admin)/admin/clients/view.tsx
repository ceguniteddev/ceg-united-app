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
import {
  useUpdateUserStatusMutation,
  useUpdateUserPremiumStatusMutation,
} from "@/hooks/user";
import { useRefreshCRSData } from "@/hooks/crs";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CRSAddressInfo, CRSPersonalInfo } from "@/types/crs";
import { useGetClientApplyFunding } from "@/hooks/apply-funding";
import { US_STATES } from "@/constant/common";
import { Separator } from "@/components/ui/separator";
import { useBusinessQuery } from "@/hooks/business";
import { Business } from "@/schema";
import { Switch } from "@/components/ui/switch";

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
              <RefreshCRSData user={user} />
              <div className="flex flex-col sm:flex-row gap-3">
                <PremiumStatusPicker user={user} />
                <StatusPicker user={user} />
              </div>
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
            {!isBrokerView && (
              <Info label="Broker" value={user.brokerName || ""} />
            )}

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

const PremiumStatusPicker = ({ user }: { user: UserWithId }) => {
  const isPremium = user.isPremiumClient || false;
  const { updatePremiumStatus, isUpdating } =
    useUpdateUserPremiumStatusMutation({
      userId: user.id,
    });

  const handleToggle = useCallback(
    async (checked: boolean) => {
      await updatePremiumStatus({ isPremium: checked });
    },
    [updatePremiumStatus]
  );

  return (
    <div
      className={[
        "flex flex-row items-center gap-3 rounded-md p-3 border w-full sm:w-auto",
        isPremium ? "border-purple-300 bg-purple-50" : "border-gray-200",
      ].join(" ")}
    >
      <span
        className={[
          "text-sm font-medium",
          isPremium ? "text-purple-700" : "text-gray-700",
        ].join(" ")}
      >
        Premium Client
      </span>
      <Switch
        checked={isPremium}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className="data-[state=checked]:bg-purple-600"
      />
    </div>
  );
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

const RefreshCRSData = ({ user }: { user: UserWithId }) => {
  const [refreshConfirmationOpen, setRefreshConfirmationOpen] =
    React.useState(false);
  const { isUpdating, refreshCRSData } = useRefreshCRSData();
  const { appliedFunding } = useGetClientApplyFunding(user.id);
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

  React.useEffect(() => {
    if (appliedFunding && appliedFunding.length > 0) {
      const latestApp = appliedFunding[0];
      setAddressInfo({
        addressLine1: latestApp.addressStreet || "",
        city: latestApp.addressCity || "",
        state: latestApp.addressState || "",
        postalCode: latestApp.addressPostal || "",
      });
    }
  }, [appliedFunding]);

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
                    disabled={!user.isPremiumClient}
                    onCheckedChange={(checked) =>
                      setRefreshBusinessCredit(checked as boolean)
                    }
                  />
                  <Label
                    htmlFor="refreshBusinessCredit"
                    className={
                      !user.isPremiumClient ? "text-muted-foreground" : ""
                    }
                  >
                    Refresh Business Credit{" "}
                    {!user.isPremiumClient && "(Premium Only)"}
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
                                  prev.filter((id) => id !== business.id)
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
