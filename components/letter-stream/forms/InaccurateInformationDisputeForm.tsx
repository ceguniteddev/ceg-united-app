"use client";

import { useFormContext } from "react-hook-form";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useGenerateDisputeLetter } from "@/hooks/dispute-letter-generate";
import dynamic from "next/dynamic";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Loader, Mailbox } from "lucide-react";

const EditorQuill = dynamic(() => import("@/components/editor/EditorQuill"), {
  ssr: false,
});

interface InaccurateInformationDisputeFormProps {
  availableDisputeTypes?: string[];
}

export default function InaccurateInformationDisputeForm({
  availableDisputeTypes = [],
}: InaccurateInformationDisputeFormProps) {
  const form = useFormContext();
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const { mutate: generateLetter, isPending: isGenerating } =
    useGenerateDisputeLetter();

  const handleGenerateDisputeInaccurate = () => {
    generateLetter(
      {
        disputeType: "inaccurate-information",
      },
      {
        onSuccess: (content) => {
          setGeneratedContent(content);
          form.setValue("disputeMessage", content);
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="rounded-md mb-4 p-4 flex flex-row justify-between bg-blue-50 items-center">
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">
              Inaccurate Information Dispute
            </h4>
            <p className="text-sm text-blue-800">
              This letter disputes accounts containing factual errors (e.g.,
              wrong balance, incorrect dates, wrong status) under FCRA Section
              611.
            </p>
          </div>

          <Button
            className="bg-green-200 hover-green-300"
            type="button"
            variant={"outline"}
            onClick={handleGenerateDisputeInaccurate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Mailbox className="h-4 w-4" />
                Generate Dispute
              </>
            )}
          </Button>
        </div>
        <FormField
          control={form.control}
          name="disputeMessage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <EditorQuill
                  {...field}
                  value={field.value || ""}
                  placeholder=""
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
