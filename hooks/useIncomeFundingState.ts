import { useState, useCallback, useEffect } from "react";
import type {
  DealOffer,
  DealStatus,
  DocumentRecord,
  IncomeFundingDeal,
} from "@/types/income-funding-types";
import { useUserDocumentsQuery } from "@/hooks/document";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserApplyFunding } from "@/hooks/apply-funding";
import { toast } from "sonner";
import { useConfettiStore } from "@/hooks/use-confetti-store";

const defaultEmptyDeal: IncomeFundingDeal = {
  id: "default",
  status: "prequalified",
  underwritingInput: {
    monthlyDeposits: 0,
    endingBalance: 0,
    averageDailyBalance: 0,
    negativeDays: 0,
    nsfCount: 0,
    timeInBusinessMonths: 0,
    industryType: "",
    creditScore: 0,
  },
  underwritingResult: {
    grade: "C",
    maxFundingAmount: 0,
    multiplier: 0,
    baseMultiple: 0,
    percentage: 0,
    rationale: "Pending calculation",
  },
  documents: [
    {
      key: "ein",
      title: "EIN / SS4 Letter",
      description: "Official IRS confirmation of EIN.",
      required: true,
      status: "required",
    },
    {
      key: "articles",
      title: "Articles of Organization",
      description: "State filed business documents.",
      required: true,
      status: "required",
    },
    {
      key: "voidedCheck",
      title: "Voided Check",
      description: "Must match business name and account.",
      required: true,
      status: "required",
    },
    {
      key: "id",
      title: "Driver's License",
      description: "Valid government-issued ID.",
      required: true,
      status: "required",
    },
    {
      key: "bankStatements",
      title: "Bank Statements",
      description: "Last 4 months of business bank statements.",
      required: true,
      status: "required",
    },
  ],
  offers: [],
  coordinatorId: "",
};

// ============================================
// State Machine Hook for Income-Based Funding
// ============================================
// In production, replace useState(defaultEmptyDeal) with a Firestore subscription:
//   const [deal] = useDocument(doc(db, `users/${uid}/income-funding-deals/${dealId}`))
// and persist setDeal* calls back to Firestore.

export function useIncomeFundingState() {
  const [deal, setDeal] = useState<IncomeFundingDeal>(defaultEmptyDeal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { userDocuments } = useUserDocumentsQuery({ userId: user?.uid || "" });
  const { appliedFunding, isLoading: isLoadingApplications } =
    useGetUserApplyFunding();
  const { onOpen: triggerConfetti } = useConfettiStore();

  // Find the real deal reference number
  const realDeal = appliedFunding?.find((app) =>
    app.fundingProducts?.includes("Business Income Based Funding"),
  );
  const referenceNumber = realDeal?.referenceNumber;

  // Sync with actual user documents and deal status uploaded to Firebase
  useEffect(() => {
    setDeal((d) => {
      let nextStatus = d.status;

      // Map backend status to local state machine status
      let offers = d.offers;
      let selectedOfferId = d.selectedOfferId;
      let nextUnderwritingResult = d.underwritingResult;
      let nextUnderwritingInput = d.underwritingInput;

      if (realDeal) {
        if (realDeal.status === "Sent to Brokerage") {
          nextStatus = "under-review";
        } else if (
          realDeal.status === "Pre-Approved" ||
          realDeal.status === "Offer Accepted"
        ) {
          nextStatus = "offers-ready";
        } else if (realDeal.status === "Approved") {
          nextStatus = "complete";
        }

        const backendOffers = (realDeal as any).offers;
        if (backendOffers) {
          offers = backendOffers;
        }

        if ((realDeal as any).selectedOfferId) {
          selectedOfferId = (realDeal as any).selectedOfferId;
        }

        const computation = (realDeal as any).businessIncomeComputation;
        if (computation || realDeal) {
          nextUnderwritingResult = {
            ...d.underwritingResult,
            grade: (computation?.highestRate?.replace("Tier ", "") ||
              computation?.assignedGrade ||
              d.underwritingResult.grade) as any,
            maxFundingAmount:
              computation?.preApprovedAmount ||
              computation?.estimatedApprovalAmount ||
              d.underwritingResult.maxFundingAmount,
            rationale: computation?.rationale || d.underwritingResult.rationale,
          };

          nextUnderwritingInput = {
            ...d.underwritingInput,
            monthlyDeposits: (realDeal as any).annualBusinessRevenue
              ? (realDeal as any).annualBusinessRevenue / 12
              : computation?.monthlyDeposits ||
                d.underwritingInput.monthlyDeposits,
            timeInBusinessMonths: (realDeal as any).dateOfIncorporation
              ? Math.floor(
                  (Date.now() -
                    new Date((realDeal as any).dateOfIncorporation).getTime()) /
                    (1000 * 60 * 60 * 24 * 30),
                )
              : d.underwritingInput.timeInBusinessMonths,
            averageDailyBalance:
              (realDeal as any).avgDailyBankBalance ||
              d.underwritingInput.averageDailyBalance,
            negativeDays:
              computation?.negativeDaysCount ??
              d.underwritingInput.negativeDays,
            nsfCount: computation?.nsfCount ?? d.underwritingInput.nsfCount,
          };
        }
      }

      // If we are initially in prequalified, but documents exist, we might want to stay in collecting-documents.
      // But let's only overwrite if backend has a higher status.

      let updatedDocs = d.documents;
      if (userDocuments && userDocuments.length > 0) {
        updatedDocs = d.documents.map((doc) => {
          let documentTypeId = "OTHER";
          if (doc.key === "ein") documentTypeId = "EIN_LETTER";
          else if (doc.key === "articles")
            documentTypeId = "ARTICLES_OF_ORGANIZATION";
          else if (doc.key === "id") documentTypeId = "DRIVERS_LICENSE";
          else if (doc.key === "bankStatements")
            documentTypeId = "BANK_STATEMENTS";
          else if (doc.key === "voidedCheck") documentTypeId = "VOIDED_CHECK";

          const matchingApiDocs = userDocuments.filter((apiDoc: any) => {
            const rawName = apiDoc.name.split("/").pop() || "";
            return rawName.startsWith(documentTypeId + "_");
          });

          const matchingApiDoc = matchingApiDocs[0];

          if (matchingApiDoc) {
            const files = matchingApiDocs.map((md: any) => ({
              fileName: md.name.split("/").pop(),
              fileSize: `${(md.size / 1024).toFixed(1)} KB`,
              signedUrl: md.signedUrl || md.downloadUrl,
              contentType: md.contentType,
            }));

            return {
              ...doc,
              status: "uploaded" as const,
              fileName: matchingApiDoc.name.split("/").pop() || "Document",
              fileSize: `${(matchingApiDoc.size / 1024).toFixed(1)} KB`,
              files: files,
            };
          }
          return doc;
        });
      }

      const isDocsDifferent = updatedDocs.some(
        (uDoc, i) => uDoc.status !== d.documents[i].status,
      );

      if (
        isDocsDifferent ||
        nextStatus !== d.status ||
        offers !== d.offers ||
        selectedOfferId !== d.selectedOfferId ||
        nextUnderwritingResult !== d.underwritingResult ||
        nextUnderwritingInput !== d.underwritingInput
      ) {
        return {
          ...d,
          documents: updatedDocs,
          status: nextStatus,
          offers,
          selectedOfferId,
          underwritingResult: nextUnderwritingResult,
          underwritingInput: nextUnderwritingInput,
        };
      }

      return d;
    });
  }, [
    userDocuments,
    realDeal?.status,
    (realDeal as any)?.offers,
    (realDeal as any)?.selectedOfferId,
    (realDeal as any)?.businessIncomeComputation,
  ]);

  const setStatus = useCallback((status: DealStatus) => {
    setDeal((d) => ({ ...d, status }));
  }, []);

  const setDocuments = useCallback((documents: DocumentRecord[]) => {
    setDeal((d) => ({ ...d, documents }));
  }, []);

  const uploadDocument = useCallback(
    (key: DocumentRecord["key"], fileName: string, fileSize: string) => {
      setDeal((d) => ({
        ...d,
        documents: d.documents.map((doc) =>
          doc.key === key
            ? { ...doc, status: "uploaded" as const, fileName, fileSize }
            : doc,
        ),
      }));
    },
    [],
  );

  const submitForUnderwriting = useCallback(async () => {
    if (!user?.uid || !referenceNumber) {
      toast.error("Unable to find funding application record.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(
        `/api/user/${user.uid}/funding-application/${referenceNumber}/submit-underwriting`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to submit to underwriting.");
      }

      setDeal((d) => ({
        ...d,
        status: "under-review",
        submittedAt: new Date().toISOString(),
      }));
      toast.success("Successfully submitted for underwriting!");
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.uid, referenceNumber]);

  const skipOffer = useCallback(
    async (offerId: string) => {
      if (!user?.uid || !referenceNumber) {
        toast.error("Unable to find funding application record.");
        return;
      }

      // Optimistically update local state
      setDeal((d) => ({
        ...d,
        offers: d.offers.map((o) =>
          o.id === offerId ? { ...o, status: "Skipped" } : o,
        ),
      }));

      try {
        const newOffers = deal.offers.map((o) =>
          o.id === offerId ? { ...o, status: "Skipped" } : o,
        );

        const response = await fetch(
          `/api/user/${user.uid}/funding-application/${referenceNumber}/offers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ offers: newOffers }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to skip offer.");
        }
      } catch (error: any) {
        toast.error(
          error.message || "An error occurred while skipping the offer.",
        );
        // Revert on error
        setDeal((d) => ({
          ...d,
          offers: deal.offers,
        }));
      }
    },
    [user?.uid, referenceNumber, deal.offers],
  );

  const selectOffer = useCallback((offer: DealOffer) => {
    setDeal((d) => ({ ...d, selectedOfferId: offer.id, status: "accepting" }));
  }, []);

  const acceptOffer = useCallback(
    async (
      signature: {
        type: "type" | "draw";
        value: string;
        ipAddress?: string;
        macAddress?: string;
      },
      fundingAmount: number,
      percentageFee: number,
    ) => {
      if (!user?.uid || !referenceNumber) {
        toast.error("Unable to find funding application record.");
        return;
      }

      const feeAmount = Math.round(fundingAmount * (percentageFee / 100));

      try {
        setIsSubmitting(true);

        // Update the specific offer status to "Accepted"
        const newOffers = deal.offers.map((o) =>
          o.id === deal.selectedOfferId
            ? { ...o, status: "Accepted" as const }
            : o,
        );

        await fetch(
          `/api/user/${user.uid}/funding-application/${referenceNumber}/offers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ offers: newOffers }),
          },
        );

        // Generate PDF and update status
        const response = await fetch(
          `/api/user/${user.uid}/funding-application/${referenceNumber}/status`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "Offer Accepted",
              signature,
              fundingAmount,
              feeAmount,
              percentageFee,
              offerId: deal.selectedOfferId,
            }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to accept offer.");
        }

        // Trigger confetti first
        triggerConfetti();
        toast.success("Offer accepted successfully!");

        // Wait 2.5 seconds to let the user see the confetti and success state before routing away
        await new Promise((resolve) => setTimeout(resolve, 2500));

        setDeal((d) => ({
          ...d,
          offers: newOffers,
          status: "offers-ready", // Go back to offers-ready view instead of complete
          acceptedAt: new Date().toISOString(),
        }));
      } catch (error: any) {
        toast.error(error.message || "An error occurred.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [user?.uid, referenceNumber, deal.offers, deal.selectedOfferId],
  );

  const reset = useCallback(() => {
    setDeal({
      ...defaultEmptyDeal,
      status: "prequalified",
      selectedOfferId: undefined,
    });
  }, []);

  const [isCalculating, setIsCalculating] = useState(false);

  const calculateIncomePreApproval = useCallback(async () => {
    if (!user?.uid || !referenceNumber) {
      toast.error("Unable to find funding application record.");
      return;
    }

    try {
      setIsCalculating(true);
      const response = await fetch(
        `/api/user/${user.uid}/funding-application/${referenceNumber}/calculate-income`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to calculate business income.");
      }

      toast.success(
        "Business income pre-approval calculated successfully! Please wait a moment while we update your status.",
      );
    } catch (error: any) {
      toast.error(error.message || "An error occurred.");
    } finally {
      setIsCalculating(false);
    }
  }, [user?.uid, referenceNumber]);

  return {
    deal,
    realDeal,
    isLoadingApplications,
    setStatus,
    setDocuments,
    uploadDocument,
    submitForUnderwriting,
    selectOffer,
    acceptOffer,
    skipOffer,
    reset,
    isSubmitting,
    isCalculating,
    calculateIncomePreApproval,
  };
}
