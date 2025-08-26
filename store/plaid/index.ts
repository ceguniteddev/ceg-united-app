import { createStore } from "zustand/vanilla";
import { useStore } from "zustand";

export type PlaidInstitution = {
  institutionId: string;
  accessToken: string;
};

type SelectedInstitutionState = {
  selectedInstitution: PlaidInstitution | null;
};

type SelectedInstitutionActions = {
  setSelectedInstitution: (value: PlaidInstitution) => void;
  reset: () => void;
};

type SelectedInstitutionStore = SelectedInstitutionState & SelectedInstitutionActions;

const defaultSelectedInstitutionState: SelectedInstitutionState = {
  selectedInstitution: null,
};

export const selectedInstitutionStore = createStore<SelectedInstitutionStore>((set) => ({
  ...defaultSelectedInstitutionState,
  setSelectedInstitution: (value) => set({ selectedInstitution: value }),
  reset: () => set(defaultSelectedInstitutionState),
}));

export const useSelectedInstitutionStoreStore = () => useStore(selectedInstitutionStore);
