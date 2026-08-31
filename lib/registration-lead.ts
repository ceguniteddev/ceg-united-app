import { RegistrationPurpose } from "@/schema/new-registration";

export async function updateExistingLeadPurpose(
  leadId: string,
  registrationPurpose: RegistrationPurpose,
) {
  const data = btoa(JSON.stringify({ registrationPurpose }));

  return fetch("/api/leads", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId, data }),
  });
}
