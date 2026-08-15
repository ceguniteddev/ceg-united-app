import { logInfo } from "@/lib/logger";
import {
  calculateBusinessIncomePreApprovedN8N,
  createAsanaCustomerServiceTaskN8N,
  getFundingPlaybookN8N,
  sendClientServiceAgreementN8N,
} from "@/lib/n8n";

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

export const createAsanaCustomerServiceTask = async ({
  userId,
  bankProductId,
  referenceNumber,
  fundMappingApprovedId,
}: {
  userId: string;
  bankProductId: string;
  referenceNumber: string;
  fundMappingApprovedId: string;
}) => {
  logInfo("Creating Asana customer service task...", {
    userId,
    bankProductId,
    referenceNumber,
    fundMappingApprovedId,
  });
  const url = `${process.env.n8n_HOST}/${await createAsanaCustomerServiceTaskN8N()}`;
  // logInfo("Asana task creation URL:", {
  //   url,
  // });
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      userId,
      bankProductId,
      referenceNumber,
      fundMappingApprovedId,
    }),
  });
};

export const calculateBusinessIncomePreApproved = async ({
  userId,
  referenceNumber,
}: {
  userId: string;
  referenceNumber: string;
}) => {
  logInfo("Calculating business income pre-approved...", {
    userId,
    referenceNumber,
  });
  const url = `${process.env.n8n_HOST}/${await calculateBusinessIncomePreApprovedN8N()}`;
  // logInfo("Asana task creation URL:", {
  //   url,
  // });
  return await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      userId,
      referenceNumber,
    }),
  });
};

export const generateFundingPlaybook = async ({
  userId,
  lenderId,
  productId,
}: {
  userId: string;
  lenderId?: string;
  productId?: string;
}) => {
  logInfo("Generating funding playbook via n8n...", {
    userId,
    lenderId,
    productId,
  });
  const url = `${process.env.n8n_HOST}/${await getFundingPlaybookN8N()}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ADMIN_ACCESS_KEY: process.env.ADMIN_ACCESS_KEY!,
    },
    body: JSON.stringify({
      userId,
      ...(lenderId ? { lenderId } : {}),
      ...(productId ? { productId } : {}),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`n8n webhook error (${response.status}): ${errorText}`);
  }

  return await response.json();
};
