"use client";

import { useEffect, useState } from "react";
import { useSystemConfig, useUpdateSystemConfig } from "@/hooks/system-config";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { NumberInput } from "@/components/input-number"; // or wherever it is located

export default function SystemConfigPage() {
  const { config, isLoading } = useSystemConfig();
  const { saveConfig, isPending } = useUpdateSystemConfig();

  const [markupPercentage, setMarkupPercentage] = useState<number>(0);
  const [creditRepairEnabled, setCreditRepairEnabled] =
    useState<boolean>(false);

  useEffect(() => {
    if (config) {
      setMarkupPercentage(config.markupPercentage);
      setCreditRepairEnabled(config.creditRepairEnabled);
    }
  }, [config]);

  const handleSave = () => {
    saveConfig({
      markupPercentage,
      creditRepairEnabled,
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2Icon className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage global configuration settings for the platform
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isPending ? (
            <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <SaveIcon className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tradelines Settings</CardTitle>
            <CardDescription>
              Configure settings related to tradeline purchasing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="markupPercentage">Markup Percentage (%)</Label>
              <div className="flex items-center gap-2">
                <NumberInput
                  id="markupPercentage"
                  className="w-24"
                  value={markupPercentage}
                  onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                  disabled={isPending}
                  allowNegative={false}
                  min={0}
                />
              </div>
              <p className="text-xs text-gray-500">
                This percentage will be added to the base price of all
                tradelines.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>
              Toggle specific features on or off
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="creditRepairEnabled" className="text-base">
                  Credit Repair Module
                </Label>
                <p className="text-xs text-gray-500">
                  Enable or disable the credit repair functionality for clients.
                </p>
              </div>
              <Switch
                id="creditRepairEnabled"
                checked={creditRepairEnabled}
                onCheckedChange={setCreditRepairEnabled}
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
