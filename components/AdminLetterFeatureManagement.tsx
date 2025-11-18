"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserWithId } from "@/schema/registration";
import { useToggleLetterFeatureMutation } from "@/hooks/user";
import { useCallback } from "react";
import {
  FileText,
  Mail,
  Shield,
  AlertTriangle,
  Clock,
  DollarSign,
  UserCheck,
  Search,
  FileWarning,
  RefreshCcw,
  RotateCcw,
  CheckCircle,
  Banknote,
  ShieldAlert,
} from "lucide-react";

interface LetterFeatureConfig {
  key: keyof UserWithId;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const LETTER_FEATURES: LetterFeatureConfig[] = [
  {
    key: "letterFeatureEnabled",
    label: "Credit Report Disputes",
    description:
      "Allow user to generate and send dispute letters for credit report errors",
    icon: <FileText className="h-5 w-5" />,
    color: "blue",
  },
  {
    key: "latePaymentRemovalEnabled",
    label: "Late Payment Removal (USC 1666b)",
    description:
      "Generate letters to remove late payments using USC 1666b billing error provisions",
    icon: <Clock className="h-5 w-5" />,
    color: "amber",
  },
  {
    key: "unauthorizedInquiryRemovalEnabled",
    label: "Unauthorized Inquiry Removal",
    description:
      "Create letters to dispute and remove unauthorized credit inquiries",
    icon: <Search className="h-5 w-5" />,
    color: "red",
  },
  {
    key: "verifiedAccountDisputeEnabled",
    label: "Verified Account Re-Dispute",
    description:
      "Generate follow-up letters when accounts come back verified after initial dispute",
    icon: <RefreshCcw className="h-5 w-5" />,
    color: "purple",
  },
  {
    key: "noResponseFollowUpEnabled",
    label: "No Response Follow-Up",
    description:
      "Send follow-up letters when bureaus fail to respond within statutory timeframes",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "green",
  },
  {
    key: "reinsertedAccountDisputeEnabled",
    label: "Reinserted Account Disputes",
    description:
      "Challenge accounts that were previously deleted but reappeared without proper notification",
    icon: <RotateCcw className="h-5 w-5" />,
    color: "purple",
  },
  {
    key: "accountErrorCorrectionEnabled",
    label: "Account Error Corrections",
    description:
      "Dispute accounts with data accuracy issues like incorrect balances, wrong dates, or inaccurate payment status",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "blue",
  },
  {
    key: "collectionAccountRemovalEnabled",
    label: "Collection Account Removal",
    description:
      "Challenge collection accounts using validation disputes, statute of limitations, and FDCPA violations",
    icon: <Banknote className="h-5 w-5" />,
    color: "red",
  },
  {
    key: "fraudulentAccountRemovalEnabled",
    label: "Fraudulent Account Removal",
    description:
      "Remove identity theft and fraudulent accounts with FTC Identity Theft Reports and police reports",
    icon: <ShieldAlert className="h-5 w-5" />,
    color: "red",
  },
];

interface AdminLetterFeatureManagementProps {
  user: UserWithId;
}

const AdminLetterFeatureManagement = ({
  user,
}: AdminLetterFeatureManagementProps) => {
  const { toggleLetterFeature, isToggling } = useToggleLetterFeatureMutation({
    userId: user.id,
  });

  const handleToggle = useCallback(
    async (enabled: boolean, featureKey: string) => {
      await toggleLetterFeature({ enabled, featureKey });
    },
    [toggleLetterFeature]
  );

  const getColorClasses = (color: string, isEnabled: boolean) => {
    const colors = {
      blue: {
        border: "border-blue-300",
        bg: isEnabled ? "bg-blue-50" : "bg-gray-50",
        text: isEnabled ? "text-blue-700" : "text-gray-600",
        iconBg: isEnabled ? "bg-blue-100" : "bg-gray-100",
        iconText: isEnabled ? "text-blue-600" : "text-gray-500",
      },
      green: {
        border: "border-green-300",
        bg: isEnabled ? "bg-green-50" : "bg-gray-50",
        text: isEnabled ? "text-green-700" : "text-gray-600",
        iconBg: isEnabled ? "bg-green-100" : "bg-gray-100",
        iconText: isEnabled ? "text-green-600" : "text-gray-500",
      },
      purple: {
        border: "border-purple-300",
        bg: isEnabled ? "bg-purple-50" : "bg-gray-50",
        text: isEnabled ? "text-purple-700" : "text-gray-600",
        iconBg: isEnabled ? "bg-purple-100" : "bg-gray-100",
        iconText: isEnabled ? "text-purple-600" : "text-gray-500",
      },
      amber: {
        border: "border-amber-300",
        bg: isEnabled ? "bg-amber-50" : "bg-gray-50",
        text: isEnabled ? "text-amber-700" : "text-gray-600",
        iconBg: isEnabled ? "bg-amber-100" : "bg-gray-100",
        iconText: isEnabled ? "text-amber-600" : "text-gray-500",
      },
      red: {
        border: "border-red-300",
        bg: isEnabled ? "bg-red-50" : "bg-gray-50",
        text: isEnabled ? "text-red-700" : "text-gray-600",
        iconBg: isEnabled ? "bg-red-100" : "bg-gray-100",
        iconText: isEnabled ? "text-red-600" : "text-gray-500",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Letter Feature Management</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Control which letter generation features are available to{" "}
            <span className="font-semibold">
              {user.firstName} {user.lastName}
            </span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {LETTER_FEATURES.map((feature) => {
            const isEnabled = user[feature.key] ?? false;
            const colors = getColorClasses(feature.color, isEnabled as boolean);

            return (
              <Card
                key={feature.key}
                className={`border-2 ${colors.border} ${colors.bg} transition-all duration-200`}
              >
                <CardContent>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div
                        className={`p-3 rounded-lg ${colors.iconBg} ${colors.iconText} flex-shrink-0`}
                      >
                        {feature.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`toggle-${feature.key}`}
                          className={`text-base font-semibold cursor-pointer ${colors.text}`}
                        >
                          {feature.label}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">
                          {feature.description}
                        </p>
                        <div className="mt-3 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              isEnabled
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {isEnabled ? "Enabled" : "Disabled"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Switch
                        id={`toggle-${feature.key}`}
                        checked={isEnabled as boolean}
                        onCheckedChange={(enabled) =>
                          handleToggle(enabled, feature.key)
                        }
                        disabled={isToggling}
                        className="data-[state=checked]:bg-blue-600"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Feature Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h4 className="font-semibold mb-2">Credit Report Disputes</h4>
              <p className="text-gray-600">
                General credit dispute letters for inaccuracies, identity theft,
                duplicate accounts, and other common credit report errors.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">
                Late Payment Removal (USC 1666b)
              </h4>
              <p className="text-gray-600">
                Specialized letters citing USC 1666b billing error provisions to
                dispute and remove late payment marks from credit reports.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">
                Unauthorized Inquiry Removal
              </h4>
              <p className="text-gray-600">
                Letters specifically designed to challenge hard inquiries that
                were not authorized by the consumer.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">
                Verified Account Re-Dispute
              </h4>
              <p className="text-gray-600">
                Strategic follow-up letters when bureaus verify disputed
                accounts. Includes escalation tactics and CFPB complaint
                procedures.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">No Response Follow-Up</h4>
              <p className="text-gray-600">
                Enforcement letters when credit bureaus fail to respond within
                the 30-day legal timeframe, citing FCRA violations.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">
                Reinserted Account Disputes
              </h4>
              <p className="text-gray-600">
                Specialized letters for accounts that were previously removed
                but illegally reinserted without proper FCRA notice. Cites
                violations of 15 USC § 1681i(a)(5) requiring written notice
                before reinsertion.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Account Error Corrections</h4>
              <p className="text-gray-600">
                Targeted letters for accounts with specific reporting errors
                such as incorrect balances, wrong payment dates, inaccurate
                account status, or misreported payment history. Focuses on data
                accuracy violations under FCRA § 1681e(b).
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Collection Account Removal</h4>
              <p className="text-gray-600">
                Specialized strategies for removing collection accounts
                including debt validation requests, statute of limitations
                challenges, FDCPA violation claims, and disputes for accounts
                sold or transferred multiple times. Targets both original
                creditors and collection agencies.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Fraudulent Account Removal</h4>
              <p className="text-gray-600">
                Identity theft dispute letters with FTC Identity Theft Report
                integration, police report documentation, and affidavits.
                Includes extended fraud alerts, credit freezes, and FCRA §
                1681c-2 enforcement for fraudulent accounts resulting from
                identity theft.
              </p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2 text-amber-700">
                Important Notes
              </h4>
              <ul className="list-disc list-inside space-y-1 ml-2 text-gray-600">
                <li>Letters require admin review before sending</li>
                <li>Letterstream API integration must be configured</li>
                <li>Users will be charged for certified mail postage</li>
                <li>Follow-up tracking is automated with 30-day reminders</li>
                <li>Each letter type addresses specific dispute scenarios</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLetterFeatureManagement;
