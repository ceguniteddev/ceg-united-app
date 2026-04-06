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
} from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Card, CardContent } from "@/components/ui/card";
import PricingPlansGrid from "@/components/funding/PricingPlansGrid";

// const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

type Props = {
  referenceNumber: string;
};
type Item = { id: string; analysis?: string };

const AnalysisView = ({ referenceNumber }: Props) => {
  const { analysisData = [], isLoading } = useAnalysisQuery(referenceNumber);
  const { updateAnalysis } = useAnalysisMutation();
  const { isAdmin, role, userData } = useAuth();

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
        {role === "Client" && !userData?.isPremiumClient && (
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {/* <SaveToDocumentsButton referenceNumber={referenceNumber} /> */}
            <PricingDetailsButton referenceNumber={referenceNumber} />
          </div>
        )}
      </div>
      <Card className="w-full border-none shadow-none sm:border-solid sm:border sm:shadow-sm bg-transparent sm:bg-card">
        <CardContent className="p-0 sm:p-6 space-y-4 sm:space-y-8">
          {(analysisData as Item[])?.map((item) => (
            <AnalysisDetailsView
              key={item.id}
              updateAnalysis={({ referenceNumber, id, analysis }) =>
                updateAnalysis({ referenceNumber, id, analysis })
              }
              referenceNumber={referenceNumber}
              id={item.id}
              analysis={item.analysis ?? ""}
            />
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
        className="max-w-[90vw] sm:max-w-3xl"
      >
        <PricingPlansGrid />
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

  const wrappedHtml = React.useMemo(() => {
    // Inject a script that reports document height to the parent via postMessage
    const heightReporter = `<script>
      function reportHeight() {
        var h = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.parent.postMessage({ type: 'iframe-height', height: h }, '*');
      }
      window.addEventListener('load', function() { setTimeout(reportHeight, 100); });
      window.addEventListener('resize', reportHeight);
      new MutationObserver(reportHeight).observe(document.body, { childList: true, subtree: true, attributes: true });
    </script>`;
    return initial + heightReporter;
  }, [initial]);

  const [iframeHeight, setIframeHeight] = React.useState(600);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  React.useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data?.type === "iframe-height" &&
        typeof e.data.height === "number"
      ) {
        setIframeHeight(e.data.height);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // If user is a Client, display read-only HTML content
  // if (role === "Client") {
  return (
    <div className="w-full">
      <iframe
        ref={iframeRef}
        srcDoc={wrappedHtml}
        className="w-full border-0"
        style={{ height: iframeHeight }}
        title="Analysis Details"
        sandbox="allow-scripts"
        scrolling="no"
      />
    </div>
  );
  // }

  // For Admin/Broker, show editable Editor
  // return <Editor content={content} onContentChange={handleSetContent} />;
};

export default AnalysisView;
