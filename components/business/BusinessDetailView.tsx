import { Business } from "@/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  TrendingUp,
  Landmark,
  DollarSign,
  CalendarDays,
  FileText,
  BarChart3,
  CreditCard,
  AlertCircle,
  PencilIcon,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import IconMenu from "@/components/icon-menu";

type BusinessDetailViewProps = {
  business: Business;
  crsBusinessProfile?: any;
  crsBusinessScore?: any;
  onEdit?: (business: Business) => void;
};

export const BusinessDetailView = ({
  business,
  crsBusinessProfile,
  crsBusinessScore,
  onEdit,
}: BusinessDetailViewProps) => {
  const profile = crsBusinessProfile?.report;
  const commScore = profile?.scoreInformation?.commercialScore;
  const fsrScore = profile?.scoreInformation?.fsrScore;
  const isActive =
    profile?.commercialFraudShieldSummary?.activeBusinessIndicator;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/50">
            <Building2 className="text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold">{business.businessName}</h2>
            <p className="text-sm text-muted-foreground">
              EIN: {business.employerIdentificationNumber}
            </p>
          </div>
        </div>
        {onEdit && (
          <Button variant="outline" onClick={() => onEdit(business)}>
            <IconMenu
              icon={<PencilIcon data-icon="inline-start" />}
              text="Edit"
            />
          </Button>
        )}
      </div>

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid grid-cols-3 gap-1">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
          {/* <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="tradelines">Tradelines</TabsTrigger>
          <TabsTrigger value="fundability">Fundability</TabsTrigger> */}
        </TabsList>

        {/* Business Information */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Core business details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={<Building2 />}
                  label="Business Name"
                  value={business.businessName}
                />
                <InfoItem
                  icon={<Hash />}
                  label="EIN"
                  value={business.employerIdentificationNumber}
                />
                <InfoItem
                  icon={<Phone />}
                  label="Phone"
                  value={business.businessPhoneNumber}
                />
                <InfoItem
                  icon={<Mail />}
                  label="Email"
                  value={business.businessEmail}
                />
                {business.businessWebsite && (
                  <InfoItem
                    icon={<Globe />}
                    label="Website"
                    value={business.businessWebsite}
                    isLink
                  />
                )}
              </div>

              <Separator />

              <div>
                <h3 className="mb-3 text-sm font-semibold">Business Address</h3>
                <div className="flex gap-3">
                  <MapPin className="mt-1 shrink-0 text-muted-foreground" />
                  <div className="text-sm">
                    {business.businessStreetHouseNumber && (
                      <p>
                        {business.businessStreetHouseNumber}{" "}
                        {business.businessStreetAddress}
                      </p>
                    )}
                    {!business.businessStreetHouseNumber && (
                      <p>{business.businessStreetAddress}</p>
                    )}
                    <p>
                      {business.businessCityAddress},{" "}
                      {business.businessStateAddress}{" "}
                      {business.businessPostalAddress}
                    </p>
                  </div>
                </div>
              </div>

              {business.socialMedia && business.socialMedia.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="mb-3 text-sm font-semibold">Social Media</h3>
                    <div className="flex flex-wrap gap-2">
                      {business.socialMedia.map(
                        (social, idx) =>
                          social?.platform &&
                          social?.handle && (
                            <Badge key={idx} variant="secondary">
                              {social.platform}: {social.handle}
                            </Badge>
                          ),
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Status */}
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Status</CardTitle>
              <CardDescription>
                Current operational status and activity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">
                    Active Business Indicator
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From credit reporting services
                  </p>
                </div>
                <Badge
                  variant={isActive ? "default" : "secondary"}
                  className={isActive ? "bg-green-600" : ""}
                >
                  {isActive ? "Active" : "Unknown"}
                </Badge>
              </div>

              {!crsBusinessProfile && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Business credit profile not yet generated. Status
                    information will be available after running a credit report.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit Report */}
        <TabsContent value="credit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Credit Report</CardTitle>
              <CardDescription>
                Credit scores and financial stability metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {crsBusinessProfile || crsBusinessScore ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    icon={<TrendingUp />}
                    label="Commercial Credit Score"
                    value={commScore?.score?.toString() ?? "N/A"}
                    description="Overall business creditworthiness"
                    variant="primary"
                  />
                  <StatCard
                    icon={<Landmark />}
                    label="Financial Stability Risk"
                    value={fsrScore?.riskClass?.definition ?? "N/A"}
                    description="Risk classification level"
                    variant="primary"
                  />
                  <StatCard
                    icon={<DollarSign />}
                    label="Credit Limit"
                    value="N/A"
                    description="Available credit line"
                    variant="muted"
                  />
                  <StatCard
                    icon={<CalendarDays />}
                    label="Days Beyond Terms"
                    value="N/A"
                    description="Payment performance"
                    variant="muted"
                  />
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No credit report data available. Generate a business credit
                    report to view detailed scoring and metrics.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Finance Audit Report (Placeholder) */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Finance Audit Report</CardTitle>
              <CardDescription>
                Comprehensive financial analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <FileText className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 font-semibold">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    Business finance audit reports are currently in development.
                    This feature will provide detailed financial analysis and
                    improvement recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Tradelines (Placeholder) */}
        <TabsContent value="tradelines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Tradelines Suggestions</CardTitle>
              <CardDescription>
                Recommended tradelines to improve business credit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <CreditCard className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 font-semibold">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    Business tradeline suggestions are currently in development.
                    This feature will recommend tradelines to help build and
                    improve your business credit profile.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fundability Score (Placeholder) */}
        <TabsContent value="fundability" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Fundability Audit</CardTitle>
              <CardDescription>
                Assessment of your business&apos;s readiness for funding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                  <BarChart3 className="text-muted-foreground" />
                </div>
                <div className="text-center">
                  <h3 className="mb-2 font-semibold">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    Business fundability scoring is currently in development.
                    This feature will analyze your business&apos;s readiness for
                    various funding opportunities and provide actionable
                    insights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper Components
const InfoItem = ({
  icon,
  label,
  value,
  isLink = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
}) => (
  <div className="flex gap-3">
    <div className="shrink-0 text-muted-foreground">{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {isLink ? (
        <a
          href={value.startsWith("http") ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="truncate text-sm font-medium text-primary hover:underline"
        >
          {value}
        </a>
      ) : (
        <p className="truncate text-sm font-medium">{value}</p>
      )}
    </div>
  </div>
);

const StatCard = ({
  icon,
  label,
  value,
  description,
  variant = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
  variant?: "primary" | "muted";
}) => (
  <div
    className={`flex items-center gap-3 rounded-lg border p-4 ${variant === "muted" ? "opacity-60" : ""}`}
  >
    <div
      className={`shrink-0 rounded-md p-2 ${variant === "primary" ? "bg-primary/10" : "bg-muted"}`}
    >
      <div
        className={
          variant === "primary" ? "text-primary" : "text-muted-foreground"
        }
      >
        {icon}
      </div>
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  </div>
);
