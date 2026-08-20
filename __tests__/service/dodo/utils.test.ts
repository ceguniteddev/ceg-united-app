/// <reference types="vitest/globals" />

const get = vi.fn();
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    collection: () => ({ doc: () => ({ get }) }),
  }),
}));
import { getPaymentRequestById } from "@/service/dodo/utils";

describe("Dodo service utils", () => {
  it("returns existing requests", async () => {
    get.mockResolvedValueOnce({
      exists: true,
      id: "r1",
      data: () => ({ status: "pending" }),
    });
    await expect(getPaymentRequestById("r1")).resolves.toEqual({
      id: "r1",
      status: "pending",
    });
  });
  it("returns null for missing requests and errors", async () => {
    get.mockResolvedValueOnce({ exists: false });
    await expect(getPaymentRequestById("none")).resolves.toBeNull();
    get.mockRejectedValueOnce(new Error("db"));
    await expect(getPaymentRequestById("bad")).resolves.toBeNull();
  });
});
