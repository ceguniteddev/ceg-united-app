import {
  useAnalysisMutation,
  useAnalysisQuery,
  useEmailClientAnalysisData,
  useRefreshAnalysisData,
  useSaveToDocuments,
} from "@/hooks/admin/funding-application/analysis";
// import dynamic from "next/dynamic";
import React, { useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import Spinner from "../Spinner";
import { Button } from "../ui/button";
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
import { toast } from "sonner";
import IconMenu from "../icon-menu";
import {
  DollarSign,
  FileDown,
  HandshakeIcon,
  Loader2Icon,
  Mail,
  RefreshCcw,
  ShoppingCart,
  XIcon,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import { WhopCheckoutEmbed } from "@whop/checkout/react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { PaymentPlan } from "@/schema/payments";

import {
  PaymentOptionCard,
  WhopCheckoutButtonBase,
} from "@/components/funding/PaymentOptionCard";
import { PRICING_PLANS } from "@/constant/payment";

// const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

type Props = {
  referenceNumber: string;
};
type Item = { id: string; analysis?: string };

const AnalysisView = ({ referenceNumber }: Props) => {
  const { analysisData = [], isLoading } = useAnalysisQuery(referenceNumber);
  const { updateAnalysis } = useAnalysisMutation();
  const { isAdmin, role } = useAuth();

  if (isLoading) return <Spinner displayText="Loading analysis..." />;

  if (!analysisData || analysisData?.length === 0) {
    return (
      <div className="flex flex-col sm:flex-row justify-between gap-3 p-4">
        <div className="text-sm sm:text-base">No analysis found.</div>
        <RefreshAnalysisData referenceNumber={referenceNumber} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col items-start gap-3 border-b pb-4 mb-4 sm:flex-row sm:justify-between">
        {isAdmin && (
          <>
            <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
              <SendClientAnalysisData referenceNumber={referenceNumber} />
              <SaveToDocumentsButton referenceNumber={referenceNumber} />
            </div>
            <div className="flex flex-col gap-2 sm:w-auto sm:flex-row">
              <RefreshAnalysisData referenceNumber={referenceNumber} />
            </div>
          </>
        )}
        {role === "Client" && (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {/* <SaveToDocumentsButton referenceNumber={referenceNumber} /> */}
            <PricingDetailsButton referenceNumber={referenceNumber} />
          </div>
        )}
      </div>
      <Card className="w-full border-none shadow-none sm:border-solid sm:border sm:shadow-sm bg-transparent sm:bg-card">
        <CardContent className="p-0 sm:p-6 space-y-4 sm:space-y-8">
          {(analysisData as Item[])?.map((item) => (
            <div className="w-full overflow-hidden" key={item.id}>
              <AnalysisDetailsView
                updateAnalysis={({ referenceNumber, id, analysis }) =>
                  updateAnalysis({ referenceNumber, id, analysis })
                }
                referenceNumber={referenceNumber}
                id={item.id}
                analysis={item.analysis ?? ""}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

const SendClientAnalysisData = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const [refreshConfirmationOpen, setRefreshConfirmationOpen] =
    React.useState(false);
  const { emailClientAnalysisData, isSending } = useEmailClientAnalysisData();

  const handleRefreshAnalysisData = useCallback(async () => {
    try {
      await emailClientAnalysisData({ referenceNumber });
      setRefreshConfirmationOpen(false);
    } catch (error) {
      console.error("Error refreshing Analysis data:", error);
      toast.error("Failed to refresh Analysis data. Please try again.");
    }
  }, [emailClientAnalysisData, referenceNumber]);

  return (
    <>
      <Button
        variant={"ghost"}
        className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white w-full sm:w-auto h-10 sm:h-9"
        onClick={() => setRefreshConfirmationOpen(true)}
      >
        <IconMenu
          icon={<Mail className="h-4 w-4" />}
          text="Email Client Analysis Data"
        />
      </Button>

      {refreshConfirmationOpen && (
        <AlertDialog
          open={refreshConfirmationOpen}
          onOpenChange={(open) => {
            if (!isSending) setRefreshConfirmationOpen(open);
          }}
        >
          <AlertDialogTrigger asChild></AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {`Are you sure you want to send the analysis data to the client?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                className="cursor-pointer w-full sm:w-auto"
                disabled={isSending}
              >
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer w-full sm:w-auto"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleRefreshAnalysisData();
                }}
                disabled={isSending}
              >
                {isSending ? (
                  <IconMenu
                    text="Sending..."
                    icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu text="Send" icon={<Mail className="h-4 w-4" />} />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

const SaveToDocumentsButton = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  const { saveToDocuments, isSaving } = useSaveToDocuments();

  const handleSaveToDocuments = useCallback(async () => {
    try {
      await saveToDocuments({ referenceNumber });
      setConfirmationOpen(false);
    } catch (error) {
      console.error("Error saving analysis to documents:", error);
      toast.error("Failed to save analysis to documents. Please try again.");
    }
  }, [saveToDocuments, referenceNumber]);

  return (
    <>
      <Button
        variant={"ghost"}
        className="cursor-pointer bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto h-10 sm:h-9"
        onClick={() => setConfirmationOpen(true)}
      >
        <IconMenu
          icon={<FileDown className="h-4 w-4" />}
          text="Save to My Documents"
        />
      </Button>

      {confirmationOpen && (
        <AlertDialog
          open={confirmationOpen}
          onOpenChange={(open) => {
            if (!isSaving) setConfirmationOpen(open);
          }}
        >
          <AlertDialogTrigger asChild></AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Save to My Documents
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {`This will convert the funding analysis to a PDF and save it to the client's My Documents section. Do you want to continue?`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                className="cursor-pointer w-full sm:w-auto"
                disabled={isSaving}
              >
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-green-600 hover:bg-green-700 cursor-pointer w-full sm:w-auto"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleSaveToDocuments();
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <IconMenu
                    text="Saving..."
                    icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu
                    text="Save"
                    icon={<FileDown className="h-4 w-4" />}
                  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

const RefreshAnalysisData = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const [refreshConfirmationOpen, setRefreshConfirmationOpen] =
    React.useState(false);
  const { isUpdating, refreshAnalysisData } = useRefreshAnalysisData();

  const handleRefreshAnalysisData = useCallback(async () => {
    try {
      await refreshAnalysisData({ referenceNumber });
      setRefreshConfirmationOpen(false);
    } catch (error) {
      console.error("Error refreshing Analysis data:", error);
      toast.error("Failed to refresh Analysis data. Please try again.");
    }
  }, [refreshAnalysisData, referenceNumber]);

  return (
    <>
      <Button
        variant={"ghost"}
        className="cursor-pointer bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto h-10 sm:h-9"
        onClick={() => setRefreshConfirmationOpen(true)}
      >
        <IconMenu
          icon={<RefreshCcw className="h-4 w-4" />}
          text="Refresh Analysis Data"
        />
      </Button>

      {refreshConfirmationOpen && (
        <AlertDialog
          open={refreshConfirmationOpen}
          onOpenChange={(open) => {
            if (!isUpdating) setRefreshConfirmationOpen(open);
          }}
        >
          <AlertDialogTrigger asChild></AlertDialogTrigger>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Confirmation
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                {`Please confirm that you want to refresh the fund application analysis data. 
                This action will delete the mapped bank products and analysis. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                className="cursor-pointer w-full sm:w-auto"
                disabled={isUpdating}
              >
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer w-full sm:w-auto"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleRefreshAnalysisData();
                }}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <IconMenu
                    text="Refreshing..."
                    icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
                  />
                ) : (
                  <IconMenu
                    text="Refresh"
                    icon={<RefreshCcw className="h-4 w-4" />}
                  />
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

const PricingDetailsButton = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button
        size={"lg"}
        className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full sm:w-auto h-10 sm:h-9 shadow-lg shadow-blue-500/50 animate-pulse hover:animate-none hover:scale-105 transition-all duration-300 font-bold border-0"
        onClick={() => setIsOpen(true)}
      >
        <IconMenu
          icon={<HandshakeIcon className="h-5 w-5" />}
          text="Join Now"
        />
      </Button>

      <ResponsiveDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Payment Options"
        description="Choose your preferred payment method"
        className="max-w-[90vw] sm:max-w-5xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 p-4">
          {PRICING_PLANS.map((option, idx) => (
            <PaymentOptionCard key={idx} option={option}>
              <WhopCheckoutButton
                paymentKey={option.whopKey}
                buttonName="Pay in Full"
                className={`w-full text-white h-auto py-2.5 sm:py-3 ${
                  option.recommended
                    ? "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
                    : "bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 dark:text-gray-900"
                }`}
              />
              {option.hasDenefits &&
                (option.denefitsWhopKey ? (
                  <WhopCheckoutButton
                    paymentKey={option.denefitsWhopKey}
                    buttonName={option.denefitsText}
                    subText={option.denefitsNote}
                    className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 h-auto py-2 sm:py-2.5 bg-transparent mt-2"
                  />
                ) : (
                  <a
                    href={
                      (option.whopKey.includes("Audit")
                        ? process.env.NEXT_PUBLIC_DENEFITS_AUDIT_URL
                        : option.whopKey.includes("Intelligence")
                          ? process.env.NEXT_PUBLIC_DENEFITS_INTELLIGENCE_URL
                          : option.whopKey.includes("Accelerator")
                            ? process.env.NEXT_PUBLIC_DENEFITS_ACCELERATOR_URL
                            : process.env.NEXT_PUBLIC_DENEFITS_URL) || "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full mt-2"
                  >
                    <Button
                      variant="outline"
                      className="w-full text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 h-auto py-2 flex flex-col justify-center items-center"
                    >
                      <span className="flex items-center justify-center gap-2">
                        {option.denefitsText}{" "}
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                      {option.denefitsNote && (
                        <span className="text-[10px] sm:text-[11px] opacity-70 font-normal mt-0.5 tracking-tight">
                          {option.denefitsNote}
                        </span>
                      )}
                    </Button>
                  </a>
                ))}
            </PaymentOptionCard>
          ))}
        </div>
        <div className="flex justify-center p-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            <IconMenu icon={<XIcon className="h-4 w-4" />} text="Close" />
          </Button>
        </div>
      </ResponsiveDialog>
    </>
  );
};

const WhopCheckoutButton = ({
  buttonName,
  subText,
  className,
  paymentKey,
  // returnURL,
}: {
  buttonName: string;
  subText?: string;
  className: string;
  paymentKey: PaymentPlan;
  // returnURL: string;
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleCheckout = async () => {
    if (!user?.uid) {
      toast.error("You must be logged in to proceed.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/user/${user.uid}/whop`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create checkout session.",
        );
      }

      const { checkoutId } = await response.json();
      if (checkoutId) {
        let url = `/client/payments/whop/${checkoutId}`;
        // if (returnURL) {
        //   url += `?returnUrl=${encodeURIComponent(returnURL)}`;
        // }
        window.open(url, "_blank");
      } else {
        toast.error("Could not retrieve the checkout session.");
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const [showConfirm, setShowConfirm] = React.useState(false);
  const isDownPayment = String(paymentKey).includes("DownPayment");

  const handleCheckoutClick = () => {
    if (isDownPayment) {
      setShowConfirm(true);
    } else {
      handleCheckout();
    }
  };

  const getPlanDetails = () => {
    switch (paymentKey) {
      case "AuditDownPayment":
        return { downpayment: "$750", fee: "$500", total: "$2,500" };
      case "IntelligenceDownPayment":
        return { downpayment: "$1,000", fee: "$1,000", total: "$6,000" };
      case "AcceleratorDownPayment":
        return { downpayment: "$5,000", fee: "$2,000", total: "$17,000" };
      default:
        return { downpayment: "", fee: "", total: "" };
    }
  };

  const planDetails = getPlanDetails();

  return (
    <>
      <WhopCheckoutButtonBase
        buttonName={buttonName}
        subText={subText}
        className={className}
        isLoading={isLoading}
        onClick={handleCheckoutClick}
      />

      {showConfirm && (
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Installment Plan Setup</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                You are about to start a 2-step setup process for the
                installment plan:
                <ul className="list-decimal pl-5 my-4 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>Initial Downpayment:</strong> Securely pay your
                    downpayment of {planDetails.downpayment} today via Whop.
                  </li>
                  <li>
                    <strong>Finalize Installments:</strong> After the
                    downpayment, you will be automatically redirected to
                    Denefits to pay a $39 enrollment fee and set up the
                    remaining installments.
                  </li>
                </ul>
                <em className="block mb-4 text-xs text-muted-foreground">
                  (Note: Financing includes a {planDetails.fee} convenience fee
                  for a total of {planDetails.total})
                </em>
                <span className="font-medium text-foreground">
                  Do you want to proceed?
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  setShowConfirm(false);
                  handleCheckout();
                }}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Proceed to Payment
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
};

export function extractHtmlFromFence(input: string): string {
  if (!input) return "";

  // Prefer an explicit ```html fence anywhere in the string
  const htmlFence = /```(?:\s*html)?\s*[\r\n]+([\s\S]*?)\s*```/i;
  const m1 = input.match(htmlFence);
  if (m1) {
    return m1[1].trim();
  }

  // If the entire string is *just* one fenced block (any language), unwrap it
  const wholeFence = /^\s*```[^\n]*\n([\s\S]*?)\n?```\s*$/;
  const m2 = input.match(wholeFence);
  if (m2) {
    return m2[1].trim();
  }

  // Otherwise, return as-is
  return input.trim();
}

type PropsView = {
  id: string;
  analysis: string;
  referenceNumber: string;
  updateAnalysis: ({
    referenceNumber,
    id,
    analysis,
  }: {
    analysis: string;
    id: string;
    referenceNumber: string;
  }) => Promise<unknown> | void;
};

const AnalysisDetailsView = ({
  referenceNumber,
  analysis,
  id,
  updateAnalysis,
}: PropsView) => {
  // const { role } = useAuth();
  const initial = React.useMemo(
    () => extractHtmlFromFence(analysis),
    [analysis],
  );
  // const [content, setContent] = React.useState(initial);

  // React.useEffect(() => {
  //   setContent((prev) => (prev === initial ? prev : initial));
  // }, [initial]);

  // const saveToDb = React.useCallback(
  //   async (html: string) => {
  //     try {
  //       await updateAnalysis({
  //         referenceNumber,
  //         id,
  //         analysis: extractHtmlFromFence(html),
  //       });
  //     } catch (e) {
  //       console.error("Failed to save analysis", e);
  //     }
  //   },
  //   [id, updateAnalysis, referenceNumber],
  // );

  // const debouncedSave = useDebouncedCallback((next: string) => {
  //   saveToDb(next);
  // }, 200);

  // const handleSetContent = React.useCallback(
  //   (next: string) => {
  //     setContent(next);
  //     debouncedSave(next);
  //   },
  //   [debouncedSave],
  // );

  // React.useEffect(() => () => debouncedSave.flush(), [debouncedSave]);

  // If user is a Client, display read-only HTML content
  // if (role === "Client") {
  return (
    <div className="w-full">
      <iframe
        srcDoc={initial}
        className="h-screen w-full border-0"
        title="Analysis Details"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
  // }

  // For Admin/Broker, show editable Editor
  // return <Editor content={content} onContentChange={handleSetContent} />;
};

export default AnalysisView;
