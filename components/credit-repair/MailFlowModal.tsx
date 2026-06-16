import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import type {
  GeneratedLetter,
  DisputeReasonAssignment,
} from "@/lib/credit-repair/credit-repair-types";
import { useCreditAgenciesData } from "@/hooks/consumer-reporting-agency";
import {
  mailLetterViaLob,
  mailManyLettersViaLob,
  type LobMailRequest,
  type LobMailResponse,
  type MailingMethod,
  getMailingMethods,
  MAILING_METHODS,
} from "@/lib/credit-repair/lobMailing";
import { useAuth } from "@/provider/AuthContext";
import { useFeeSettings } from "@/hooks/fee-settings";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "@/lib/firebase";
import { toast } from "sonner";
import {
  AttachDocumentsStep,
  type AttachDocumentsResult,
} from "./AttachDocumentsStep";
import { MailingOptionsStep } from "./MailingOptionsStep";
import { MailingSentStep } from "./MailingSentStep";
import { uploadDisputeLetter } from "@/service/credit-repair";
import { useQueryClient } from "@tanstack/react-query";
import { GET_USER_DOCUMENTS } from "@/constant/react-query-keys";

// ============================================
// MailFlowModal — full-screen 3-step wizard
// ============================================
// Wraps Step A (attach) → Step B (options) → Step C (sent). Owns all
// in-flight state for the flow. Parent feeds it the letters + reasons,
// and receives the final mailing results via onComplete.

export type MailFlowSubview =
  | "attaching-documents"
  | "mailing-options"
  | "mailing-sent";

interface Props {
  /** The unique dispute ID for this mailing session */
  disputeId?: string;
  /** Letters being mailed (one for single flow, many for bulk) */
  letters: GeneratedLetter[];
  /** Reason codes across selected items — powers auto-suggested optional docs */
  reasonByItem: Record<string, DisputeReasonAssignment>;
  /** Sub-view to start on (driven by demo toolbar / initial action) */
  initialSubview: MailFlowSubview;
  /** Tells the parent which subview we're on so the toolbar stays in sync */
  onSubviewChange: (sv: MailFlowSubview) => void;
  /** User closed the wizard without finishing */
  onClose: () => void;
  /** User clicked Done; parent should write results to state machine */
  onComplete: (
    results: { agencyKey: string; response: LobMailResponse }[],
    method: MailingMethod,
  ) => void;
  /** User clicked "View in Tracking" — navigate to tracking view */
  onViewTracking: () => void;
}

export function MailFlowModal({
  disputeId: propDisputeId,
  letters,
  reasonByItem,
  initialSubview,
  onSubviewChange,
  onClose,
  onComplete,
  onViewTracking,
}: Props) {
  const { allAgencies } = useCreditAgenciesData();
  const { userData } = useAuth();
  const { data: feeSettings } = useFeeSettings();
  const [subview, setSubviewState] = useState<MailFlowSubview>(initialSubview);
  const [attached, setAttached] = useState<AttachDocumentsResult | null>(null);
  const [method, setMethod] = useState<MailingMethod>("certified");
  const [results, setResults] = useState<
    { agencyKey: string; agencyName: string; response: LobMailResponse }[]
  >([]);
  const queryClient = useQueryClient();

  // Keep the parent in sync when subview changes (so demo toolbar reflects)
  useEffect(() => {
    onSubviewChange(subview);
  }, [subview, onSubviewChange]);

  // Sync incoming initialSubview (demo toolbar can jump us directly to a step)
  useEffect(() => {
    setSubviewState(initialSubview);
  }, [initialSubview]);

  // Body lock when modal open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const isBulk = letters.length > 1;

  // ----- demo seed if no letters were passed (toolbar jumps) -----
  // Steps would be empty if the user jumps straight to "mailing-sent" without
  // running through earlier steps. Synthesize a minimal demo result so the
  // confirmation page still renders meaningfully.
  const demoResults = useMemo(() => {
    if (results.length > 0) return results;
    if (subview !== "mailing-sent") return [];
    // Deterministic, realistic-looking tracking numbers per bureau
    const demoTracking: Record<
      string,
      { tn: string; lob: string; from: string }
    > = {
      experian: {
        tn: "9407 1118 9956 0214 8347 12",
        lob: "ltr_8a1c4f9b22e7",
        from: "Phoenix, AZ",
      },
      equifax: {
        tn: "9407 1118 9956 0033 6128 47",
        lob: "ltr_3d92ab17f041",
        from: "Lincoln, NE",
      },
      transunion: {
        tn: "9407 1118 9956 0857 1429 03",
        lob: "ltr_5e7841cc92b8",
        from: "Stamford, CT",
      },
      lexisnexis: {
        tn: "9407 1118 9956 0492 7163 88",
        lob: "ltr_b2c19f4e8a73",
        from: "Alpharetta, GA",
      },
    };
    return letters.map((l) => {
      const seed = demoTracking[l.agencyKey] ?? {
        tn: "9407 1118 9956 0000 0000 00",
        lob: `ltr_demo${l.agencyKey.slice(0, 6)}`,
        from: "Phoenix, AZ",
      };
      return {
        agencyKey: l.agencyKey,
        agencyName: l.agencyName,
        response: {
          lobId: seed.lob,
          trackingNumber: seed.tn,
          expectedDelivery: new Date(
            Date.now() + 4 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          carrier: "usps" as const,
          mailedFrom: seed.from,
          pageCount: 5,
          totalPrice: 7.0,
          mailedAt: new Date().toISOString(),
        },
      };
    });
  }, [results, subview, letters]);

  // Attachments numbers — used for letter merging + step C receipt
  const attachmentCount = attached
    ? attached.requiredIds.length +
      attached.optionalIds.length +
      attached.libraryIds.length
    : // Demo default: assume 4 attachments if user jumped past Step A.
      4;

  const totalPages = letters.length * (1 + attachmentCount);

  // Recipient summary for the right rail
  const recipient = useMemo(() => {
    if (isBulk) {
      return {
        label: `All ${letters.length} agencies`,
        sub: `${letters
          .map((l) => l.agencyName)
          .slice(0, 3)
          .join(
            ", ",
          )}${letters.length > 3 ? `, +${letters.length - 3} more` : ""}`,
        addr: undefined as string | undefined,
      };
    }
    const letter = letters[0];
    const agency = letter
      ? allAgencies.find((a) => a.key === letter.agencyKey)
      : undefined;
    const addr = agency
      ? `${agency.address.line1}, ${agency.address.city} ${agency.address.state} ${agency.address.zip}`
      : undefined;
    return {
      label: letter?.agencyName || "—",
      sub: addr,
      addr,
    };
  }, [isBulk, letters, allAgencies]);

  const reasonCodes = useMemo(
    () =>
      Array.from(new Set(Object.values(reasonByItem).map((r) => r.reasonCode))),
    [reasonByItem],
  );

  // Demo seed for "attached" if user reaches Step B/C directly
  const ensureAttached = (): AttachDocumentsResult => {
    if (attached) return attached;
    const seed: AttachDocumentsResult = {
      requiredIds: [],
      optionalIds: [],
      libraryIds: [],
      redactionConfirmed: true,
    };
    setAttached(seed);
    return seed;
  };

  // ----- handlers -----
  const handleAttachContinue = (result: AttachDocumentsResult) => {
    setAttached(result);
    setSubviewState("mailing-options");
  };

  const handleConfirmMailing = async (chosenMethod: MailingMethod) => {
    setMethod(chosenMethod);
    const a = ensureAttached();
    const totalAttach =
      a.requiredIds.length + a.optionalIds.length + a.libraryIds.length;

    const disputeId =
      propDisputeId || `${userData?.id || "anon"}_${Date.now()}`;

    const mailingMethods = feeSettings
      ? getMailingMethods(feeSettings)
      : MAILING_METHODS;
    const price = mailingMethods[chosenMethod].price;
    const totalCost = price * letters.length;

    try {
      const spendFundsFn = httpsCallable(getFunctions(app), "spendFunds");
      await spendFundsFn({
        amount: totalCost,
        description: `Mailed ${letters.length} dispute letter(s) via ${mailingMethods[chosenMethod].label}`,
        metadata: {
          disputeId,
          letterCount: letters.length,
          mailingMethod: chosenMethod,
        },
      });
    } catch (error: any) {
      console.error("Wallet debit failed:", error);
      toast.error(
        error.message ||
          "Failed to deduct wallet funds. Please top up your wallet and try again.",
      );
      return; // Abort mailing since debit failed!
    }

    // Build LobMailRequests
    const requests: LobMailRequest[] = letters.map((letter) => {
      const agency = allAgencies.find((x) => x.key === letter.agencyKey);
      const anyUser = userData as any;
      const firstName = anyUser?.firstName || "Client";
      const lastName = anyUser?.lastName || "Name";
      return {
        disputeId,
        itemIds: Object.keys(reasonByItem),
        fromName: `${firstName} ${lastName}`,
        fromAddress: {
          line1: anyUser?.addressStreet || anyUser?.address1 || "Unknown",
          city: anyUser?.addressCity || anyUser?.city || "Unknown",
          state: anyUser?.addressState || anyUser?.state || "XX",
          zip: anyUser?.addressPostal || anyUser?.postalCode || "00000",
        },
        toName: letter.agencyName,
        toAddress: agency
          ? agency.address
          : { line1: "Unknown", city: "Unknown", state: "XX", zip: "00000" },
        letter,
        attachmentCount: totalAttach,
        attachmentDocIds: [...a.requiredIds, ...a.optionalIds, ...a.libraryIds],
        method: chosenMethod,
        idempotencyKey: `${letter.agencyKey}-${Date.now()}`,
      };
    });

    if (requests.length === 1) {
      const r = await mailLetterViaLob(requests[0]);
      setResults([
        {
          agencyKey: letters[0].agencyKey,
          agencyName: letters[0].agencyName,
          response: r,
        },
      ]);
      if (userData?.id) {
        await uploadDisputeLetter(userData.id, requests[0].letter, r.lobId);
      }
    } else {
      const map = await mailManyLettersViaLob(requests);
      setResults(
        letters.map((l) => ({
          agencyKey: l.agencyKey,
          agencyName: l.agencyName,
          response: map[l.agencyKey],
        })),
      );
      if (userData?.id) {
        for (const request of requests) {
          const result = map[request.letter.agencyKey];
          if (result) {
            await uploadDisputeLetter(
              userData.id,
              request.letter,
              result.lobId,
            );
          }
        }
      }
    }

    if (userData?.id) {
      queryClient.invalidateQueries({
        queryKey: [GET_USER_DOCUMENTS, userData.id],
      });
    }

    setSubviewState("mailing-sent");
  };

  const handleDone = () => {
    if (results.length > 0) {
      onComplete(
        results.map(({ agencyKey, response }) => ({ agencyKey, response })),
        method,
      );
    } else {
      onClose();
    }
  };

  // Keyboard close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && subview !== "mailing-sent") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [subview, onClose]);

  // ----- render -----
  return (
    <div className="fixed inset-0 z-[60] flex items-stretch justify-center animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full h-full bg-gray-50 overflow-y-auto custom-scrollbar animate-scale-in">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7l9 6 9-6M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l2-2h14l2 2"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-brand-600">
                  Mail Letter
                </div>
                <div className="text-sm font-bold text-gray-900">
                  {isBulk
                    ? `Mail All Letters (${letters.length})`
                    : "Mail Dispute Letter"}
                </div>
              </div>
            </div>

            {/* Step indicator */}
            <div className="hidden md:flex items-center gap-1 ml-4">
              <StepDot
                active={subview === "attaching-documents"}
                done={subview !== "attaching-documents"}
              >
                1
              </StepDot>
              <StepDash />
              <StepDot
                active={subview === "mailing-options"}
                done={subview === "mailing-sent"}
              >
                2
              </StepDot>
              <StepDash />
              <StepDot active={subview === "mailing-sent"} done={false}>
                3
              </StepDot>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Close mailing flow"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-16">
          {subview === "attaching-documents" && (
            <AttachDocumentsStep
              recipientLabel={recipient.label}
              recipientSubLabel={recipient.sub}
              letterCount={letters.length}
              reasonCodes={reasonCodes}
              initial={attached || undefined}
              onBack={onClose}
              onContinue={handleAttachContinue}
            />
          )}

          {subview === "mailing-options" && (
            <MailingOptionsStep
              recipientLabel={recipient.label}
              recipientAddress={recipient.addr}
              letterCount={letters.length}
              totalPages={totalPages}
              initialMethod={method}
              onBack={() => setSubviewState("attaching-documents")}
              onConfirm={handleConfirmMailing}
            />
          )}

          {subview === "mailing-sent" && (
            <MailingSentStep
              results={results.length > 0 ? results : demoResults}
              method={method}
              onDone={handleDone}
              onViewTracking={() => {
                if (results.length > 0) {
                  onComplete(
                    results.map(({ agencyKey, response }) => ({
                      agencyKey,
                      response,
                    })),
                    method,
                  );
                }
                onViewTracking();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StepDot({
  active,
  done,
  children,
}: {
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : done
            ? "bg-emerald-500 text-white"
            : "bg-gray-100 text-gray-500"
      }`}
    >
      {done ? "✓" : children}
    </div>
  );
}

function StepDash() {
  return <div className="w-6 h-px bg-gray-200" />;
}
