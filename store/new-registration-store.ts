import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  AuthForm,
  BusinessDetailsForm,
  FundingPageForm,
  DocumentUploadForm,
} from "@/schema/new-registration";

interface NewRegistrationState {
  currentStep: number;
  leadId: string | null;
  authData: Partial<AuthForm>;
  businessDetailsData: Partial<BusinessDetailsForm>;
  fundingData: Partial<FundingPageForm>;
  documentUploadData: Partial<DocumentUploadForm>;

  setStep: (step: number) => void;
  setLeadId: (id: string | null) => void;
  updateAuthData: (data: Partial<AuthForm>) => void;
  updateBusinessDetailsData: (data: Partial<BusinessDetailsForm>) => void;
  updateFundingData: (data: Partial<FundingPageForm>) => void;
  updateDocumentUploadData: (data: Partial<DocumentUploadForm>) => void;
  resetRegistration: () => void;
}

const initialState = {
  currentStep: 1,
  leadId: null,
  authData: {},
  businessDetailsData: {},
  fundingData: {},
  documentUploadData: {},
};

export const useNewRegistrationStore = create<NewRegistrationState>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),
      setLeadId: (id) => set({ leadId: id }),

      updateAuthData: (data) =>
        set((state) => ({ authData: { ...state.authData, ...data } })),

      updateBusinessDetailsData: (data) =>
        set((state) => ({
          businessDetailsData: { ...state.businessDetailsData, ...data },
        })),

      updateFundingData: (data) =>
        set((state) => ({ fundingData: { ...state.fundingData, ...data } })),

      updateDocumentUploadData: (data) =>
        set((state) => ({
          documentUploadData: { ...state.documentUploadData, ...data },
        })),

      resetRegistration: () => set(initialState),
    }),
    {
      name: "new-registration-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => key !== "documentUploadData"),
        ),
    },
  ),
);
