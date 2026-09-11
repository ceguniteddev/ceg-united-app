import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { renderCommentText } from "@/components/notes/renderCommentText";
import { BankManagement } from "@/schema/bank-management";

describe("renderCommentText", () => {
  const mockBanks: BankManagement[] = [
    {
      id: "1",
      bankName: "Bank of America",
      website: "https://bankofamerica.com",
      contacts: [],
      successFeePercentage: 10,
    },
    {
      id: "2",
      bankName: "Chase",
      website: "https://chase.com",
      contacts: [],
      successFeePercentage: 10,
    },
    {
      id: "3",
      bankName: "Bank",
      website: "https://bank.com",
      contacts: [],
      successFeePercentage: 10,
    },
    {
      id: "4",
      bankName: "Wells Fargo & Co. (Corp?)",
      website: "https://wellsfargo.com",
      contacts: [],
      successFeePercentage: 10,
    },
  ];

  it("should return empty string if text is empty", () => {
    const result = renderCommentText("", mockBanks);
    expect(result).toBe("");
  });

  it("should return the text directly if banks list is undefined", () => {
    const text = "Please check with @Chase";
    const result = renderCommentText(text, undefined);
    expect(result).toBe(text);
  });

  it("should return the text directly if banks list is empty", () => {
    const text = "Please check with @Chase";
    const result = renderCommentText(text, []);
    expect(result).toBe(text);
  });

  it("should return the text directly if no bank names are tagged in the text", () => {
    const text =
      "I went to the Chase bank and talked to Bank of America representatives.";
    const result = renderCommentText(text, mockBanks);
    expect(result).toBe(text);
  });

  it("should split and wrap tagged bank names with a styled badge", () => {
    const text = "Please reach out to @Chase for details.";
    const result = renderCommentText(text, mockBanks);

    const { container } = render(<div>{result}</div>);

    // Check if the badge is rendered
    const badge = container.querySelector("span");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("@Chase");
    expect(badge?.className).toContain("bg-blue-50");
    expect(badge?.className).toContain("text-blue-700");

    // Check surrounding text
    expect(container.textContent).toBe(
      "Please reach out to @Chase for details.",
    );
  });

  it("should sort bank names by length in descending order to prioritize longer matching names", () => {
    const text = "Checking both @Bank of America and @Bank today.";
    const result = renderCommentText(text, mockBanks);

    const { container } = render(<div>{result}</div>);

    const badges = container.querySelectorAll("span");
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toBe("@Bank of America");
    expect(badges[1].textContent).toBe("@Bank");

    expect(container.textContent).toBe(
      "Checking both @Bank of America and @Bank today.",
    );
  });

  it("should safely escape special characters in bank names before creating matching regular expression", () => {
    const text =
      "We need an assessment on @Wells Fargo & Co. (Corp?) immediately.";
    const result = renderCommentText(text, mockBanks);

    const { container } = render(<div>{result}</div>);

    const badge = container.querySelector("span");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("@Wells Fargo & Co. (Corp?)");

    expect(container.textContent).toBe(
      "We need an assessment on @Wells Fargo & Co. (Corp?) immediately.",
    );
  });

  it("should support multiple mentions of the same bank", () => {
    const text = "Ask @Chase and also follow up with @Chase.";
    const result = renderCommentText(text, mockBanks);

    const { container } = render(<div>{result}</div>);

    const badges = container.querySelectorAll("span");
    expect(badges.length).toBe(2);
    expect(badges[0].textContent).toBe("@Chase");
    expect(badges[1].textContent).toBe("@Chase");

    expect(container.textContent).toBe(
      "Ask @Chase and also follow up with @Chase.",
    );
  });
});
