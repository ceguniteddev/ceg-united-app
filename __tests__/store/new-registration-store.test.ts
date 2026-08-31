import { beforeEach, describe, expect, it } from "vitest";
import { RegistrationPurpose } from "@/schema/new-registration";
import { useNewRegistrationStore } from "@/store/new-registration-store";

describe("useNewRegistrationStore", () => {
  beforeEach(() => {
    useNewRegistrationStore.getState().resetRegistration();
    localStorage.clear();
  });

  it("preserves the complete draft and lead when registration purpose changes", () => {
    const store = useNewRegistrationStore.getState();

    store.setRegistrationPurpose(RegistrationPurpose.Funding);
    store.setLeadId("lead-123");
    store.updateAuthData({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    });
    store.updateBusinessDetailsData({ businessName: "Jane LLC" });
    store.updateFundingData({
      interestedProduct: "Personal Funding",
      fundingType: "Personal",
    });
    store.updateDocumentUploadData({
      driverLicense: { uploaded: true },
      personalDocs: { paystubs: { uploaded: true } },
    });

    useNewRegistrationStore
      .getState()
      .setRegistrationPurpose(RegistrationPurpose.FinancialEducation);

    const switchedState = useNewRegistrationStore.getState();

    expect(switchedState.registrationPurpose).toBe(
      RegistrationPurpose.FinancialEducation,
    );
    expect(switchedState.currentStep).toBe(1);
    expect(switchedState.leadId).toBe("lead-123");
    expect(switchedState.authData).toEqual({
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    });
    expect(switchedState.businessDetailsData).toEqual({
      businessName: "Jane LLC",
    });
    expect(switchedState.fundingData).toEqual({
      interestedProduct: "Personal Funding",
      fundingType: "Personal",
    });
    expect(switchedState.documentUploadData).toEqual({
      driverLicense: { uploaded: true },
      personalDocs: { paystubs: { uploaded: true } },
    });

    switchedState.setRegistrationPurpose(RegistrationPurpose.Funding);

    expect(useNewRegistrationStore.getState().businessDetailsData).toEqual({
      businessName: "Jane LLC",
    });
  });
});
