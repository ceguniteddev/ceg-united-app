import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationPurpose } from "@/schema/new-registration";
import { updateExistingLeadPurpose } from "@/lib/registration-lead";

describe("updateExistingLeadPurpose", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("updates the retained lead and does not create another lead", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await updateExistingLeadPurpose(
      "lead-123",
      RegistrationPurpose.FinancialEducation,
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leads",
      expect.objectContaining({ method: "PUT" }),
    );

    const request = fetchMock.mock.calls[0][1];
    const body = JSON.parse(String(request?.body));
    const decodedData = JSON.parse(atob(body.data));

    expect(body.leadId).toBe("lead-123");
    expect(decodedData).toEqual({
      registrationPurpose: RegistrationPurpose.FinancialEducation,
    });
    expect(decodedData).not.toHaveProperty("authData");
  });
});
