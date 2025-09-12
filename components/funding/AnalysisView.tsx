import { useAnalysisMutation, useAnalysisQuery } from "@/hooks/admin/funding-application/analysis";
import dynamic from "next/dynamic";
import React from "react";
import { useDebouncedCallback } from "use-debounce";
// import { CheckIcon, XIcon } from "lucide-react";
import Spinner from "../Spinner";
// import { ConfirmButton } from "../Confirmation";
// import { Button } from "../ui/button";
// import { useQueryClient } from "@tanstack/react-query";
// import { fa } from "zod/v4/locales";
// import { updateApplicationStatus } from "@/service/apply-funding";

const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

type Props = { referenceNumber: string; setOpen: React.Dispatch<React.SetStateAction<boolean>> };
type Item = { id: string; analysis?: string };

const AnalysisView = ({ referenceNumber, setOpen }: Props) => {
  const { analysisData = [], isLoading } = useAnalysisQuery(referenceNumber);
  const { updateAnalysis } = useAnalysisMutation();
  // const queryClient = useQueryClient();

  // const handleStatusChange = React.useCallback(
  //   async (status: "Approved" | "Declined") => {
  //     await updateApplicationStatus(referenceNumber, status);

  //     queryClient.invalidateQueries({
  //       queryKey: ["GET_FUNDING_APPLICATIONS"],
  //     });

  //     setOpen(false);
  //   },
  //   [referenceNumber, queryClient, setOpen]
  // );

  if (isLoading) return <Spinner displayText="Loading analysis..." />;

  return (
    <div className="space-y-6">
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
      {/* <div className="flex justify-between pr-4 pl-4">
        <div>
          <Button type="button" variant={"outline"} onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
        <div className="flex space-x-4">
          <ConfirmButton
            label="Decline"
            confirmLabel="Decline"
            description="Do you really want to decline this request?"
            variant="destructive"
            size="sm"
            icon={<XIcon className="h-4 w-4" />}
            onConfirm={() => handleStatusChange("Declined")}
            className="bg-red-600 hover:bg-red-700"
            classNameAction="bg-red-600 hover:bg-red-700"
          />

          <ConfirmButton
            label="Approve"
            confirmLabel="Approve"
            description="Do you really want to approve this request?"
            variant="default"
            size="sm"
            icon={<CheckIcon className="h-4 w-4" />}
            onConfirm={() => handleStatusChange("Approved")}
            className="bg-green-600 hover:bg-green-700"
            classNameAction="bg-green-600 hover:bg-green-700"
          />
        </div>
      </div> */}
    </div>
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

const AnalysisDetailsView = ({ referenceNumber, analysis, id, updateAnalysis }: PropsView) => {
  const initial = React.useMemo(() => extractHtmlFromFence(analysis), [analysis]);
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
