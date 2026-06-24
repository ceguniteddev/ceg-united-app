import React from "react";
import { BankManagement } from "@/schema/bank-management";

/**
 * Renders comment text, wrapping matching bank names tagged with '@' in high-end responsive Tailwind badges.
 *
 * @param text The comment text content
 * @param banks The list of available banks
 * @returns React.ReactNode containing formatted text and styled badges
 */
export function renderCommentText(
  text: string,
  banks: BankManagement[] | undefined,
): React.ReactNode {
  if (!text) return "";
  if (!banks || banks.length === 0) return text;

  // 1. Sort the bank names list by length in descending order to avoid matching partial substrings
  const bankNames = banks
    .map((b) => b.bankName)
    .filter(
      (name): name is string =>
        typeof name === "string" && name.trim().length > 0,
    )
    .sort((a, b) => b.length - a.length);

  if (bankNames.length === 0) return text;

  // 2. Safely escape special characters in bank names before creating a matching regular expression
  const escapeRegExp = (str: string) =>
    str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedNames = bankNames.map(escapeRegExp);

  // 3. Construct a case-insensitive regex pattern: @(Bank Name 1|Bank Name 2|...)(?=\s|[^a-zA-Z0-9]|$)
  const patternString = `@(${escapedNames.join("|")})(?=\\s|[^a-zA-Z0-9]|$)`;
  const regex = new RegExp(patternString, "gi");

  // 4. Split the comment text by this regex
  const parts = text.split(regex);

  // 5. If there are no bank tags matched, return the text directly
  if (parts.length <= 1) {
    return text;
  }

  // 6. Return the React node structure with high-end responsive Tailwind badges
  return (
    <>
      {parts.map((part, index) => {
        // Since we split by a pattern with one capture group,
        // the captured bank names will be at odd indices (1, 3, 5, ...).
        if (index % 2 === 1) {
          return (
            <span
              key={`${part}-${index}`}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs md:text-sm font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 mx-0.5"
            >
              @{part}
            </span>
          );
        }
        return part;
      })}
    </>
  );
}
