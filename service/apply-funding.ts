"use server";
import {
  USER_COLLECTION,
  USER_FUNDING_APPLICATION,
} from "@/constant/collection-name";
import AppError from "@/error/AppError";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import {
  ApplyFunding,
  ApplyFundingWithUser,
  FundingApplicationApproveDecline,
  FundingApplicationSatus,
} from "@/schema/apply-funding";
import { Timestamp } from "firebase-admin/firestore";
import * as crypto from "node:crypto";
import {
  fundAnalysis,
  generateCRSReport,
  generateCRSReportBusiness,
  getCRSBusinessProfile,
  getCRSReport,
} from "./crs";
import { noteSchema, NoteSchema } from "@/schema/notes";
import { getUserById } from "./user";
import { RegistrationType } from "@/schema/users";

export const applyFunding = async ({
  value,
  registrationType,
}: {
  value: ApplyFunding;
  registrationType?: RegistrationType;
}): Promise<{ referenceNumber: string }> => {
  const userData = await getUserById(value.userId!);
  if (!userData) {
    throw new AppError("User not found");
  }

  logInfo("applyFunding::userData", userData);
  logInfo("applyFunding::registrationType", { registrationType });

  const db = firestoreAdmin();

  const collectionRef = db.collection(USER_FUNDING_APPLICATION);

  const { id: referenceNumber } = await createReferenceId();

  // Exclude document arrays from Firestore save (they should be uploaded to storage separately)
  const { bankStatements, driverLicenseDocuments, ...fundingDataToSave } =
    value;

  const docRef = collectionRef.doc(referenceNumber);
  await docRef.set({ ...fundingDataToSave });

  // Upload documents to Firebase Storage
  if (bankStatements || driverLicenseDocuments) {
    const bucket = storageAdmin();

    // Upload bank statements
    if (bankStatements && bankStatements.length > 0) {
      for (const doc of bankStatements) {
        try {
          // Extract base64 data (remove data:application/pdf;base64, prefix)
          const base64Data = doc.base64.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `BANK_STATEMENTS_${doc.name}`;
          const filePath = `documents/${value.userId}/${fileName}`;

          const file = bucket.file(filePath);
          await file.save(buffer, {
            contentType: doc.type,
            metadata: {
              uploadedAt: new Date().toISOString(),
              originalName: doc.name,
            },
          });
        } catch (error) {
          console.error("Error uploading bank statement:", error);
          // Continue with other documents even if one fails
        }
      }
    }

    // Upload driver licenses
    if (driverLicenseDocuments && driverLicenseDocuments.length > 0) {
      for (const doc of driverLicenseDocuments) {
        try {
          // Extract base64 data (remove data:image/... or data:application/pdf;base64, prefix)
          const base64Data = doc.base64.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `DRIVERS_LICENSE_${doc.name}`;
          const filePath = `documents/${value.userId}/${fileName}`;

          const file = bucket.file(filePath);
          await file.save(buffer, {
            contentType: doc.type,
            metadata: {
              uploadedAt: new Date().toISOString(),
              originalName: doc.name,
            },
          });
        } catch (error) {
          console.error("Error uploading driver license:", error);
          // Continue with other documents even if one fails
        }
      }
    }
  }

  // we do not generate CRS report when client is registering themselves,
  // only for broker/admin created clients
  if (registrationType === "Self") {
    logInfo("Skipping CRS report generation for self-registered user.");
    return { referenceNumber };
  }

  // check if user alreay has generated CRS report
  const data = await getCRSReport(value.userId!);

  if (!data || data.length === 0) {
    await generateCRSReport({
      userId: value.userId!,
      referenceNumber,
      bureaus: { equifax: true, experian: true, transunion: true },
    });
  }

  if (userData.isPremiumClient === true && value.businessId) {
    const businessData = await getCRSBusinessProfile(value.businessId);
    if (!businessData) {
      await generateCRSReportBusiness(
        value.userId!,
        referenceNumber,
        value.businessId
      );
    }
  }

  await fundAnalysis({ referenceNumber, userId: value.userId! });

  return { referenceNumber };
};

export const getApplyFunding = async (
  userId: string
): Promise<ApplyFunding[] | null> => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(USER_FUNDING_APPLICATION)
    .where("userId", "==", userId);
  const snapshot = await collectionRef.orderBy("appliedDate", "desc").get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }
  return snapshot.docs.map((doc) => ({
    referenceNumber: doc.id,
    ...normalizeAllDates(doc.data()),
  }));
};

type Props = {
  state?: string;
  status?: FundingApplicationSatus;
  userId?: string;
};

export const getFundingApplications = async ({
  state,
  status,
  userId,
}: Props): Promise<ApplyFundingWithUser[] | null> => {
  const db = firestoreAdmin();
  let collectionRef = db
    .collection(USER_FUNDING_APPLICATION)
    .orderBy("appliedDate", "desc");

  if (userId) {
    collectionRef = collectionRef.where("userId", "==", userId);
  }

  if (state) {
    collectionRef = collectionRef.where("addressState", "==", state);
  }

  if (status) {
    collectionRef = collectionRef.where("status", "==", status);
  }
  const snapshot = await collectionRef.get();
  if (snapshot.empty) {
    console.log("No matching documents.");
    return null;
  }

  // get all users
  const usersSnap = await db.collection(USER_COLLECTION).get();
  if (usersSnap.empty) {
    console.log("No matching documents.");
    return null;
  }

  const usersMap: Record<string, any> = {};
  usersSnap.forEach((doc) => {
    usersMap[doc.id] = {
      userId: doc.id,
      ...normalizeAllDates(doc.data()),
    };
  });

  let results = snapshot.docs.map((doc) => {
    const data = normalizeAllDates(doc.data());
    const userId = data.userId;
    return {
      referenceNumber: doc.id,
      ...data,
      user: usersMap[userId] ?? null,
    };
  });

  // remove results with user == null
  results = results.filter((result) => result.user !== null);

  return results;
};

export const getApplyFundingByReferenceNumber = async ({
  referenceNumber,
}: {
  referenceNumber: string;
}): Promise<ApplyFunding | null> => {
  if (!referenceNumber) {
    throw new AppError("Reference number is required.");
  }
  const db = firestoreAdmin();
  const doc = await db
    .collection(USER_FUNDING_APPLICATION)
    .doc(referenceNumber)
    .get();
  if (!doc.exists) return null;
  return {
    id: doc.id,
    referenceNumber: doc.id,
    ...normalizeAllDates(doc.data()),
  };
};

export const deleteApplyFunding = async (
  referenceNumber: string
): Promise<void> => {
  if (!referenceNumber) {
    throw new AppError("Reference number is required.");
  }

  const data = await getApplyFundingByReferenceNumber({ referenceNumber });
  if (!data) {
    throw new AppError("Funding application not found.");
  }

  if (data.status !== "New") {
    throw new AppError("Funding application cannot be deleted.");
  }

  const db = firestoreAdmin();
  const appRef = db.collection(USER_FUNDING_APPLICATION).doc(referenceNumber);
  await db.recursiveDelete(appRef);

  // delete the storage
  const storage = storageAdmin();
  try {
    await storage.deleteFiles({
      prefix: `documents/${data.userId}/${referenceNumber}`,
    });
  } catch (error: any) {
    console.error("unlinkPlaidItem::error", error);
    logError(error, { userId: data.userId, referenceNumber });
  }
};

export async function createReferenceId(): Promise<{
  id: string;
  path: string;
}> {
  const db = firestoreAdmin();
  const collection = USER_FUNDING_APPLICATION;
  const maxAttempts = 50;

  for (let i = 0; i < maxAttempts; i++) {
    const candidate = buildRef("FUNDING"); // e.g., FUNDING-20250901-7KM3Z9QX
    const ref = db.collection(collection).doc(candidate);
    try {
      await ref.create({ createdAt: Timestamp.now() }); // atomic "insert if not exists"
      return { id: candidate, path: ref.path };
    } catch (e: any) {
      if (
        (e?.code === 6 || e?.code === "already-exists") &&
        i < maxAttempts - 1
      )
        continue;
      throw e;
    }
  }
  throw new Error("Failed to create unique reference id.");
}

/** Build IDs like: REF-YYYYMMDD-XXXXXXXX (no O/0/1/I/L to avoid confusion) */
function buildRef(prefix: string) {
  const d = new Date();
  const date =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  return `${prefix}-${date}-${randomString(8)}`; // e.g., FUNDING-20250901-7KM3Z9QX
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomString(length: number) {
  const bytes = new Uint8Array(length);
  // Modern Node (18+) and browsers expose Web Crypto:
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    // Node fallback if needed
    const { randomBytes } = crypto;
    const buf: Buffer = randomBytes(length);
    for (let i = 0; i < length; i++) bytes[i] = buf[i];
  }
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export const updateApplicationStatus = async (
  referenceNumber: string,
  status: FundingApplicationSatus,
  approveOrDeclineValue?: FundingApplicationApproveDecline
) => {
  logInfo("updateApplicationStatus", { referenceNumber, status });

  const data = await getApplyFundingByReferenceNumber({ referenceNumber });
  if (!data) throw new AppError("Funding application not found.");

  const db = firestoreAdmin();
  const appRef = db.collection(USER_FUNDING_APPLICATION).doc(referenceNumber);
  await appRef.update({ status, approveOrDecline: approveOrDeclineValue });
};

export const addFundApplicationNotes = async ({
  referenceNumber,
  notes,
}: {
  referenceNumber: string;
  notes: string[];
}) => {
  console.log("addFundApplicationNotes", { referenceNumber, notes });
  if (!referenceNumber) throw new AppError("Reference number is required.");
  if (!notes) throw new AppError("Notes is required.");

  const fundApplicationData = await getApplyFundingByReferenceNumber({
    referenceNumber,
  });
  if (!fundApplicationData)
    throw new AppError("Funding application not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/notes`
  );
  const docRef = collectionRef.doc(referenceNumber);
  await docRef.set({ notes });
};

export const getFundApplicationNotes = async (
  referenceNumber: string
): Promise<string[]> => {
  if (!referenceNumber) throw new AppError("Reference number is required.");

  const fundApplicationData = await getApplyFundingByReferenceNumber({
    referenceNumber,
  });
  if (!fundApplicationData)
    throw new AppError("Funding application not found.");

  const db = firestoreAdmin();
  const collectionRef = db.collection(
    `${USER_FUNDING_APPLICATION}/${referenceNumber}/notes`
  );
  const docRef = collectionRef.doc(referenceNumber);
  const doc = await docRef.get();
  if (!doc.exists) return [];
  return doc.data()?.notes ?? [];
};

const NOTE_COLLECTION = "internalNotes";
const NOTE_DOC_ID = "main";

export const getFundApplicationNote = async (
  referenceNumber: string
): Promise<NoteSchema> => {
  if (!referenceNumber) {
    throw new AppError("Reference number is required.");
  }

  const db = firestoreAdmin();
  const docRef = db
    .collection(USER_FUNDING_APPLICATION)
    .doc(referenceNumber)
    .collection(NOTE_COLLECTION)
    .doc(NOTE_DOC_ID);

  const docSnap = await docRef.get();

  if (!docSnap.exists) {
    // Return a default empty state if the note document hasn't been created yet
    return { description: "", comments: [] };
  }

  const data = docSnap.data();

  // Convert Firestore Timestamps back to JS Date objects for the client
  const commentsWithDates = (data?.comments || []).map((comment: any) => ({
    ...comment,
    createdAt: comment.createdAt.toDate(),
  }));

  return {
    description: data?.description || "",
    comments: commentsWithDates,
  };
};

/**
 * Creates or overwrites the entire note document for a given application.
 * This is an atomic operation.
 */
export const updateFundApplicationNote = async ({
  referenceNumber,
  note,
}: {
  referenceNumber: string;
  note: NoteSchema;
}) => {
  if (!referenceNumber) {
    throw new AppError("Reference number is required.");
  }

  // Validate the incoming data against our schema
  const validationResult = noteSchema.safeParse(note);
  if (!validationResult.success) {
    throw new AppError(validationResult.error.message);
  }
  const validatedNote = validationResult.data;

  const db = firestoreAdmin();
  const docRef = db
    .collection(USER_FUNDING_APPLICATION)
    .doc(referenceNumber)
    .collection(NOTE_COLLECTION)
    .doc(NOTE_DOC_ID);

  // Firebase Admin SDK automatically converts JS Date objects to Timestamps
  await docRef.set(validatedNote);

  console.log(`Note updated for application: ${referenceNumber}`);
};

export const updateApplyFunding = async ({
  value,
}: {
  value: ApplyFunding;
}) => {
  const db = firestoreAdmin();

  if (!value.referenceNumber) {
    throw new AppError("Reference number is required for update.");
  }

  const collectionRef = db.collection(USER_FUNDING_APPLICATION);
  const docRef = collectionRef.doc(value.referenceNumber);

  // Check if document exists
  const doc = await docRef.get();
  if (!doc.exists) {
    throw new AppError("Funding application not found.");
  }

  // Exclude document arrays from Firestore save (they should be uploaded to storage separately)
  const { bankStatements, driverLicenseDocuments, ...fundingDataToSave } =
    value;

  await docRef.set({ ...fundingDataToSave }, { merge: true });

  // Upload documents to Firebase Storage
  if (bankStatements || driverLicenseDocuments) {
    const bucket = storageAdmin();

    // Upload bank statements
    if (bankStatements && bankStatements.length > 0) {
      for (const doc of bankStatements) {
        try {
          // Extract base64 data (remove data:application/pdf;base64, prefix)
          const base64Data = doc.base64.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `BANK_STATEMENTS_${doc.name}`;
          const filePath = `documents/${value.userId}/${fileName}`;

          const file = bucket.file(filePath);
          await file.save(buffer, {
            contentType: doc.type,
            metadata: {
              uploadedAt: new Date().toISOString(),
              originalName: doc.name,
            },
          });
        } catch (error) {
          console.error("Error uploading bank statement:", error);
          // Continue with other documents even if one fails
        }
      }
    }

    // Upload driver licenses
    if (driverLicenseDocuments && driverLicenseDocuments.length > 0) {
      for (const doc of driverLicenseDocuments) {
        try {
          // Extract base64 data (remove data:image/... or data:application/pdf;base64, prefix)
          const base64Data = doc.base64.split(",")[1];
          const buffer = Buffer.from(base64Data, "base64");
          const fileName = `DRIVERS_LICENSE_${doc.name}`;
          const filePath = `documents/${value.userId}/${fileName}`;

          const file = bucket.file(filePath);
          await file.save(buffer, {
            contentType: doc.type,
            metadata: {
              uploadedAt: new Date().toISOString(),
              originalName: doc.name,
            },
          });
        } catch (error) {
          console.error("Error uploading driver license:", error);
          // Continue with other documents even if one fails
        }
      }
    }
  }
};
