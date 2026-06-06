"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLeadQuery } from "@/hooks/admin/leads";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Building2,
  Calendar,
  FileText,
  CreditCard,
  DollarSign,
  Landmark,
  Clock,
  IdCard,
  Copy,
} from "lucide-react";
import { FundingType } from "@/schema/new-registration";

export const LeadDetails = ({ leadId }: { leadId: string }) => {
  const router = useRouter();
  const { data: lead, isLoading, error } = useLeadQuery(leadId);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] gap-4">
        <div className="text-xl font-semibold text-gray-500">
          Lead not found or error loading data
        </div>
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const isPersonal =
    lead.fundingType === FundingType.Personal ||
    lead.fundingType === FundingType.Both;
  const isBusiness =
    lead.fundingType === FundingType.Business ||
    lead.fundingType === FundingType.Both;

  return (
    <div className="space-y-6 mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/leads")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-row gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {lead.firstName} {lead.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">
                {lead.status}
              </Badge>
            </div>
          </div>
        </div>
        {lead.createdAt && (
          <div className="flex items-center text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
            <Calendar className="mr-2 h-4 w-4" />
            Created: {new Date(lead.createdAt).toLocaleString()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader className="bg-slate-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  First Name
                </p>
                <p className="font-medium">{lead.firstName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  Last Name
                </p>
                <p className="font-medium">{lead.lastName}</p>
              </div>
              {lead.middleName && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Middle Name
                  </p>
                  <p className="font-medium">{lead.middleName}</p>
                </div>
              )}
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{lead.email}</span>
                {lead.email && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(lead.email!);
                      toast.success("Email copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{lead.phoneNumber}</span>
                {lead.phoneNumber && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      navigator.clipboard.writeText(lead.phoneNumber!);
                      toast.success("Phone number copied to clipboard");
                    }}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {lead.ssn && (
                <div className="flex items-center gap-3">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    XXX-XX-{lead.ssn.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Funding Details */}
        <Card>
          <CardHeader className="bg-emerald-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              Funding Details
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
              <div className="space-y-1">
                <p className="text-sm font-medium text-emerald-800">
                  Requested Amount
                </p>
                <p className="text-2xl font-bold text-emerald-700">
                  {lead.fundingAmount
                    ? `$${lead.fundingAmount.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                {lead.fundingType || "Unknown"}
              </Badge>
            </div>

            {isPersonal && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" /> Credit Score
                    </p>
                    <p className="font-medium">{lead.creditScore || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5" /> Employment
                    </p>
                    <p className="font-medium">
                      {lead.employmentType || "N/A"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Business Information (if applicable) */}
        {isBusiness && (
          <Card className="md:col-span-2">
            <CardHeader className="bg-purple-50/50 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-purple-500" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Business Name
                  </p>
                  <p className="font-medium">{lead.businessName || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Industry
                  </p>
                  <p className="font-medium">
                    {lead.businessIndustry || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    EIN
                  </p>
                  <p className="font-medium">{lead.ein || "N/A"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Time in Business
                  </p>
                  <p className="font-medium">{lead.timeInBusiness || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents */}
        <Card className="md:col-span-2">
          <CardHeader className="bg-amber-50/50 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-500" />
              Documents Uploaded
            </CardTitle>
            <CardDescription>
              Status of required documents during registration
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <IdCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Driver's License</span>
                </div>
                <Badge
                  variant={
                    lead.driverLicense?.uploaded ? "default" : "destructive"
                  }
                  className={lead.driverLicense?.uploaded ? "bg-green-600" : ""}
                >
                  {lead.driverLicense?.uploaded ? "Yes" : "No"}
                </Badge>
              </div>

              {isPersonal && lead.employmentType === "W2" && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">Paystubs</span>
                  </div>
                  <Badge
                    variant={
                      lead.personalDocs?.paystubs?.uploaded
                        ? "default"
                        : "destructive"
                    }
                    className={
                      lead.personalDocs?.paystubs?.uploaded
                        ? "bg-green-600"
                        : ""
                    }
                  >
                    {lead.personalDocs?.paystubs?.uploaded ? "Yes" : "No"}
                  </Badge>
                </div>
              )}

              {isPersonal && lead.employmentType === "Self-employed" && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      Personal Bank Statements
                    </span>
                  </div>
                  <Badge
                    variant={
                      lead.personalDocs?.bankStatements?.uploaded
                        ? "default"
                        : "destructive"
                    }
                    className={
                      lead.personalDocs?.bankStatements?.uploaded
                        ? "bg-green-600"
                        : ""
                    }
                  >
                    {lead.personalDocs?.bankStatements?.uploaded ? "Yes" : "No"}
                  </Badge>
                </div>
              )}

              {isBusiness && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Landmark className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      Business Bank Statements
                    </span>
                  </div>
                  <Badge
                    variant={
                      lead.businessDocs?.bankStatements?.uploaded
                        ? "default"
                        : "destructive"
                    }
                    className={
                      lead.businessDocs?.bankStatements?.uploaded
                        ? "bg-green-600"
                        : ""
                    }
                  >
                    {lead.businessDocs?.bankStatements?.uploaded ? "Yes" : "No"}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
