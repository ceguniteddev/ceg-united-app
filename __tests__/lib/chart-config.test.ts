import { describe, it, expect, vi } from "vitest";

const mockRegister = vi.fn();

vi.mock("chart.js", () => ({
  Chart: { register: mockRegister },
  Title: "Title",
  Tooltip: "Tooltip",
  Legend: "Legend",
  ArcElement: "ArcElement",
  CategoryScale: "CategoryScale",
  LinearScale: "LinearScale",
  BarElement: "BarElement",
}));

describe("chart-config", () => {
  it("registers all required Chart.js components", async () => {
    await import("@/lib/chart-config");

    expect(mockRegister).toHaveBeenCalledWith(
      "Title",
      "Tooltip",
      "Legend",
      "ArcElement",
      "CategoryScale",
      "LinearScale",
      "BarElement",
    );
  });

  it("calls Chart.register exactly once", async () => {
    // Module is cached after first import, so register was called once
    expect(mockRegister).toHaveBeenCalledTimes(1);
  });
});
