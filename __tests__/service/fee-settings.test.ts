/// <reference types="vitest/globals" />

const mocks = vi.hoisted(() => ({ set: vi.fn(), syncCatalog: vi.fn() }));
vi.mock("@/lib/fireabase-admin", () => ({
  firestoreAdmin: () => ({
    collection: () => ({ doc: () => ({ set: mocks.set }) }),
  }),
}));
vi.mock("@/service/dodo/catalog", () => ({
  synchronizeDodoSubscriptionCatalog: mocks.syncCatalog,
}));

import { setFeeSettings, type FeeSettings } from "@/service/fee-settings";

describe("setFeeSettings", () => {
  beforeEach(() => vi.clearAllMocks());

  it("synchronizes Dodo before persisting authoritative app fees", async () => {
    const settings = {
      tierStarterPrice: 297,
      tierProPrice: 397,
      tierExecutivePrice: 697,
      creditModuleProAddonPrice: 197,
    } as FeeSettings;
    mocks.syncCatalog.mockResolvedValue(undefined);
    await setFeeSettings(settings);
    expect(mocks.syncCatalog).toHaveBeenCalledWith(settings);
    expect(mocks.set).toHaveBeenCalledWith(settings, { merge: true });
    expect(mocks.syncCatalog.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.set.mock.invocationCallOrder[0],
    );
  });

  it("does not persist fees when Dodo synchronization fails", async () => {
    mocks.syncCatalog.mockRejectedValueOnce(new Error("Dodo unavailable"));
    await expect(setFeeSettings({} as FeeSettings)).rejects.toThrow(
      "Dodo unavailable",
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
