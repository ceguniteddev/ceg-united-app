import { createStore, GlobalState } from "little-state-machine";
import { ClientApplicationForm } from "@/schema/client-application";

// Define the state interface
declare module "little-state-machine" {
  interface GlobalState {
    clientApplication: Record<string, Partial<ClientApplicationForm>>;
  }
}

// Create the store with initial values
createStore(
  {
    clientApplication: {},
    applyFunding: {},
  },
  {
    name: "client-application-store", // This key is used for localStorage persistence
    middleWares: [],
    storageType:
      typeof window !== "undefined" ? window.localStorage : undefined,
  }
);

// Define actions
export const updateClientApplicationAction = (
  state: GlobalState,
  payload: { userId: string; data: Partial<ClientApplicationForm> }
) => {
  return {
    ...state,
    clientApplication: {
      ...state.clientApplication,
      [payload.userId]: {
        ...(state.clientApplication[payload.userId] || {}),
        ...payload.data,
      },
    },
  };
};

export const clearClientApplicationAction = (
  state: GlobalState,
  payload: { userId: string }
) => {
  const newState = { ...state.clientApplication };
  delete newState[payload.userId];

  return {
    ...state,
    clientApplication: newState,
  };
};
