"use client";

import { useFormContext } from "react-hook-form";
import { CustomFormField } from "@/components/CustomFormField";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useGenerateInaccurateDisputeLetter } from "@/hooks/generate-inaccurate-dispute";
import {
  useIdentifyFactualErrors,
  IdentifyFactualErrorsResponse,
  FactualError,
} from "@/hooks/identify-factual-errors";

import { Loader, Mailbox, Search } from "lucide-react";
import { UserWithId } from "@/schema/registration";

interface InaccurateInformationDisputeFormProps {
  availableDisputeTypes?: string[];
  userId?: string;
  userData?: UserWithId | null;
}

export default function InaccurateInformationDisputeForm({
  availableDisputeTypes = [],
  userId,
  userData,
}: InaccurateInformationDisputeFormProps) {
  const form = useFormContext();
  const [generatedContent, setGeneratedContent] = useState<{
    experian?: string | null;
    transunion?: string | null;
    equifax?: string | null;
  } | null>(null);
  const [factualErrors, setFactualErrors] =
    useState<IdentifyFactualErrorsResponse | null>(null);
  const [selectedErrors, setSelectedErrors] = useState<{
    experian: FactualError[];
    transunion: FactualError[];
    equifax: FactualError[];
  }>({ experian: [], transunion: [], equifax: [] });

  const { mutate: generateLetter, isPending: isGenerating } =
    useGenerateInaccurateDisputeLetter(userId);

  const { mutate: identifyErrors, isPending: isIdentifying } =
    useIdentifyFactualErrors(userId);

  const handleGenerateDisputeInaccurate = () => {
    generateLetter(
      {
        selectedErrors,
      },
      {
        onSuccess: (data) => {
          // If data is a string, wrap it in the expected structure
          const content =
            typeof data === "string"
              ? { experian: data, transunion: data, equifax: data }
              : data;
          setGeneratedContent(content);
          if (content.experian)
            form.setValue("disputeMessageExperian", content.experian);
          if (content.transunion)
            form.setValue("disputeMessageTransunion", content.transunion);
          if (content.equifax)
            form.setValue("disputeMessageEquifax", content.equifax);
        },
      }
    );
  };

  const toggleError = (
    bureau: "experian" | "transunion" | "equifax",
    error: FactualError
  ) => {
    setSelectedErrors((prev) => {
      const currentList = prev[bureau] || [];
      const exists = currentList.some(
        (e) =>
          e.accountNumber === error.accountNumber && e.error === error.error
      );

      let newList;
      if (exists) {
        newList = currentList.filter(
          (e) =>
            !(
              e.accountNumber === error.accountNumber && e.error === error.error
            )
        );
      } else {
        newList = [...currentList, error];
      }

      return { ...prev, [bureau]: newList };
    });
  };

  const handleIdentifyFactualErrors = () => {
    identifyErrors(
      {
        disputeType: "inaccurate-information",
        action: "identify",
      },
      {
        onSuccess: (data) => {
          setFactualErrors(data);
        },
      }
    );
  };

  const hasSelectedErrors =
    selectedErrors.experian.length > 0 ||
    selectedErrors.transunion.length > 0 ||
    selectedErrors.equifax.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <div className="rounded-md mb-4 p-4 flex flex-col gap-4 bg-blue-50">
          <div className="flex flex-row justify-between items-center">
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

            <div className="flex gap-2">
              <Button
                className="bg-blue-200 hover:bg-blue-300 text-blue-900 border-blue-300"
                type="button"
                variant={"outline"}
                onClick={handleIdentifyFactualErrors}
                disabled={isIdentifying}
              >
                {isIdentifying ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Identifying...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Identify Factual Errors
                  </>
                )}
              </Button>
            </div>
          </div>

          {factualErrors && (
            <div className="mt-4 space-y-4 bg-white p-4 rounded-md border border-blue-100">
              <h5 className="font-semibold text-blue-900">
                Identified Factual Errors
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Experian */}
                <div className="border p-4 rounded-md">
                  <h6 className="font-medium mb-2 text-gray-700">Experian</h6>
                  {factualErrors.experian?.length > 0 ? (
                    <ul className="space-y-2">
                      {factualErrors.experian.map((err, idx) => {
                        const isSelected = selectedErrors.experian.some(
                          (e) =>
                            e.accountNumber === err.accountNumber &&
                            e.error === err.error
                        );
                        return (
                          <li
                            key={idx}
                            onClick={() => toggleError("experian", err)}
                            className={`text-sm p-2 rounded border cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-red-100 border-red-300 ring-1 ring-red-300"
                                : "bg-red-50 border-red-100 hover:bg-red-100"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-red-900">
                                {err.creditorName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {err.accountNumber}
                              </div>
                              <div className="text-red-600 mt-1">
                                {err.error}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No errors found
                    </p>
                  )}
                </div>
                {/* TransUnion */}
                <div className="border p-4 rounded-md">
                  <h6 className="font-medium mb-2 text-gray-700">TransUnion</h6>
                  {factualErrors.transunion?.length > 0 ? (
                    <ul className="space-y-2">
                      {factualErrors.transunion.map((err, idx) => {
                        const isSelected = selectedErrors.transunion.some(
                          (e) =>
                            e.accountNumber === err.accountNumber &&
                            e.error === err.error
                        );
                        return (
                          <li
                            key={idx}
                            onClick={() => toggleError("transunion", err)}
                            className={`text-sm p-2 rounded border cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-red-100 border-red-300 ring-1 ring-red-300"
                                : "bg-red-50 border-red-100 hover:bg-red-100"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-red-900">
                                {err.creditorName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {err.accountNumber}
                              </div>
                              <div className="text-red-600 mt-1">
                                {err.error}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No errors found
                    </p>
                  )}
                </div>
                {/* Equifax */}
                <div className="border p-4 rounded-md">
                  <h6 className="font-medium mb-2 text-gray-700">Equifax</h6>
                  {factualErrors.equifax?.length > 0 ? (
                    <ul className="space-y-2">
                      {factualErrors.equifax.map((err, idx) => {
                        const isSelected = selectedErrors.equifax.some(
                          (e) =>
                            e.accountNumber === err.accountNumber &&
                            e.error === err.error
                        );
                        return (
                          <li
                            key={idx}
                            onClick={() => toggleError("equifax", err)}
                            className={`text-sm p-2 rounded border cursor-pointer transition-colors ${
                              isSelected
                                ? "bg-red-100 border-red-300 ring-1 ring-red-300"
                                : "bg-red-50 border-red-100 hover:bg-red-100"
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-red-900">
                                {err.creditorName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {err.accountNumber}
                              </div>
                              <div className="text-red-600 mt-1">
                                {err.error}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No errors found
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              className="bg-green-200 hover:bg-green-300 text-green-900 border-green-300"
              type="button"
              variant={"outline"}
              onClick={handleGenerateDisputeInaccurate}
              disabled={isGenerating || !hasSelectedErrors}
            >
              {isGenerating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Mailbox className="h-4 w-4 mr-2" />
                  Generate Dispute
                </>
              )}
            </Button>
          </div>
        </div>
        {generatedContent?.experian && (
          <CustomFormField
            type="editor"
            name="disputeMessageExperian"
            label="Experian Dispute Letter"
            labelClassName="font-semibold text-blue-900 mb-2 text-base"
          />
        )}
        {generatedContent?.transunion && (
          <CustomFormField
            type="editor"
            name="disputeMessageTransunion"
            label="TransUnion Dispute Letter"
            labelClassName="font-semibold text-blue-900 mb-2 text-base"
          />
        )}
        {generatedContent?.equifax && (
          <CustomFormField
            type="editor"
            name="disputeMessageEquifax"
            label="Equifax Dispute Letter"
            labelClassName="font-semibold text-blue-900 mb-2 text-base"
          />
        )}
        {!generatedContent && (
          <CustomFormField type="editor" name="disputeMessage" />
        )}
      </div>
    </div>
  );
}
