import { logInfo } from "@/lib/logger";
import {
  calculateBusinessIncomePreApprovedN8N,
  createAsanaCustomerServiceTaskN8N,
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
