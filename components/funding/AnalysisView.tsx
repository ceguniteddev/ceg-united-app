import {
  useAnalysisMutation,
  useAnalysisQuery,
  useEmailClientAnalysisData,
  useRefreshAnalysisData,
  useSaveToDocuments,
} from "@/hooks/admin/funding-application/analysis";
import dynamic from "next/dynamic";
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
import { FileDown, Loader2Icon, Mail, RefreshCcw, XIcon } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

type Props = {
  referenceNumber: string;
};
type Item = { id: string; analysis?: string };

const AnalysisView = ({ referenceNumber }: Props) => {
  const { analysisData = [], isLoading } = useAnalysisQuery(referenceNumber);
  const { updateAnalysis } = useAnalysisMutation();

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
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <SendClientAnalysisData referenceNumber={referenceNumber} />
          <SaveToDocumentsButton referenceNumber={referenceNumber} />
        </div>
        <RefreshAnalysisData referenceNumber={referenceNumber} />
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

export function extractHtmlFromFence(input: string): string {
  if (!input) return "";

  // Prefer an explicit ```html fence anywhere in the string
  const htmlFence = /```(?:\s*html)?\s*[\r\n]+([\s\S]*?)\s*```/i;
  const m1 = input.match(htmlFence);
  if (m1) return m1[1].trim();

  // If the entire string is *just* one fenced block (any language), unwrap it
  const wholeFence = /^\s*```[^\n]*\n([\s\S]*?)\n?```\s*$/;
  const m2 = input.match(wholeFence);
  if (m2) return m2[1].trim();

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
  const initial = React.useMemo(
    () => extractHtmlFromFence(analysis),
    [analysis]
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
    [id, updateAnalysis, referenceNumber]
  );

  const debouncedSave = useDebouncedCallback((next: string) => {
    saveToDb(next);
  }, 200);

  const handleSetContent = React.useCallback(
    (next: string) => {
      setContent(next);
      debouncedSave(next);
    },
    [debouncedSave]
  );

  React.useEffect(() => () => debouncedSave.flush(), [debouncedSave]);

  return <Editor content={content} onContentChange={handleSetContent} />;
};

export default AnalysisView;
