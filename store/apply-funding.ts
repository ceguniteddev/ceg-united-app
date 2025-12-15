import {
  createStore,
  useStateMachine,
  GlobalState,
} from "little-state-machine";
import { ApplyFunding } from "@/schema/apply-funding";

// Define the state interface
// We extend the GlobalState interface from little-state-machine
declare module "little-state-machine" {
  interface GlobalState {
    applyFunding: Record<string, Partial<ApplyFunding>>;
  }
}

// Create the store with initial values
createStore(
  {
    applyFunding: {},
  },
  {
    name: "apply-funding-store", // This key is used for localStorage persistence
    middleWares: [], // Add middlewares if needed (e.g. logger)
    storageType:
      typeof window !== "undefined" ? window.localStorage : undefined,
  }
);

// Define actions
export const updateApplyFundingAction = (
  state: GlobalState,
  payload: { userId: string; data: Partial<ApplyFunding> }
) => {
  return {
    ...state,
    applyFunding: {
      ...state.applyFunding,
      [payload.userId]: {
        ...(state.applyFunding[payload.userId] || {}),
        ...payload.data,
      },
    },
  };
};

export const clearApplyFundingAction = (
  state: GlobalState,
  payload: { userId: string }
) => {
  const newState = { ...state.applyFunding };
  delete newState[payload.userId];

  return {
    ...state,
    applyFunding: newState,
  };
};
