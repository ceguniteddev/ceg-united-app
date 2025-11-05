import {
  useAnalysisMutation,
  useAnalysisQuery,
  useRefreshAnalysisData,
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
import { useRefreshCRSData } from "@/hooks/crs";
import { toast } from "sonner";
import IconMenu from "../icon-menu";
import { Loader2Icon, RefreshCcw, XIcon } from "lucide-react";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

type Props = {
  referenceNumber: string;
};
type Item = { id: string; analysis?: string };

const AnalysisView = ({ referenceNumber }: Props) => {
  const { analysisData = [], isLoading } = useAnalysisQuery(referenceNumber);
  const { updateAnalysis } = useAnalysisMutation();

  if (isLoading) return <Spinner displayText="Loading analysis..." />;

  if (!analysisData || analysisData?.length === 0)
    return <div className="p-4">No analysis found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-row justify-end">
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

const RefreshAnalysisData = ({
  referenceNumber,
}: {
  referenceNumber: string;
}) => {
  const [refreshConfirmationOpen, setRefreshConfirmationOpen] =
    React.useState(false);
  const { isUpdating, refreshAnalysisData } = useRefreshAnalysisData();

  const handleRefreshCRSData = useCallback(async () => {
    try {
      await refreshAnalysisData({ referenceNumber });
      setRefreshConfirmationOpen(false);
    } catch (error) {
      console.error("Error refreshing CRS data:", error);
      toast.error("Failed to refresh CRS data. Please try again.");
    }
  }, [refreshAnalysisData, referenceNumber]);

  return (
    <>
      <Button
        variant={"ghost"}
        className="cursor-pointer bg-blue-200 hover:bg-blue-300"
        onClick={() => setRefreshConfirmationOpen(true)}
      >
        <IconMenu
          icon={<RefreshCcw className="h-4 w-4" />}
          text="Refresh CRS Data"
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation</AlertDialogTitle>
              <AlertDialogDescription>
                {`Please confirm that you want to refresh the fund application analysis data. 
                This action will delete the mapped bank products and analysis. This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                className="cursor-pointer"
                disabled={isUpdating}
              >
                <IconMenu text="Cancel" icon={<XIcon className="h-4 w-4" />} />
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 cursor-pointer"
                onClick={async (e) => {
                  e.preventDefault();
                  await handleRefreshCRSData();
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
  }, 600);

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
