import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  BROKER_COLLECTION,
  BROKER_INVITATION,
  BROKER_CLIENT_MAPPING,
  BROKER_COMMISSION,
  USER_FUNDING_APPLICATION,
  USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED,
  BANK_PRODUCTS_COLLECTION,
  USER_COLLECTION,
} from "@/constant/collection-name";
import {
  BrokerRegistration,
  BrokerInvitation,
  BrokerClientMapping,
  BrokerCommission,
  BrokerStatistics,
} from "@/schema/broker";
import crypto from "crypto";
import { normalizeAllDates } from "@/lib/date-parser";
import { ApprovedBankFormData } from "@/schema/bank-products";

const db = firestoreAdmin();

// Generate unique referral code
export const generateReferralCode = async (): Promise<string> => {
  const code = crypto.randomBytes(4).toString("hex").toUpperCase();
  // Check if code already exists
  const existing = await db
    .collection(BROKER_COLLECTION)
    .where("referralCode", "==", code)
    .get();

  if (!existing.empty) {
    return generateReferralCode(); // Recursively generate new code
  }

  return code;
};

// Create broker invitation
export const createBrokerInvitation = async (
  email: string,
  invitedBy: string,
  invitedByName: string
): Promise<string> => {
  // Check if invitation already exists for this email
  const existingInvitations = await db
    .collection(BROKER_INVITATION)
    .where("email", "==", email)
    .where("status", "==", "Pending")
    .get();

  if (!existingInvitations.empty) {
    throw new Error("Active invitation already exists for this email");
  }

  // Check if user already exists as broker
  const existingBroker = await db
    .collection(BROKER_COLLECTION)
    .where("email", "==", email)
    .get();

  if (!existingBroker.empty) {
    throw new Error("Broker with this email already exists");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const invitation: BrokerInvitation = {
    email,
    invitedBy,
    invitedByName,
    token,
    status: "Pending",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  };

  const docRef = await db.collection(BROKER_INVITATION).add(invitation);
  return token;
};

// Get broker invitation by token
export const getBrokerInvitationByToken = async (
  token: string
): Promise<(BrokerInvitation & { id: string }) | null> => {
  const snapshot = await db
    .collection(BROKER_INVITATION)
    .where("token", "==", token)
    .where("status", "==", "Pending")
    .get();

  if (snapshot.empty) {
    console.log("Invalid token or expired token");
    return null;
  }

  const doc = snapshot.docs[0];
  const data = normalizeAllDates(doc.data()) as BrokerInvitation;

  // Check if expired
  if (data.expiresAt < new Date()) {
    await doc.ref.update({ status: "Expired" });
    return null;
  }

  return { ...data, id: doc.id };
};

// Accept broker invitation
export const acceptBrokerInvitation = async (token: string): Promise<void> => {
  const invitation = await getBrokerInvitationByToken(token);
  if (!invitation) {
    throw new Error("Invalid or expired invitation");
  }

  await db.collection(BROKER_INVITATION).doc(invitation.id).update({
    status: "Accepted",
    acceptedAt: new Date(),
  });
};

// Create broker profile
export const createBroker = async (
  brokerId: string,
  data: BrokerRegistration
): Promise<void> => {
  const referralCode = await generateReferralCode();
  await db
    .collection(BROKER_COLLECTION)
    .doc(brokerId)
    .set({
      ...data,
      referralCode,
      registrationDate: new Date(),
    });
};

// Get broker by ID
export const getBrokerById = async (
  brokerId: string
): Promise<BrokerRegistration | null> => {
  const doc = await db.collection(BROKER_COLLECTION).doc(brokerId).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as BrokerRegistration;
};

// Link client to broker
export const linkClientToBroker = async ({
  brokerId,
  clientId,
  clientEmail,
  clientName,
  createdBy = "Broker",
}: {
  brokerId: string;
  clientId: string;
  clientEmail: string;
  clientName: string;
  createdBy: "Broker" | "Client";
}): Promise<void> => {
  // Check if mapping already exists
  const existingMapping = await db
    .collection(BROKER_CLIENT_MAPPING)
    .where("brokerId", "==", brokerId)
    .where("clientId", "==", clientId)
    .get();

  if (!existingMapping.empty) {
    return; // Already linked
  }

  const mapping: BrokerClientMapping = {
    brokerId,
    clientId,
    clientEmail,
    clientName,
    createdAt: new Date(),
    createdBy,
    status: "Active",
  };

  await db.collection(BROKER_CLIENT_MAPPING).add(mapping);
};

// Get broker's clients
export const getBrokerClients = async (
  brokerId: string
): Promise<BrokerClientMapping[]> => {
  const snapshot = await db
    .collection(BROKER_CLIENT_MAPPING)
    .where("brokerId", "==", brokerId)
    .where("status", "==", "Active")
    .orderBy("createdAt", "desc")
    .get();

  // Join with user collection to get latest client data
  const clientsWithUserData = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const mappingData = normalizeAllDates(doc.data()) as BrokerClientMapping;

      // Fetch user data
      const userDoc = await db
        .collection(USER_COLLECTION)
        .doc(mappingData.clientId)
        .get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        // Update with latest user data
        return {
          ...mappingData,
          clientEmail: userData?.email || mappingData.clientEmail,
          clientName:
            `${userData?.firstName || ""} ${userData?.lastName || ""}`.trim() ||
            mappingData.clientName,
          clientActiveStatus: userData?.activeStatus as
            | "Active"
            | "InActive"
            | "Paused"
            | undefined,
        };
      }

      return mappingData;
    })
  );

  return clientsWithUserData;
};

// Create commission record
export const createCommission = async (
  data: Omit<BrokerCommission, "createdAt">
): Promise<void> => {
  const commission: BrokerCommission = {
    ...data,
    createdAt: new Date(),
  };

  await db.collection(BROKER_COMMISSION).add(commission);
};

// Get broker commissions
export const getBrokerCommissions = async (
  brokerId: string,
  status?: "Pending" | "Approved" | "Paid"
): Promise<BrokerCommission[]> => {
  let query = db
    .collection(BROKER_COMMISSION)
    .where("brokerId", "==", brokerId);

  if (status) {
    query = query.where("status", "==", status);
  }

  const snapshot = await query.orderBy("createdAt", "desc").get();

  return snapshot.docs.map((doc) => doc.data() as BrokerCommission);
};

// Get broker statistics
export const getBrokerStatistics = async (
  brokerId: string
): Promise<BrokerStatistics> => {
  const clients = await getBrokerClients(brokerId);
  const clientIds = clients.map((c) => c.clientId);

  let totalSubmittedApplications = 0;
  let totalApprovedApplications = 0;
  let totalRejectedApplications = 0;
  let totalFundedAmount = 0;
  let notAppliedCount = 0;
  let sentToLenderCount = 0;
  let declinedCount = 0;
  let approvedCount = 0;
  let fundedCount = 0;

  if (clientIds.length > 0) {
    // Process in batches to handle Firestore 'in' query limit of 10
    for (let i = 0; i < clientIds.length; i += 10) {
      const batch = clientIds.slice(i, i + 10);
      const applications = await db
        .collection(USER_FUNDING_APPLICATION)
        .where("userId", "in", batch)
        .get();

      // For each application, get the fund mappings
      for (const appDoc of applications.docs) {
        const referenceNumber = appDoc.id;
        const fundMappingsSnapshot = await db
          .collection(USER_FUNDING_APPLICATION)
          .doc(referenceNumber)
          .collection(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED)
          .get();

        fundMappingsSnapshot.docs.forEach((mappingDoc) => {
          const mappingData = normalizeAllDates(
            mappingDoc.data()
          ) as ApprovedBankFormData;
          const status = mappingData.clientApplicationStatus;

          totalSubmittedApplications++;

          // Count by status
          if (status === "Not Applied") notAppliedCount++;
          else if (status === "Sent to Lender") sentToLenderCount++;
          else if (status === "Declined") declinedCount++;
          else if (status === "Approved") approvedCount++;
          else if (status === "Funded") fundedCount++;

          // Legacy counts
          if (status === "Approved" || status === "Funded") {
            totalApprovedApplications++;
          }

          if (status === "Declined") {
            totalRejectedApplications++;
          }

          if (status === "Funded" && mappingData.fundedAmount) {
            totalFundedAmount += mappingData.fundedAmount;
          }
        });
      }
    }
  }

  // Get commission data
  const commissions = await getBrokerCommissions(brokerId);

  const totalCommissionEarned = commissions.reduce(
    (sum, c) => sum + c.commissionAmount,
    0
  );
  const totalCommissionPending = commissions
    .filter((c) => c.status === "Pending")
    .reduce((sum, c) => sum + c.commissionAmount, 0);
  const totalCommissionPaid = commissions
    .filter((c) => c.status === "Paid")
    .reduce((sum, c) => sum + c.commissionAmount, 0);

  return {
    totalClients: clients.length,
    totalSubmittedApplications,
    totalApprovedApplications,
    totalRejectedApplications,
    totalFundedAmount,
    totalCommissionEarned,
    totalCommissionPending,
    totalCommissionPaid,
    notAppliedCount,
    sentToLenderCount,
    declinedCount,
    approvedCount,
    fundedCount,
  };
};

// Get all invitations (admin view)
export const getAllBrokerInvitations = async (): Promise<
  (BrokerInvitation & { id: string })[]
> => {
  const snapshot = await db
    .collection(BROKER_INVITATION)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as BrokerInvitation),
    id: doc.id,
  }));
};

// Get all brokers (admin view)
export const getAllBrokers = async (): Promise<
  (BrokerRegistration & { id: string })[]
> => {
  const snapshot = await db
    .collection(USER_COLLECTION)
    .where("role", "==", "Broker")
    // .orderBy("registrationDate", "desc")
    .get();

  return snapshot.docs.map((doc) => ({
    ...(normalizeAllDates(doc.data()) as BrokerRegistration),
    id: doc.id,
  }));
};

// Update broker status
export const updateBrokerStatus = async ({
  id,
  status,
}: {
  id: string;
  status: "Active" | "InActive" | "Paused";
}): Promise<void> => {
  const brokerRef = db.collection(USER_COLLECTION).doc(id);
  const brokerDoc = await brokerRef.get();

  if (!brokerDoc.exists) {
    throw new Error("Broker not found");
  }

  // Verify it's actually a broker
  const brokerData = brokerDoc.data();
  if (brokerData?.role !== "Broker") {
    throw new Error("User is not a broker");
  }

  await brokerRef.update({ activeStatus: status });
};

// Get all mapped funding products for broker's clients
export const getBrokerClientsMappedFunding = async (
  brokerId: string
): Promise<ApprovedBankFormData[]> => {
  // First, get all clients for this broker
  const clients = await getBrokerClients(brokerId);
  const clientIds = clients.map((c) => c.clientId);

  if (clientIds.length === 0) {
    return [];
  }
  const results: ApprovedBankFormData[] = [];

  // Process in batches of 10 (Firestore 'in' query limit)
  for (let i = 0; i < clientIds.length; i += 10) {
    const batch = clientIds.slice(i, i + 10);
    // Step 1: Get all funding applications for these clients
    const fundingApplicationsSnapshot = await db
      .collection(USER_FUNDING_APPLICATION)
      .where("userId", "in", batch)
      .get();

    // Step 2: For each funding application, get the fund mappings
    for (const appDoc of fundingApplicationsSnapshot.docs) {
      const appData = normalizeAllDates(appDoc.data());
      const referenceNumber = appDoc.id;

      if (!referenceNumber) continue;

      // Query the subcollection for fund mappings
      const fundMappingsSnapshot = await db
        .collection(USER_FUNDING_APPLICATION)
        .doc(referenceNumber)
        .collection(USER_FUNDING_APPLICATION_FUND_MAPPING_APPROVED)
        .get();

      // Step 3: Process each fund mapping
      for (const mappingDoc of fundMappingsSnapshot.docs) {
        const mappingData = normalizeAllDates(mappingDoc.data());

        // Only include if it's approved (isApproved = true)
        // if (!mappingData.isApproved) continue;

        // Fetch the bank product details
        const bankProductSnapshot = await db
          .collection(BANK_PRODUCTS_COLLECTION)
          .doc(mappingData.bankProductId)
          .get();

        if (!bankProductSnapshot.exists) continue;

        const bankProduct = normalizeAllDates(bankProductSnapshot.data());

        // Fetch user details to get client name
        const userSnapshot = await db
          .collection(USER_COLLECTION)
          .doc(appData.userId)
          .get();

        const userData = userSnapshot.exists ? userSnapshot.data() : null;
        const clientName = userData
          ? `${userData.firstName || ""} ${userData.lastName || ""}`.trim()
          : "Unknown Client";

        // Fetch commission data if status is Funded
        let commissionRate: number | undefined;
        let commissionAmount: number | undefined;

        if (mappingData.clientApplicationStatus === "Funded") {
          // Match by fundMappingApprovedId to ensure we get the correct commission
          // for this specific bank product, even if multiple products are funded
          // under the same reference number
          const commissionSnapshot = await db
            .collection(BROKER_COMMISSION)
            .where("fundMappingApprovedId", "==", mappingDoc.id)
            .limit(1)
            .get();

          if (!commissionSnapshot.empty) {
            const commissionData = commissionSnapshot.docs[0].data();
            commissionRate = commissionData.commissionRate;
            commissionAmount = commissionData.commissionAmount;
          }
        }

        // Combine the data
        const mappedFund: ApprovedBankFormData = {
          ...bankProduct,
          fundMappingApprovedId: mappingDoc.id,
          clientApplicationStatus:
            mappingData.clientApplicationStatus || "Not Applied",
          adminApprovedStatus: mappingData.adminApprovedStatus,
          referenceNumber: referenceNumber,
          approvedAmount: mappingData.approvedAmount,
          approvedRemarks: mappingData.approvedRemarks,
          declineReason: mappingData.declineReason,
          fundedAmount: mappingData.fundedAmount,
          fundedRemarks: mappingData.fundedRemarks,
          userId: appData.userId,
          personalAmountFunding: appData.personalAmountFunding,
          businessAmountFunding: appData.businessAmountFunding,
          // Add client name and email for broker's view
          clientName,
          clientEmail: userData?.email || "",
          // Add commission data
          commissionRate,
          commissionAmount,
        } as any;

        results.push(mappedFund);
      }
    }
  }

  return results;
};
