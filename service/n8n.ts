import { logInfo } from "@/lib/logger";
import { sendClientServiceAgreementN8N } from "@/lib/n8n";

export const sendClientServiceAgreement = async ({
  userId,
}: {
  userId: string;
}) => {
  logInfo("Sending client service agreement...", {
    userId,
  });
  await fetch(
    `${process.env.n8n_HOST}/${await sendClientServiceAgreementN8N()}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
      },
      body: JSON.stringify({
        userId,
      }),
    },
  );
};
