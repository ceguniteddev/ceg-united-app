import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ApplyFunding } from "@/schema/apply-funding";

type ApplyFundingState = {
  applications: Record<string, Partial<ApplyFunding>>;
  updateApplication: (userId: string, data: Partial<ApplyFunding>) => void;
  clearApplication: (userId: string) => void;
  getApplication: (userId: string) => Partial<ApplyFunding> | undefined;
};

export const useApplyFundingStore = create<ApplyFundingState>()(
  persist(
    (set, get) => ({
      applications: {},
      updateApplication: (userId, data) =>
        set((state) => ({
          applications: {
            ...state.applications,
            [userId]: {
              ...(state.applications[userId] || {}),
              ...data,
            },
          },
        })),
      clearApplication: (userId) =>
        set((state) => {
          const { [userId]: removed, ...rest } = state.applications;
          return { applications: rest };
        }),
      getApplication: (userId) => get().applications[userId],
    }),
    {
      name: "apply-funding-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : ({} as Storage)
      ),
    }
  )
);
