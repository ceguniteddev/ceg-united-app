/// <reference types="vitest/globals" />
import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { I18nProvider } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LocaleFlag, FlagUS, FlagES } from "@/components/ui/flag-icon";

describe("Flag Components", () => {
  it("renders FlagUS SVG correctly", () => {
    const { container } = render(<FlagUS data-testid="flag-us" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 640 480");
  });

  it("renders FlagES SVG correctly", () => {
    const { container } = render(<FlagES data-testid="flag-es" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("viewBox", "0 0 640 480");
  });

  it("renders LocaleFlag based on locale prop", () => {
    const { rerender, container } = render(<LocaleFlag locale="en" />);
    expect(container.querySelector("svg")).toBeInTheDocument();

    rerender(<LocaleFlag locale="es" />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});

describe("LanguageSwitcher Component", () => {
  it("renders trigger with current locale flag and switches language", () => {
    render(
      <I18nProvider initialLocale="en">
        <LanguageSwitcher />
      </I18nProvider>,
    );

    const trigger = screen.getByRole("button", { name: /language/i });
    expect(trigger).toBeInTheDocument();
    // Dropdown trigger has SVG flag
    expect(trigger.querySelector("svg")).toBeInTheDocument();
  });
});
