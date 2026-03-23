"use server";

import AppError from "@/error/AppError";
import { authenticationAdmin, firestoreAdmin } from "@/lib/fireabase-admin";
import {
  DenefitsRequest,
  DenefitsRequestSchema,
  DenefitsProposalRequest,
  DenefitsProposalRequestSchema,
  DenefitsProposalResponseSchema,
} from "@/schema/payments";
import { getUserById } from "./user";
import {
  USER_DENEFITS_CONTRACT,
  DENEFITS_PROPOSALS,
} from "@/constant/collection-name";
import { logInfo, logError } from "@/lib/logger";

export const recordContractCreated = async ({
  denefitsRequest,
}: {
  denefitsRequest: DenefitsRequest;
}) => {
  const query = DenefitsRequestSchema.safeParse(denefitsRequest);
  if (!query.success) {
    throw new AppError(query.error.message);
  }

  const db = firestoreAdmin();

  const auth = authenticationAdmin();
  let authUser = null;

  try {
    authUser = await auth.getUserByEmail(query.data.customer_email);
  } catch (error: any) {
    console.log("User not found");

    const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
    await collectionRef.add({ ...query.data, userId: null });

    return null;
  }

  if (!authUser) {
    console.log("User not found");
    const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
    await collectionRef.add({ ...query.data, userId: null });
    return null;
  }

  const userData = await getUserById(authUser.uid);
  if (!userData) {
    console.log("User not found");
    const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
    await collectionRef.add({ ...query.data, userId: null });
    return null;
  }

  const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
  await collectionRef.add({ ...query.data, userId: authUser.uid });
};

export const getContracts = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map((doc) => doc.data());
};

export const getContractsByUserId = async (userId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(USER_DENEFITS_CONTRACT)
    .where("userId", "==", userId);
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map((doc) => doc.data());
};

export const getDenefitsPayments = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
  const querySnapshot = await collectionRef.get();

  const payments = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      let mappedUser = null;

      // If contract has a userId, fetch the user details
      if (data.userId) {
        try {
          mappedUser = await getUserById(data.userId);
        } catch (error) {
          console.error(`Failed to fetch user ${data.userId}:`, error);
        }
      }

      return {
        id: doc.id,
        ...data,
        mappedEmail: mappedUser?.email || null,
        mappedFirstName: mappedUser?.firstName || null,
        mappedLastName: mappedUser?.lastName || null,
      };
    }),
  );

  return payments;
};

export const updateDenefitsContractUserId = async ({
  contractId,
  userId,
}: {
  contractId: string;
  userId: string;
}) => {
  if (!contractId) {
    throw new AppError("Contract ID is required.");
  }
  if (!userId) {
    throw new AppError("User ID is required.");
  }

  const db = firestoreAdmin();
  const docRef = db.collection(USER_DENEFITS_CONTRACT).doc(contractId);

  const docSnapshot = await docRef.get();
  if (!docSnapshot.exists) {
    throw new AppError("Contract not found.");
  }

  await docRef.update({ userId });

  return {
    id: contractId,
    ...docSnapshot.data(),
    userId,
  };
};

export const unmapDenefitsContract = async ({
  contractId,
}: {
  contractId: string;
}) => {
  if (!contractId) {
    throw new AppError("Contract ID is required.");
  }

  const db = firestoreAdmin();
  const docRef = db.collection(USER_DENEFITS_CONTRACT).doc(contractId);

  const docSnapshot = await docRef.get();
  if (!docSnapshot.exists) {
    throw new AppError("Contract not found.");
  }

  await docRef.update({ userId: null });

  return {
    id: contractId,
    ...docSnapshot.data(),
    userId: null,
  };
};

export type DenefitsProposalType = "in-house" | "no-fee";

/**
 * Creates a financing proposal via Denefits API
 * @param params - Proposal parameters including user details and amounts
 * @param params.proposalType - Type of proposal: "in-house" (IHF endpoint) or "no-fee" (send endpoint)
 * @returns Promise with proposal_id from Denefits
 */
export const createDenefitsProposal = async ({
  userId,
  serviceAmount,
  downpaymentAmount = 0,
  nextPaymentBufferDays = 30,
  monthsArray = [3, 6, 9, 12],
  interestRate = "20",
  serviceName = "Funding Mentorship Program",
  customerMobile,
  proposalType = "in-house",
}: {
  userId: string;
  serviceAmount: number;
  downpaymentAmount?: number;
  nextPaymentBufferDays?: number;
  monthsArray?: number[];
  interestRate?: string;
  serviceName?: string;
  customerMobile?: string;
  proposalType?: DenefitsProposalType;
}): Promise<{ proposal_id: number; stored_doc_id: string }> => {
  // Select appropriate endpoint based on proposal type
  const DENEFITS_IHF_ENDPOINT = process.env.DENEFITS_IHF_ENDPOINT; // In-House Financing
  const DENEFITS_NO_FEE_ENDPOINT = process.env.DENEFITS_NO_FEE_ENDPOINT; // No Fee Financing
  const DENEFITS_API_KEY = process.env.DENEFITS_API_KEY;

  const DENEFITS_API_ENDPOINT =
    proposalType === "no-fee"
      ? DENEFITS_NO_FEE_ENDPOINT
      : DENEFITS_IHF_ENDPOINT;
  console.log("Using Denefits API endpoint:", DENEFITS_API_ENDPOINT);
  if (!DENEFITS_API_ENDPOINT) {
    throw new AppError(
      `Denefits ${proposalType === "no-fee" ? "No Fee" : "In-House"} API endpoint is not configured. Please set ${proposalType === "no-fee" ? "DENEFITS_NO_FEE_ENDPOINT" : "DENEFITS_IHF_ENDPOINT"} environment variable.`,
    );
  }

  // Fetch user data
  const user = await getUserById(userId);
  if (!user) {
    throw new AppError(`User not found: ${userId}`);
  }

  // Calculate end date (2 months from today)
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + 2);
  const formattedEndDate = endDate.toISOString().split("T")[0]; // YYYY-MM-DD

  // Format phone number (remove non-digits)
  const formattedPhone = customerMobile
    ? customerMobile.replace(/\D/g, "")
    : user.phoneNumber?.replace(/\D/g, "") || "";

  if (!formattedPhone || formattedPhone.length < 10) {
    throw new AppError(
      "Valid phone number is required. Please provide a 10-digit phone number.",
    );
  }

  // Construct request body
  const requestBody: DenefitsProposalRequest = {
    service_amount: serviceAmount,
    downpayment_amount: downpaymentAmount,
    end_date: formattedEndDate,
    next_payment_buffer_days: nextPaymentBufferDays,
    months_array: monthsArray,
    interest_rate: interestRate,
    customer_email: user.email,
    customer_first_name: user.firstName,
    customer_last_name: user.lastName,
    customer_mobile: formattedPhone,
    service_array: [
      {
        service: serviceName,
        price: serviceAmount,
      },
    ],
  };

  console.log("Creating Denefits proposal with data:", requestBody);

  // Validate request with Zod
  const validationResult = DenefitsProposalRequestSchema.safeParse(requestBody);
  if (!validationResult.success) {
    logError(new Error("Denefits proposal validation failed"), {
      validationError: validationResult.error.message,
    });
    throw new AppError(
      `Invalid proposal data: ${validationResult.error.message}`,
    );
  }

  logInfo("Creating Denefits proposal", {
    userId,
    serviceAmount,
    downpaymentAmount,
    proposalType,
  });

  try {
    // Call Denefits API
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add API key to headers if provided
    if (DENEFITS_API_KEY) {
      headers["Authorization"] = `Bearer ${DENEFITS_API_KEY}`;
    }

    const response = await fetch(DENEFITS_API_ENDPOINT, {
      method: "POST",
      headers,
      body: JSON.stringify(validationResult.data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError(
        new Error(
          `Denefits API error: ${response.status} ${response.statusText}`,
        ),
        { errorResponse: errorText },
      );
      throw new AppError(
        `Denefits API request failed: ${response.status} ${response.statusText}`,
      );
    }

    const responseData = await response.json();

    // Validate response with Zod
    const responseValidation =
      DenefitsProposalResponseSchema.safeParse(responseData);
    if (!responseValidation.success) {
      logError(new Error("Denefits response validation failed"), {
        validationError: responseValidation.error.message,
      });
      throw new AppError(
        `Invalid response from Denefits: ${responseValidation.error.message}`,
      );
    }

    const { proposal_id } = responseValidation.data.data;

    logInfo("Denefits proposal created successfully", {
      userId,
      proposal_id,
    });

    // Store proposal in Firestore
    const db = firestoreAdmin();
    const proposalDoc = {
      userId,
      proposalType,
      proposal_id,
      serviceAmount,
      downpaymentAmount,
      serviceName,
      customer_email: user.email,
      customer_first_name: user.firstName,
      customer_last_name: user.lastName,
      customer_mobile: formattedPhone,
      end_date: formattedEndDate,
      next_payment_buffer_days: nextPaymentBufferDays,
      months_array: monthsArray,
      interest_rate: interestRate,
      request: validationResult.data,
      response: responseValidation.data,
      createdAt: new Date(),
      status: "created",
    };

    const docRef = await db.collection(DENEFITS_PROPOSALS).add(proposalDoc);

    logInfo("Denefits proposal stored in Firestore", {
      docId: docRef.id,
      proposal_id,
    });

    return {
      proposal_id,
      stored_doc_id: docRef.id,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logError(new Error("Unexpected error creating Denefits proposal"), {
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    throw new AppError(
      `Failed to create Denefits proposal: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
};
