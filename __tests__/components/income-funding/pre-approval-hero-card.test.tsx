import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PreApprovalHeroCard } from "@/components/income-funding/PreApprovalHeroCard";

describe("PreApprovalHeroCard", () => {
  it("renders estimated amount and continue button", () => {
    const handleContinue = vi.fn();
    render(
      <PreApprovalHeroCard
        estimatedApprovalAmount={135000}
        onContinue={handleContinue}
      />,
    );

    expect(screen.getByText("Continue to select your offer")).toBeDefined();
    expect(screen.getByText("Pre-approval complete")).toBeDefined();

    fireEvent.click(screen.getByText("Continue to select your offer"));
    expect(handleContinue).toHaveBeenCalledTimes(1);
  });
});
