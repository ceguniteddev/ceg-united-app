import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ClientApplicationForm } from "@/schema/client-application";
import { ApplyFunding } from "@/schema/apply-funding";

type RegistrationState = {
  registrations: Record<
    string,
    {
      step1?: Partial<ClientApplicationForm>;
      step2?: Partial<ApplyFunding>;
      currentStep?: number;
    }
  >;
  updateStep1: (userId: string, data: Partial<ClientApplicationForm>) => void;
  updateStep2: (userId: string, data: Partial<ApplyFunding>) => void;
  updateCurrentStep: (userId: string, step: number) => void;
  clearRegistration: (userId: string) => void;
  getRegistration: (userId: string) =>
    | {
        step1?: Partial<ClientApplicationForm>;
        step2?: Partial<ApplyFunding>;
        currentStep?: number;
      }
    | undefined;
};

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      registrations: {},
      updateStep1: (userId, data) =>
        set((state) => ({
          registrations: {
            ...state.registrations,
            [userId]: {
              ...(state.registrations[userId] || {}),
              step1: {
                ...(state.registrations[userId]?.step1 || {}),
                ...data,
              },
            },
          },
        })),
      updateStep2: (userId, data) =>
        set((state) => ({
          registrations: {
            ...state.registrations,
            [userId]: {
              ...(state.registrations[userId] || {}),
              step2: {
                ...(state.registrations[userId]?.step2 || {}),
                ...data,
              },
            },
          },
        })),
      updateCurrentStep: (userId, step) =>
        set((state) => ({
          registrations: {
            ...state.registrations,
            [userId]: {
              ...(state.registrations[userId] || {}),
              currentStep: step,
            },
          },
        })),
      clearRegistration: (userId) =>
        set((state) => {
          const { [userId]: removed, ...rest } = state.registrations;
          return { registrations: rest };
        }),
      getRegistration: (userId) => get().registrations[userId],
    }),
    {
      name: "registration-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : ({} as Storage)
      ),
      partialize: (state) => {
        // Exclude document fields from persistence to avoid localStorage quota issues
        const filteredRegistrations = Object.entries(
          state.registrations
        ).reduce((acc, [userId, data]) => {
          acc[userId] = {
            ...data,
            step2: data.step2
              ? {
                  ...data.step2,
                  // Exclude large base64 document fields
                  bankStatements: undefined,
                  driverLicenseDocuments: undefined,
                }
              : data.step2,
          };
          return acc;
        }, {} as RegistrationState["registrations"]);

        return {
          registrations: filteredRegistrations,
        } as RegistrationState;
      },
    }
  )
);
