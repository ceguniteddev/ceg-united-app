"use client";

import React, {
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Textarea } from "@/components/ui/textarea";
import { useBankManagementQuery } from "@/hooks/admin/bank-management";
import { cn } from "@/lib/utils";

export interface BankTaggingTextareaProps extends Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
> {
  value?: string;
  onChange?: (value: string) => void;
}

export const BankTaggingTextarea = forwardRef<
  HTMLTextAreaElement,
  BankTaggingTextareaProps
>(({ value, onChange, className, onKeyDown, onBlur, ...props }, ref) => {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => internalRef.current as HTMLTextAreaElement);

  const { banks, isLoading } = useBankManagementQuery();
  const [query, setQuery] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Ensure banks is an array
  const bankList = banks || [];

  const filteredBanks = React.useMemo(() => {
    if (query === null) return [];
    const lowerQuery = query.toLowerCase();
    // Limit to 20 to avoid massive unscrollable lists
    return bankList
      .filter((b) => b.bankName.toLowerCase().includes(lowerQuery))
      .slice(0, 20);
  }, [bankList, query]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (onChange) onChange(newValue);

    const caretPos = e.target.selectionStart;

    // Find trigger: word that starts with @ preceded by start of string or whitespace
    const textBeforeCaret = newValue.substring(0, caretPos);
    const match = textBeforeCaret.match(/(?:^|\s)@([^@\s]*)$/);

    if (match) {
      setQuery(match[1]);
      setCursorPosition(caretPos);
      setSelectedIndex(0);
    } else {
      setQuery(null);
      setCursorPosition(null);
    }
  };

  const insertMention = (bankName: string) => {
    if (!internalRef.current || cursorPosition === null || query === null)
      return;
    const textarea = internalRef.current;

    // Use internal value if controlled value is undefined
    const text = textarea.value;

    const textBeforeQuery = text.substring(
      0,
      cursorPosition - query.length - 1,
    ); // -1 for the '@'
    const textAfterCursor = text.substring(cursorPosition);

    const newText = `${textBeforeQuery}@${bankName} ${textAfterCursor}`;

    if (onChange) {
      onChange(newText);
    }

    const newCursorPos = textBeforeQuery.length + bankName.length + 2; // +1 for @, +1 for space

    setQuery(null);
    setCursorPosition(null);

    // Use a timeout to let react update the value before setting cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (query !== null) {
      if (filteredBanks.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredBanks.length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex(
            (prev) => (prev - 1 + filteredBanks.length) % filteredBanks.length,
          );
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filteredBanks[selectedIndex].bankName);
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setQuery(null);
        setCursorPosition(null);
        return;
      }
    }

    if (onKeyDown) onKeyDown(e);
  };

  // Close dropdown on blur
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setQuery(null);
    setCursorPosition(null);
    if (onBlur) onBlur(e);
  };

  return (
    <div className="relative w-full">
      <Textarea
        ref={internalRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className={cn("w-full", className)}
        {...props}
      />

      {query !== null && (
        <div className="absolute z-50 w-full sm:max-w-xs mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg max-h-60 overflow-y-auto left-0 top-full">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              Loading banks...
            </div>
          ) : filteredBanks.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">
              No banks found
            </div>
          ) : (
            <ul className="py-2">
              {filteredBanks.map((bank, index) => (
                <li
                  key={bank.id || bank.bankName}
                  className={cn(
                    "px-4 py-2 text-sm cursor-pointer transition-colors",
                    index === selectedIndex
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                  )}
                  onMouseDown={(e) => {
                    // Prevent blur from firing before click registers
                    e.preventDefault();
                    insertMention(bank.bankName);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {bank.bankName}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
});

BankTaggingTextarea.displayName = "BankTaggingTextarea";

export default BankTaggingTextarea;
