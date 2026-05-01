import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { getFundingApplications } from "@/service/apply-funding";
import { getUserDocuments } from "@/service/user";
import { ApplyFundingWithUser } from "@/schema/apply-funding";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    // Fetch all funding applications (can be filtered by status if needed)
    const applications = await getFundingApplications({});

    if (!applications) {
      return NextResponse.json([], { status: 200 });
    }

    // Filter for Income Based Funding
    const incomeFundingApps = applications.filter((app: ApplyFundingWithUser) =>
      app.fundingProducts?.includes("Business Income Based Funding"),
    );

    // Map to AdminClient format and fetch documents
    const mappedClients = await Promise.all(
      incomeFundingApps.map(async (app: ApplyFundingWithUser) => {
        const computation = (app as any).businessIncomeComputation || {};
        const userDocs = await getUserDocuments({ userId: app.userId! });

        // Build document status
        const requiredDocsKeys = [
          {
            key: "ein",
            type: "EIN_LETTER",
            title: "EIN Letter",
            required: true,
          },
          {
            key: "articles",
            type: "ARTICLES_OF_ORGANIZATION",
            title: "Articles of Incorporation",
            required: true,
          },
          {
            key: "voidedCheck",
            type: "VOIDED_CHECK",
            title: "Voided Check",
            required: true,
          },
          {
            key: "id",
            type: "DRIVERS_LICENSE",
            title: "Driver's License / ID",
            required: false,
          },
          {
            key: "bankStatements",
            type: "BANK_STATEMENTS",
            title: "Bank Statements",
            required: true,
          },
        ];

        const documents = requiredDocsKeys.map((def) => {
          const matchingDocs = userDocs.filter((d: any) => {
            const rawName = d.name.split("/").pop() || "";
            return rawName.startsWith(def.type + "_");
          });

          const matchingDoc = matchingDocs[0];

          const files = matchingDocs.map((md: any) => ({
            fileName: md.name.split("/").pop(),
            fileSize: `${(md.size / 1024).toFixed(1)} KB`,
            signedUrl: md.signedUrl || md.downloadUrl,
            contentType: md.contentType,
          }));

          return {
            key: def.key,
            title: def.title,
            description: "", // Can add description if needed
            required: def.required,
            status: matchingDocs.length > 0 ? "uploaded" : "required",
            fileName: matchingDoc
              ? matchingDoc.name.split("/").pop()
              : undefined,
            fileSize: matchingDoc
              ? `${(matchingDoc.size / 1024).toFixed(1)} KB`
              : undefined,
            signedUrl: matchingDoc
              ? matchingDoc.signedUrl || matchingDoc.downloadUrl
              : undefined,
            contentType: matchingDoc ? matchingDoc.contentType : undefined,
            files: files.length > 0 ? files : undefined,
          };
        });

        // Map status
        let status = "prequalified";
        if (app.status === "Processing" || app.status === "Sent to Brokerage")
          status = "under-review";
        if (app.status === "Pre-Approved") status = "offers-ready";
        if (app.status === "Approved") status = "complete";

        return {
          referenceNumber: app.referenceNumber,
          uid: app.userId,
          firstName: app.user?.firstName || "",
          lastName: app.user?.lastName || "",
          businessName: app.businessName || "Unknown Business",
          monthlyRevenue: app.annualBusinessRevenue
            ? app.annualBusinessRevenue / 12
            : 0,
          grade: computation.assignedGrade || "D",
          preApprovedAmount: computation.estimatedApprovalAmount || 0,
          status,
          backendStatus: app.status,
          submittedAt: app.appliedDate,
          documents,
          offers: (app as any).offers || [],
          underwritingInput: {
            monthlyDeposits: app.annualBusinessRevenue
              ? app.annualBusinessRevenue / 12
              : 0,
            endingBalance: 0,
            averageDailyBalance: app.avgDailyBankBalance || 0,
            negativeDays: 0,
            nsfCount: 0,
            timeInBusinessMonths: app.dateOfIncorporation
              ? Math.floor(
                  (Date.now() - new Date(app.dateOfIncorporation).getTime()) /
                    (1000 * 60 * 60 * 24 * 30),
                )
              : 0,
            industryType: app.industryField || "",
            creditScore: 0,
          },
          underwritingResult: {
            grade: computation.assignedGrade || "D",
            maxFundingAmount: computation.estimatedApprovalAmount || 0,
            multiplier: computation.multiplierUsed || 1,
            baseMultiple: 0,
            percentage: 0,
            rationale: computation.rationale || "",
          },
        };
      }),
    );

    return NextResponse.json(mappedClients, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin income funding:", error);
    return internalServerError();
  }
});
