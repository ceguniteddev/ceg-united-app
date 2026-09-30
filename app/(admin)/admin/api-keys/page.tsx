"use client";

import { useEffect, useState, useTransition } from "react";
import {
  getApiKeys,
  createApiKeyAction,
  revokeApiKeyAction,
  activateApiKeyAction,
  deleteApiKeyAction,
} from "@/service/api-key";
import { ApiKeyRecord, ALL_SCOPES } from "@/schema/api-key";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Key,
  Plus,
  Copy,
  Check,
  ShieldAlert,
  Trash2,
  RefreshCw,
  Lock,
  Radio,
  Server,
  Activity,
} from "lucide-react";
import { withAdminGuard } from "@/components/wrapper";
import HeaderBox from "@/components/HeaderBox";

function ApiKeysAdminPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create Modal
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([
    "health:read",
    "clients:read",
    "snapshot:read",
    "payments:read",
    "credit:read",
    "funding:read",
    "notes:read",
    "notes:write",
  ]);
  const [burstLimit, setBurstLimit] = useState(600);
  const [hourlyQuota, setHourlyQuota] = useState(10000);
  const [env, setEnv] = useState<"live" | "test">("live");

  // Success Created Key Reveal Dialog
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const data = await getApiKeys();
      setKeys(data);
    } catch (err) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = () => {
    if (!keyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }
    if (selectedScopes.length === 0) {
      toast.error("Select at least one scope");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createApiKeyAction({
          name: keyName.trim(),
          scopes: selectedScopes,
          burstPerMinute: burstLimit,
          hourlyQuota,
          env,
        });

        toast.success("API key created successfully!");
        setCreateOpen(false);
        setKeyName("");
        setRevealedKey(res.rawKey);
        fetchKeys();
      } catch (err: any) {
        toast.error(err?.message || "Failed to create API key");
      }
    });
  };

  const handleToggleStatus = (keyRecord: ApiKeyRecord) => {
    const isRevoked = keyRecord.status === "revoked";
    startTransition(async () => {
      try {
        if (isRevoked) {
          await activateApiKeyAction(keyRecord.id);
          toast.success(`Key '${keyRecord.name}' activated`);
        } else {
          await revokeApiKeyAction(keyRecord.id);
          toast.warning(`Key '${keyRecord.name}' revoked`);
        }
        fetchKeys();
      } catch (err) {
        toast.error("Failed to update key status");
      }
    });
  };

  const handleDelete = (keyId: string, name: string) => {
    if (
      !confirm(`Are you sure you want to permanently delete API key '${name}'?`)
    )
      return;
    startTransition(async () => {
      try {
        await deleteApiKeyAction(keyId);
        toast.success("API key deleted");
        fetchKeys();
      } catch (err) {
        toast.error("Failed to delete API key");
      }
    });
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  };

  const selectAllScopes = () => {
    setSelectedScopes([...ALL_SCOPES]);
  };

  const selectAssistantPreset = () => {
    setSelectedScopes([
      "health:read",
      "clients:read",
      "snapshot:read",
      "payments:read",
      "credit:read",
      "funding:read",
      "notes:read",
      "notes:write",
      "include:ssn_last4",
      "include:credit_scores",
      "include:negatives_summary",
    ]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const activeCount = keys.filter((k) => k.status === "active").length;
  const revokedCount = keys.filter((k) => k.status === "revoked").length;

  return (
    <div className="flex w-full flex-col gap-6 py-6 font-inter">
      {/* Blue Themed Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-blue-100 dark:border-blue-900/40">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl shadow-md shadow-blue-500/20">
            <Key className="size-6" />
          </div>
          <div>
            <HeaderBox
              title="API Keys Management"
              subtext="Manage and monitor external API access for AI voice/chat assistants and partner webhooks"
            />
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchKeys}
            disabled={loading}
            className="border-blue-200 hover:bg-blue-50/50 text-blue-700 dark:border-blue-800 dark:text-blue-300 transition-colors"
          >
            <RefreshCw
              className={`size-4 mr-1.5 ${loading ? "animate-spin text-blue-600" : "text-blue-600"}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="size-4" /> Create API Key
          </Button>
        </div>
      </div>

      {/* Blue Themed Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              Total Keys
            </span>
            <Server className="size-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
            {keys.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">
              Active Keys
            </span>
            <Activity className="size-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">
            {activeCount}
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200 dark:border-rose-800/60 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Revoked Keys
            </span>
            <Radio className="size-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold text-rose-900 dark:text-rose-100 mt-2">
            {revokedCount}
          </p>
        </div>
      </div>

      {/* Blue Table Card */}
      <div className="border border-blue-100 dark:border-blue-900/50 rounded-xl bg-white dark:bg-card shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border-b border-blue-100 dark:border-blue-900/50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-blue-950 dark:text-blue-200">
            Registered Service Credentials
          </h2>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
            Live database:{" "}
            <code className="bg-blue-100/70 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-[11px]">
              ceg-united-api
            </code>
          </span>
        </div>

        <Table>
          <TableHeader className="bg-blue-50/30 dark:bg-blue-950/10">
            <TableRow className="hover:bg-transparent border-blue-100 dark:border-blue-900/40">
              <TableHead className="text-blue-900 dark:text-blue-300 font-semibold">
                Key Name & ID
              </TableHead>
              <TableHead className="text-blue-900 dark:text-blue-300 font-semibold">
                Prefix
              </TableHead>
              <TableHead className="text-blue-900 dark:text-blue-300 font-semibold">
                Scopes
              </TableHead>
              <TableHead className="text-blue-900 dark:text-blue-300 font-semibold">
                Limits
              </TableHead>
              <TableHead className="text-blue-900 dark:text-blue-300 font-semibold">
                Status
              </TableHead>
              <TableHead className="text-blue-900 dark:text-blue-300 font-semibold">
                Created / Last Used
              </TableHead>
              <TableHead className="text-right text-blue-900 dark:text-blue-300 font-semibold">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {keys.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-36 text-center text-muted-foreground"
                >
                  {loading
                    ? "Loading API credentials from Firestore..."
                    : "No API keys created yet. Click 'Create API Key' to generate one."}
                </TableCell>
              </TableRow>
            ) : (
              keys.map((keyRecord) => {
                const isActive = keyRecord.status === "active";
                return (
                  <TableRow
                    key={keyRecord.id}
                    className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors border-blue-50 dark:border-blue-900/30"
                  >
                    <TableCell className="font-semibold text-sm">
                      <span className="text-blue-950 dark:text-blue-100">
                        {keyRecord.name}
                      </span>
                      <div className="text-[11px] text-muted-foreground font-mono font-normal mt-0.5">
                        {keyRecord.id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-mono border border-blue-200/60 dark:border-blue-800/40">
                        {keyRecord.keyPrefix}...
                      </code>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {keyRecord.scopes.slice(0, 3).map((s) => (
                          <Badge
                            key={s}
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40"
                          >
                            {s}
                          </Badge>
                        ))}
                        {keyRecord.scopes.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 border-blue-200 text-blue-600 dark:border-blue-800 dark:text-blue-400"
                          >
                            +{keyRecord.scopes.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="font-medium text-slate-700 dark:text-slate-300">
                        {keyRecord.rateLimit?.burstPerMinute || 600} req/min
                      </div>
                      <div className="text-[11px]">
                        {keyRecord.rateLimit?.hourlyQuota || 10000} req/hr
                      </div>
                    </TableCell>
                    <TableCell>
                      {isActive ? (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 font-medium">
                          Active
                        </Badge>
                      ) : (
                        <Badge
                          variant="destructive"
                          className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-medium"
                        >
                          Revoked
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>
                        Created:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {keyRecord.createdAt
                            ? new Date(keyRecord.createdAt).toLocaleDateString()
                            : "-"}
                        </span>
                      </div>
                      <div>
                        Last used:{" "}
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {keyRecord.lastUsedAt
                            ? new Date(
                                keyRecord.lastUsedAt,
                              ).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant={isActive ? "outline" : "default"}
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleToggleStatus(keyRecord)}
                          className={`h-8 text-xs font-medium transition-all ${
                            isActive
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50 dark:hover:bg-rose-950/30"
                              : "bg-blue-600 hover:bg-blue-700 text-white"
                          }`}
                        >
                          {isActive ? "Revoke" : "Activate"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isPending}
                          onClick={() =>
                            handleDelete(keyRecord.id, keyRecord.name)
                          }
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Key Dialog (Blue Theme) */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-xl border-blue-200 dark:border-blue-900 shadow-xl">
          <DialogHeader className="border-b border-blue-100 dark:border-blue-900/50 pb-3">
            <DialogTitle className="text-blue-950 dark:text-blue-100 flex items-center gap-2">
              <Key className="size-5 text-blue-600" /> Create API Key
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Generate credentials for external agents or automated
              integrations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="keyName"
                className="text-xs font-semibold text-blue-950 dark:text-blue-200"
              >
                Key Label / Service Name
              </Label>
              <Input
                id="keyName"
                placeholder="e.g. Retell AI Voice Agent - Staging"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                className="border-blue-200 dark:border-blue-800/80 focus-visible:ring-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="burst"
                  className="text-xs font-semibold text-blue-950 dark:text-blue-200"
                >
                  Burst Rate Limit (Req/Min)
                </Label>
                <Input
                  id="burst"
                  type="number"
                  value={burstLimit}
                  onChange={(e) =>
                    setBurstLimit(parseInt(e.target.value, 10) || 600)
                  }
                  className="border-blue-200 dark:border-blue-800/80 focus-visible:ring-blue-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="hourly"
                  className="text-xs font-semibold text-blue-950 dark:text-blue-200"
                >
                  Hourly Quota (Req/Hr)
                </Label>
                <Input
                  id="hourly"
                  type="number"
                  value={hourlyQuota}
                  onChange={(e) =>
                    setHourlyQuota(parseInt(e.target.value, 10) || 10000)
                  }
                  className="border-blue-200 dark:border-blue-800/80 focus-visible:ring-blue-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Permission Scopes
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={selectAssistantPreset}
                    className="text-[11px] text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    Assistant Preset
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={selectAllScopes}
                    className="text-[11px] text-blue-600 hover:text-blue-700 underline font-medium"
                  >
                    Select All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border border-blue-100 dark:border-blue-900/60 rounded-lg p-3 max-h-52 overflow-y-auto bg-blue-50/20 dark:bg-blue-950/10">
                {ALL_SCOPES.map((scope) => (
                  <div
                    key={scope}
                    className="flex items-center space-x-2 py-0.5"
                  >
                    <Checkbox
                      id={scope}
                      checked={selectedScopes.includes(scope)}
                      onCheckedChange={() => toggleScope(scope)}
                      className="border-blue-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <label
                      htmlFor={scope}
                      className="text-xs font-mono leading-none cursor-pointer text-slate-800 dark:text-slate-200"
                    >
                      {scope}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="border-t border-blue-100 dark:border-blue-900/50 pt-3">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
            >
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Secret Key Reveal Dialog (Blue/Emerald Success Theme) */}
      <Dialog
        open={Boolean(revealedKey)}
        onOpenChange={(open) => !open && setRevealedKey(null)}
      >
        <DialogContent className="max-w-lg border-blue-300 dark:border-blue-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
              <Lock className="size-5 text-blue-600" /> Copy Secret API Key
            </DialogTitle>
            <DialogDescription className="text-xs">
              Please copy this key now. For security purposes, it will never be
              displayed again.
            </DialogDescription>
          </DialogHeader>

          <div className="my-3 space-y-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 font-mono text-sm break-all">
              <span className="flex-1 font-semibold text-blue-950 dark:text-blue-100 select-all">
                {revealedKey}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => revealedKey && copyToClipboard(revealedKey)}
                className="shrink-0 gap-1 bg-white hover:bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              >
                {copied ? (
                  <Check className="size-4 text-emerald-600" />
                ) : (
                  <Copy className="size-4" />
                )}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-2.5 rounded-lg flex items-center gap-2">
              <ShieldAlert className="size-4 shrink-0 text-amber-600" />
              Store this secret key securely. It cannot be retrieved after
              closing this dialog.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setRevealedKey(null)}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAdminGuard(ApiKeysAdminPage);
