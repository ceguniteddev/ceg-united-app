"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  Save,
  Check,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { verifyAddressViaLob } from "@/lib/credit-repair/lobMailing";

import {
  useGetConsumerReportingAgencies,
  useAddConsumerReportingAgency,
  useUpdateConsumerReportingAgency,
  useDeleteConsumerReportingAgency,
} from "@/hooks/consumer-reporting-agency";
import {
  AgencySchemaForm,
  agencySchema,
} from "@/schema/consumer-reporting-agency";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { FormTextarea } from "@/components/forms/form-textarea";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { US_STATES } from "@/constant/common";

export default function ConsumerReportingAgencyPage() {
  const { data: agencies, isLoading } = useGetConsumerReportingAgencies();
  const { mutateAsync: addAgency, isPending: isAdding } =
    useAddConsumerReportingAgency();
  const { mutateAsync: updateAgency, isPending: isUpdating } =
    useUpdateConsumerReportingAgency();
  const { mutateAsync: deleteAgency, isPending: isDeleting } =
    useDeleteConsumerReportingAgency();

  const isSaving = isAdding || isUpdating;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAgency, setEditingAgency] = useState<AgencySchemaForm | null>(
    null,
  );

  const [isConfirmSaveOpen, setIsConfirmSaveOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] =
    useState<AgencySchemaForm | null>(null);

  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const [isVerifyingAddress, setIsVerifyingAddress] = useState(false);

  const form = useForm<AgencySchemaForm>({
    resolver: zodResolver(agencySchema),
    defaultValues: {
      key: "",
      name: "",
      emailAddress: "",
      category: "cra",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
      },
      isActive: true,
      notes: "",
      addressVerification: undefined,
    },
  });

  const handleOpenAdd = () => {
    form.reset({
      key: "",
      name: "",
      emailAddress: "",
      category: "cra",
      address: { line1: "", line2: "", city: "", state: "", zip: "" },
      isActive: true,
      notes: "",
      addressVerification: undefined,
    });
    setEditingAgency(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (agency: AgencySchemaForm) => {
    form.reset({
      key: agency.key,
      name: agency.name,
      category: agency.category,
      emailAddress: agency.emailAddress || "",
      notes: agency.notes || "",
      address: {
        line1: agency.address?.line1 || "",
        line2: agency.address?.line2 || "",
        city: agency.address?.city || "",
        state: agency.address?.state || "",
        zip: agency.address?.zip || "",
      },
      addressVerification: agency.addressVerification || undefined,
      isActive: agency.isActive ?? true,
    });
    setEditingAgency(agency);
    setIsFormModalOpen(true);
  };

  const onFormError = (errors: any) => {
    console.error("Form Validation Errors:", errors);
    const getErrorMessages = (obj: any): string[] => {
      if (!obj || typeof obj !== "object") return [];
      if (typeof obj.message === "string") return [obj.message];
      return Object.values(obj).flatMap((val) => getErrorMessages(val));
    };

    const messages = getErrorMessages(errors);
    if (messages.length > 0) {
      toast.error(`Validation errors: ${messages.join(", ")}`);
    } else {
      toast.error("Please correct the errors in the form before saving.");
    }
  };

  const handleVerifyAddressClick = async () => {
    const address = form.getValues("address");
    if (!address.line1 || !address.city || !address.state || !address.zip) {
      toast.error("Please fill in Line 1, City, State, and Zip code first.");
      return;
    }

    setIsVerifyingAddress(true);
    try {
      const addressObject = {
        primary_line: address.line1,
        secondary_line: address.line2 || undefined,
        city: address.city,
        state: address.state,
        zip_code: address.zip,
      };
      // console.log(addressObject);
      const res = await verifyAddressViaLob(addressObject);

      form.setValue("addressVerification", {
        deliverability: res.deliverability,
        verifiedAt: new Date(),
      });

      if (res.deliverability === "undeliverable") {
        toast.error("Lob API checked: Address is undeliverable.");
      } else {
        toast.success("Address verified successfully with USPS via Lob!");
      }
    } catch (err) {
      console.error("Address verification failed:", err);
      toast.error("Address verification failed. Please try again.");
    } finally {
      setIsVerifyingAddress(false);
    }
  };

  const handleFormSubmit = async (data: AgencySchemaForm) => {
    setPendingSaveData(data);
    setIsConfirmSaveOpen(true);
  };

  const confirmSave = async () => {
    if (!pendingSaveData) return;

    try {
      let res;
      if (editingAgency) {
        res = await updateAgency({
          id: editingAgency.key,
          data: pendingSaveData,
        });
      } else {
        res = await addAgency(pendingSaveData);
      }

      if (res.success) {
        toast.success(res.message);
        setIsConfirmSaveOpen(false);
        setIsFormModalOpen(false);
      } else {
        toast.error(res.message || "Failed to save");
      }
    } catch (error) {
      toast.error("An error occurred while saving.");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      const res = await deleteAgency(pendingDeleteId);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || "Failed to delete");
      }
    } catch (error) {
      toast.error("An error occurred while deleting.");
    } finally {
      setIsConfirmDeleteOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Consumer Reporting Agencies
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage bureaus and third-party CRAs used for credit repair.
          </p>
        </div>
        <Button
          onClick={handleOpenAdd}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" />
          Add Agency
        </Button>
      </div>

      <div className="border rounded-md bg-white hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key / Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : agencies && agencies.length > 0 ? (
              agencies.map((agency) => (
                <TableRow key={agency.key}>
                  <TableCell>
                    <div className="font-medium">{agency.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {agency.key}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        agency.category === "bureau"
                          ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent shadow-none"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent shadow-none"
                      }
                    >
                      {agency.category.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[250px] truncate text-sm">
                    {agency.address.line1}, {agency.address.city},{" "}
                    {agency.address.state} {agency.address.zip}
                  </TableCell>
                  <TableCell>
                    {agency.isActive ? (
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 border-blue-200"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-700 border-gray-200"
                      >
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(agency)}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setPendingDeleteId(agency.key);
                          setIsConfirmDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-10 text-muted-foreground"
                >
                  No agencies found. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 md:hidden">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border rounded-md bg-white p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))
        ) : agencies && agencies.length > 0 ? (
          agencies.map((agency) => (
            <div
              key={agency.key}
              className="border rounded-md bg-white p-4 space-y-3 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">{agency.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {agency.key}
                  </div>
                </div>
                <Badge
                  className={
                    agency.category === "bureau"
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent shadow-none"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent shadow-none"
                  }
                >
                  {agency.category.toUpperCase()}
                </Badge>
              </div>

              <div className="text-sm text-gray-600">
                {agency.address.line1}, {agency.address.city},{" "}
                {agency.address.state} {agency.address.zip}
              </div>

              <div className="flex justify-between items-center pt-2 border-t mt-2">
                <div>
                  {agency.isActive ? (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-gray-50 text-gray-700 border-gray-200"
                    >
                      Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenEdit(agency)}
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPendingDeleteId(agency.key);
                      setIsConfirmDeleteOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="border rounded-md bg-white p-10 text-center text-muted-foreground">
            No agencies found. Add one to get started.
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isFormModalOpen} onOpenChange={setIsFormModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAgency ? "Edit Agency" : "Add New Agency"}
            </DialogTitle>
            <DialogDescription>
              Fill in the details for the consumer reporting agency below.
            </DialogDescription>
          </DialogHeader>
          <div>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit, onFormError)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  control={form.control}
                  name="key"
                  label="Unique Key"
                  placeholder="e.g., lexisnexis"
                  disabled={!!editingAgency}
                />
                <FormSelect
                  control={form.control}
                  name="category"
                  label="Category"
                  options={[
                    { value: "bureau", label: "Bureau" },
                    { value: "cra", label: "Specialty CRA" },
                  ]}
                />
              </div>

              <FormInput
                control={form.control}
                name="name"
                label="Agency Name"
                placeholder="e.g., LexisNexis Risk Solutions"
              />

              <FormInput
                control={form.control}
                name="emailAddress"
                label="Email Address (Optional)"
                placeholder="info@agency.com"
                type="email"
              />

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Mailing Address</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-2 text-xs"
                    onClick={handleVerifyAddressClick}
                    disabled={isVerifyingAddress}
                  >
                    {isVerifyingAddress ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    {isVerifyingAddress ? "Verifying..." : "Verify Address"}
                  </Button>
                </div>

                {form.watch("addressVerification") && (
                  <div
                    className={`text-xs px-2 py-1.5 rounded-md border flex items-center gap-1.5 ${
                      form.watch("addressVerification")?.deliverability ===
                      "undeliverable"
                        ? "bg-red-50 text-red-700 border-red-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}
                  >
                    {form.watch("addressVerification")?.deliverability ===
                    "undeliverable" ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    )}
                    Deliverability:{" "}
                    <span className="font-semibold capitalize">
                      {form
                        .watch("addressVerification")
                        ?.deliverability.replace(/_/g, " ")}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3">
                  <FormInput
                    control={form.control}
                    name="address.line1"
                    label="Address Line 1"
                    placeholder="e.g. P.O. Box 105108"
                  />
                  <FormInput
                    control={form.control}
                    name="address.line2"
                    label="Address Line 2 (Optional)"
                    placeholder="Building, Suite, etc."
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <FormInput
                      control={form.control}
                      name="address.city"
                      label="City"
                      placeholder="City"
                    />
                    <FormSelect
                      control={form.control}
                      name="address.state"
                      label="State"
                      // placeholder="State"
                      options={US_STATES}
                    />
                    <FormInput
                      control={form.control}
                      name="address.zip"
                      label="Zip Code"
                      placeholder="Zip"
                    />
                  </div>
                </div>
              </div>

              <FormTextarea
                control={form.control}
                name="notes"
                label="Notes (Optional)"
                placeholder="E.g., Public records, insurance, employment data feed"
              />

              <div className="rounded-lg border p-3 shadow-sm">
                <FormCheckbox
                  control={form.control}
                  name="isActive"
                  label="Active Status (available for selection in dispute flow?)"
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Save Modal */}
      <Dialog open={isConfirmSaveOpen} onOpenChange={setIsConfirmSaveOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Details</DialogTitle>
            <DialogDescription>
              Please confirm the information below before saving.
            </DialogDescription>
          </DialogHeader>
          {pendingSaveData && (
            <div className="space-y-3 my-4 text-sm">
              <div className="grid grid-cols-3">
                <span className="font-semibold text-muted-foreground">
                  Name:
                </span>
                <span className="col-span-2">{pendingSaveData.name}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-muted-foreground">
                  Key:
                </span>
                <span className="col-span-2">{pendingSaveData.key}</span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-muted-foreground">
                  Address:
                </span>
                <span className="col-span-2">
                  {pendingSaveData.address.line1}
                  {pendingSaveData.address.line2 &&
                    `, ${pendingSaveData.address.line2}`}
                  <br />
                  {pendingSaveData.address.city},{" "}
                  {pendingSaveData.address.state} {pendingSaveData.address.zip}
                </span>
              </div>
              <div className="grid grid-cols-3">
                <span className="font-semibold text-muted-foreground">
                  Status:
                </span>
                <span className="col-span-2">
                  {pendingSaveData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              {pendingSaveData.addressVerification && (
                <div className="grid grid-cols-3 items-center">
                  <span className="font-semibold text-muted-foreground">
                    Address Verification:
                  </span>
                  <span
                    className={`col-span-2 flex items-center gap-1.5 text-sm ${
                      pendingSaveData.addressVerification.deliverability ===
                      "undeliverable"
                        ? "text-red-600"
                        : "text-emerald-600 font-medium"
                    }`}
                  >
                    {pendingSaveData.addressVerification.deliverability ===
                    "undeliverable" ? (
                      <ShieldAlert className="w-4 h-4" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                    <span className="capitalize">
                      {pendingSaveData.addressVerification.deliverability.replace(
                        /_/g,
                        " ",
                      )}
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmSaveOpen(false)}
            >
              Back to Edit
            </Button>
            <Button
              onClick={confirmSave}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Confirm & Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Modal */}
      <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Agency</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this agency? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setIsConfirmDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
