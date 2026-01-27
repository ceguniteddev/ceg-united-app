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
  FileDown,
  Loader2Icon,
  Mail,
  RefreshCcw,
  ShoppingCart,
  XIcon,
} from "lucide-react";
import { useAuth } from "@/provider/AuthContext";
import DOMPurify from "isomorphic-dompurify";

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
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 border-b pb-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isAdmin && (
            <>
              <SendClientAnalysisData referenceNumber={referenceNumber} />
              <SaveToDocumentsButton referenceNumber={referenceNumber} />
            </>
          )}
          {role === "Client" && (
            <SaveToDocumentsButton referenceNumber={referenceNumber} />
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
          <WhopCheckoutButton referenceNumber={referenceNumber} />
          {isAdmin && <RefreshAnalysisData referenceNumber={referenceNumber} />}
        </div>
      </div>
      {(analysisData as Item[])?.map((item) => (
        <AnalysisDetailsView
          updateAnalysis={({ referenceNumber, id, analysis }) =>
            updateAnalysis({ referenceNumber, id, analysis })
          }
          referenceNumber={referenceNumber}
          key={item.id}
          id={item.id}
          analysis={item.analysis ?? ""}
        />
      ))}
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

const WhopCheckoutButton = ({
  referenceNumber,
}: {
  referenceNumber: string;
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
        body: JSON.stringify({ referenceNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create checkout session.",
        );
      }

      const { url } = await response.json();
      if (url) {
        window.open(url, "_blank");
      } else {
        toast.error("Could not retrieve the checkout link.");
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

  return (
    <Button
      variant={"ghost"}
      className="cursor-pointer bg-purple-500 hover:bg-purple-600 text-white w-full sm:w-auto h-10 sm:h-9"
      onClick={handleCheckout}
      disabled={isLoading}
    >
      {isLoading ? (
        <IconMenu
          text="Processing..."
          icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
        />
      ) : (
        <IconMenu icon={<ShoppingCart className="h-4 w-4" />} text="Join Now" />
      )}
    </Button>
  );
};

export function extractHtmlFromFence(input: string): string {
  return DOMPurify.sanitize(input);
  // if (!input) return "";

  // // Prefer an explicit ```html fence anywhere in the string
  // const htmlFence = /```(?:\s*html)?\s*[\r\n]+([\s\S]*?)\s*```/i;
  // const m1 = input.match(htmlFence);
  // if (m1) return m1[1].trim();

  // // If the entire string is *just* one fenced block (any language), unwrap it
  // const wholeFence = /^\s*```[^\n]*\n([\s\S]*?)\n?```\s*$/;
  // const m2 = input.match(wholeFence);
  // if (m2) return m2[1].trim();

  // // Otherwise, return as-is
  // return input.trim();
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
  const { role } = useAuth();
  const initial = React.useMemo(
    () => extractHtmlFromFence(analysis),
    [analysis],
  );
  const [content, setContent] = React.useState(initial);

  React.useEffect(() => {
    setContent((prev) => (prev === initial ? prev : initial));
  }, [initial]);

  const saveToDb = React.useCallback(
    async (html: string) => {
      try {
        await updateAnalysis({
          referenceNumber,
          id,
          analysis: extractHtmlFromFence(html),
        });
      } catch (e) {
        console.error("Failed to save analysis", e);
      }
    },
    [id, updateAnalysis, referenceNumber],
  );

  const debouncedSave = useDebouncedCallback((next: string) => {
    saveToDb(next);
  }, 200);

  const handleSetContent = React.useCallback(
    (next: string) => {
      setContent(next);
      debouncedSave(next);
    },
    [debouncedSave],
  );

  React.useEffect(() => () => debouncedSave.flush(), [debouncedSave]);

  // If user is a Client, display read-only HTML content
  // if (role === "Client") {
  return (
    <div
      className="prose prose-sm sm:prose lg:prose-lg max-w-none dark:prose-invert bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 sm:p-6
        [&_h1]:text-2xl [&_h1]:sm:text-3xl [&_h1]:font-bold [&_h1]:mb-4
        [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-semibold [&_h2]:mb-3
        [&_h3]:text-lg [&_h3]:sm:text-xl [&_h3]:font-semibold [&_h3]:mb-2
        [&_h4]:text-base [&_h4]:sm:text-lg [&_h4]:font-medium [&_h4]:mb-2
        [&_p]:mb-2 [&_p]:text-sm [&_p]:sm:text-base
        [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3
        [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3
        [&_li]:mb-1
        [&_table]:w-full [&_table]:border-collapse [&_table]:mb-4
        [&_th]:border [&_th]:border-gray-300 [&_th]:p-2 [&_th]:bg-gray-100 [&_th]:font-semibold [&_th]:text-left
        [&_td]:border [&_td]:border-gray-300 [&_td]:p-2
        [&_.container]:w-full
        [&_.section-box]:border [&_.section-box]:border-gray-300 [&_.section-box]:rounded [&_.section-box]:p-4 [&_.section-box]:mb-4 [&_.section-box]:bg-gray-50 dark:[&_.section-box]:bg-gray-800
        [&_.bureau-box]:border [&_.bureau-box]:border-blue-300 [&_.bureau-box]:rounded [&_.bureau-box]:p-4 [&_.bureau-box]:mb-4 [&_.bureau-box]:bg-blue-50 dark:[&_.bureau-box]:bg-blue-900/20
        [&_.summary-box]:border [&_.summary-box]:border-purple-300 [&_.summary-box]:rounded [&_.summary-box]:p-4 [&_.summary-box]:mb-4 [&_.summary-box]:bg-purple-50 dark:[&_.summary-box]:bg-purple-900/20
        [&_.final-summary]:border [&_.final-summary]:border-green-300 [&_.final-summary]:rounded [&_.final-summary]:p-4 [&_.final-summary]:mb-4 [&_.final-summary]:bg-green-50 dark:[&_.final-summary]:bg-green-900/20
        [&_.grid]:grid [&_.grid]:grid-cols-1 [&_.grid]:sm:grid-cols-2 [&_.grid]:md:grid-cols-3 [&_.grid]:gap-3 [&_.grid]:mb-3
        [&_.grid-item]:text-sm
        [&_.label]:font-semibold
        [&_.value]:text-gray-700 dark:[&_.value]:text-gray-300
        [&_.negative]:text-red-600 dark:[&_.negative]:text-red-400 [&_.negative]:font-semibold
        [&_.positive]:text-green-600 dark:[&_.positive]:text-green-400 [&_.positive]:font-semibold"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
  // }

  // For Admin/Broker, show editable Editor
  // return <Editor content={content} onContentChange={handleSetContent} />;
};

export default AnalysisView;
