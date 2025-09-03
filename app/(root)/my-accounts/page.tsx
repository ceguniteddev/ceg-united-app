"use client";
import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import NoBankLinked from "@/components/NoBankLinked";
import Spinner from "@/components/Spinner";
import { useGetPlaidAccounts, usePlaidAccountsMutation } from "@/hooks/plaid";
import { useAuth } from "@/provider/AuthContext";
import React, { useCallback, useMemo, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
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
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

type Group = {
  institutionId: string | null;
  institutionName: string | null;
  bankItemIds: string[];
  accounts: Account[];
  totalCurrentBalance: number;
  totalAvailableBalance: number;
};

const MyBanks = () => {
  // expose refetch from your hook (react-query style); adjust if your hook differs
  const { plaidAccounts, isLoading, refetch } = useGetPlaidAccounts();
  const { removeBankAccount, isDeleting } = usePlaidAccountsMutation();
  const { user } = useAuth();

  const [selectedGroupIdx, setSelectedGroupIdx] = useState<string>("all");
  const [selectedBankItemId, setSelectedBankItemId] = useState<string>("");

  const groups: Group[] = useMemo(
    () => (plaidAccounts?.groups ?? []) as Group[],
    [plaidAccounts?.groups]
  );

  const selectedGroup: Group | null = useMemo(() => {
    if (selectedGroupIdx === "all") return null;
    return groups[Number(selectedGroupIdx)] ?? null;
  }, [selectedGroupIdx, groups]);

  // Compute visible accounts based on selected group
  const visibleAccounts: Account[] = useMemo(() => {
    const all = (plaidAccounts?.data ?? []) as Account[];
    if (selectedGroupIdx === "all") return all;
    const g = groups[Number(selectedGroupIdx)];
    if (!g) return all;

    // If Plaid returned an institutionId, use that; otherwise filter by item ids
    return all.filter((a) =>
      g.institutionId ? a.institutionId === g.institutionId : g.bankItemIds?.includes(a.bankItemId)
    );
  }, [plaidAccounts?.data, groups, selectedGroupIdx]);

  const handleSelectGroupChange = useCallback(
    (idx: string) => {
      setSelectedGroupIdx(idx);

      if (idx === "all") {
        setSelectedBankItemId("");
        return;
      }
      const g = groups[Number(idx)];
      if (!g) {
        setSelectedBankItemId("");
        return;
      }
      // pick first item id in the group; the delete action will remove *all* ids in the group
      setSelectedBankItemId(g.bankItemIds[0] ?? "");
    },
    [groups]
  );

  const canShowRemove = Boolean(
    selectedBankItemId && selectedGroup && selectedGroup.bankItemIds?.length
  );

  // Adjust to your API route / mutation; this example deletes all items in the selected group
  const removeSelectedInstitution = useCallback(async () => {
    if (!selectedGroup) return;

    const bankItemIds = selectedGroup.bankItemIds ?? [];
    if (!bankItemIds.length) return;

    try {
      await removeBankAccount(bankItemIds[0]);

      // Reset selection and refresh list
      setSelectedGroupIdx("all");
      setSelectedBankItemId("");
      await refetch?.();
    } catch (err) {
      console.error(err);
      // optional: surface a toast here
      toast.error(err instanceof Error ? err.message : "Failed to remove accounts");
    }
  }, [selectedGroup, refetch, removeBankAccount]);

  if (!user) return null;
  if (isLoading) return <Spinner />;

  if (!plaidAccounts || !plaidAccounts.data?.length) {
    return <NoBankLinked />;
  }

  return (
    <section className="flex">
      <div className="my-banks w-full">
        <HeaderBox title="My Bank Accounts" subtext="Effortlessly manage your banking activites." />

        {/* Toolbar: Institution filter + Remove button */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border bg-muted/30 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="institution-select" className="text-sm font-medium">
              Institution
            </Label>
            <Select value={selectedGroupIdx} onValueChange={handleSelectGroupChange}>
              <SelectTrigger id="institution-select" className="w-[280px]">
                <SelectValue placeholder="All institutions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All institutions</SelectItem>
                {groups.map((g, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {g.institutionName ?? "Unknown institution"} • {g.accounts.length} account
                    {g.accounts.length === 1 ? "" : "s"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spacer pushes button to the right */}
          <div className="ml-auto" />

          {canShowRemove && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2Icon className="h-4 w-4" />
                  )}
                  Remove institution accounts
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove all accounts from this institution?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will unlink{" "}
                    <span className="font-semibold">
                      {selectedGroup?.accounts.length ?? 0} account
                      {(selectedGroup?.accounts.length ?? 0) === 1 ? "" : "s"}
                    </span>{" "}
                    from{" "}
                    <span className="font-semibold">
                      {selectedGroup?.institutionName ?? "this institution"}
                    </span>
                    . You can re-link later if needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={removeSelectedInstitution} disabled={isDeleting}>
                    {isDeleting ? "Removing..." : "Remove"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-6">
            {visibleAccounts.map((a: Account) => (
              <BankCard key={a.id} account={a} userName={user?.displayName ?? ""} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;
