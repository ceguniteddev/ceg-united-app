import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ClientApplicationForm } from "@/schema/client-application";

type ClientApplicationState = {
  applications: Record<string, Partial<ClientApplicationForm>>;
  updateApplication: (
    userId: string,
    data: Partial<ClientApplicationForm>
  ) => void;
  clearApplication: (userId: string) => void;
  getApplication: (
    userId: string
  ) => Partial<ClientApplicationForm> | undefined;
};

export const useClientApplicationStore = create<ClientApplicationState>()(
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
      name: "client-application-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : ({} as Storage)
      ),
    }
  )
);
