/// <reference types="vitest/globals" />

import { render, screen } from "@testing-library/react";
import { DodoCheckoutView } from "@/components/funding/DodoCheckoutView";

const checkout = vi.hoisted(() => ({
  initialize: vi.fn(),
  open: vi.fn(),
  close: vi.fn(),
  isOpen: vi.fn(() => false),
}));
vi.mock("@/lib/dodo-checkout", () => ({
  DodoPayments: {
    Initialize: checkout.initialize,
    Checkout: {
      open: checkout.open,
      close: checkout.close,
      isOpen: checkout.isOpen,
    },
  },
}));
vi.mock("@/lib/utils", () => ({
  currency: (value: number) => `$${value.toFixed(2)}`,
}));

describe("DodoCheckoutView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders an embedded checkout and formatted amount", () => {
    render(
      <DodoCheckoutView
        checkoutId="cks_1"
        checkoutDetails={{
          checkout_url: "https://test.checkout.dodopayments.com/c/1",
          amount: 2500,
        }}
      />,
    );
    expect(screen.getByTestId("dodo-inline-checkout")).not.toBeNull();
    expect(screen.getByText("$25.00")).not.toBeNull();
    expect(checkout.open).toHaveBeenCalledWith({
      checkoutUrl: "https://test.checkout.dodopayments.com/c/1",
      elementId: "dodo-inline-checkout-cks_1",
    });
  });

  it("supports the persisted url field and unknown amount", () => {
    render(
      <DodoCheckoutView
        checkoutId="cks_2"
        checkoutDetails={{ url: "https://checkout.dodopayments.com/c/2" }}
      />,
    );
    expect(screen.getByText("Calculated at checkout")).not.toBeNull();
  });

  it("shows an error without a checkout URL", () => {
    render(<DodoCheckoutView checkoutId="bad" checkoutDetails={{}} />);
    expect(screen.getByRole("alert").textContent).toContain("unavailable");
  });

  it("handles successful SDK status events and closes on unmount", () => {
    const onComplete = vi.fn();
    checkout.isOpen.mockReturnValue(true);
    const { unmount } = render(
      <DodoCheckoutView
        checkoutId="cks"
        checkoutDetails={{ url: "https://test.checkout.dodopayments.com/c" }}
        onComplete={onComplete}
      />,
    );
    const config = checkout.initialize.mock.calls[0][0];
    config.onEvent({
      event_type: "checkout.status",
      data: { status: "pending" },
    });
    expect(onComplete).not.toHaveBeenCalled();
    config.onEvent({
      event_type: "checkout.status",
      data: { status: "succeeded", payment_id: "pay_1" },
    });
    expect(onComplete).toHaveBeenCalledWith("pay_1");
    unmount();
    expect(checkout.close).toHaveBeenCalled();
  });
});
