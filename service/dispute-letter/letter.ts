"use server";

/**
 * Main dispute letter service
 * Handles CRUD operations for dispute letters
 */

import { firestoreAdmin } from "@/lib/fireabase-admin";
import { DISPUTE_LETTER, DISPUTE_TRACKING } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { logError, logInfo } from "@/lib/logger";
import {
  DisputeLetter,
  DisputeLetterStatus,
  DisputeTracking,
} from "@/schema/dispute-letter";
import { Timestamp } from "firebase-admin/firestore";
import {
  sendLetter,
  formatLetterHTML,
  LetterAddress,
} from "@/lib/letterstream";
import AppError from "@/error/AppError";

/**
 * Create a new dispute letter (draft)
 */
export async function createDisputeLetter(
  letter: Omit<DisputeLetter, "id" | "createdAt" | "updatedAt">
): Promise<DisputeLetter> {
  logInfo("Creating dispute letter", {
    userId: letter.userId,
    type: letter.disputeType,
  });

  try {
    const db = firestoreAdmin();
    const collectionRef = db.collection(DISPUTE_LETTER);

    const docRef = await collectionRef.add({
      ...letter,
      status: letter.status || "draft",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as DisputeLetter;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to create dispute letter")
    );
    throw error;
  }
}

/**
 * Get all dispute letters for a user
 */
export async function getDisputeLetters(
  userId: string
): Promise<DisputeLetter[]> {
  try {
    const db = firestoreAdmin();
    const snapshot = await db
      .collection(DISPUTE_LETTER)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...normalizeAllDates(doc.data()),
        } as DisputeLetter)
    );
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to get dispute letters"),
      { userId }
    );
    throw error;
  }
}

/**
 * Get a single dispute letter by ID
 */
export async function getDisputeLetter(
  id: string
): Promise<DisputeLetter | null> {
  try {
    const db = firestoreAdmin();
    const doc = await db.collection(DISPUTE_LETTER).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as DisputeLetter;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to get dispute letter"),
      { id }
    );
    throw error;
  }
}

/**
 * Update a dispute letter
 */
export async function updateDisputeLetter(
  id: string,
  updates: Partial<Omit<DisputeLetter, "id" | "createdAt" | "updatedAt">>
): Promise<DisputeLetter> {
  logInfo("Updating dispute letter", { id });

  try {
    const db = firestoreAdmin();
    const docRef = db.collection(DISPUTE_LETTER).doc(id);

    await docRef.update({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as DisputeLetter;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to update dispute letter"),
      { id }
    );
    throw error;
  }
}

/**
 * Delete a dispute letter (only if draft or pending-review)
 */
export async function deleteDisputeLetter(id: string): Promise<void> {
  logInfo("Deleting dispute letter", { id });

  try {
    const letter = await getDisputeLetter(id);

    if (!letter) {
      throw new AppError("Letter not found");
    }

    if (letter.status !== "draft" && letter.status !== "pending-review") {
      throw new AppError("Cannot delete letter that has been sent");
    }

    const db = firestoreAdmin();
    await db.collection(DISPUTE_LETTER).doc(id).delete();
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to delete dispute letter"),
      { id }
    );
    throw error;
  }
}

/**
 * Submit letter for admin review
 */
export async function submitLetterForReview(
  id: string
): Promise<DisputeLetter> {
  logInfo("Submitting letter for review", { id });

  return await updateDisputeLetter(id, {
    status: "pending-review",
  });
}

/**
 * Approve letter (admin only)
 */
export async function approveDisputeLetter(
  id: string,
  approvedBy: string
): Promise<DisputeLetter> {
  logInfo("Approving dispute letter", { id, approvedBy });

  return await updateDisputeLetter(id, {
    status: "approved",
    approvedBy,
    approvedAt: new Date(),
  });
}

/**
 * Send dispute letter via Letterstream
 */
export async function sendDisputeLetter(id: string): Promise<DisputeLetter> {
  logInfo("Sending dispute letter", { id });

  try {
    const letter = await getDisputeLetter(id);

    if (!letter) {
      throw new AppError("Letter not found");
    }

    if (letter.status !== "approved") {
      throw new AppError("Letter must be approved before sending");
    }

    if (letter.delivery?.letterId) {
      throw new AppError("Letter has already been sent");
    }

    // Format letter content
    const htmlContent = await formatLetterHTML(letter.letterContent, {
      includeDate: true,
      includeSignature: true,
      signatureName: letter.senderAddress.fullName,
    });

    // Send to each recipient
    const deliveryResults = [];

    for (const recipient of letter.recipients) {
      const from: LetterAddress = {
        name: letter.senderAddress.fullName,
        address_line1: letter.senderAddress.addressLine1,
        address_line2: letter.senderAddress.addressLine2,
        city: letter.senderAddress.city,
        state: letter.senderAddress.state,
        postal_code: letter.senderAddress.postalCode,
      };

      const to: LetterAddress = {
        name: recipient.name,
        address_line1: recipient.addressLine1,
        address_line2: recipient.addressLine2,
        city: recipient.city,
        state: recipient.state,
        postal_code: recipient.postalCode,
      };

      const result = await sendLetter({
        html: htmlContent,
        from,
        to,
        description: `${letter.disputeType} - ${letter.letterTitle}`,
        certified: true, // Always send certified for disputes
        return_receipt: true,
        metadata: {
          letterId: id,
          userId: letter.userId,
          disputeType: letter.disputeType,
          recipientType: recipient.recipientType,
        },
      });

      deliveryResults.push(result);
    }

    // Use the first result for primary tracking
    const primaryDelivery = deliveryResults[0];

    // Update letter with delivery info
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + 30); // 30 days follow-up

    const updatedLetter = await updateDisputeLetter(id, {
      status: "sent",
      sentAt: new Date(),
      followUpDate,
      delivery: {
        letterId: primaryDelivery.id,
        status: primaryDelivery.status,
        trackingNumber: primaryDelivery.tracking_number,
        estimatedDeliveryDate: new Date(primaryDelivery.expected_delivery_date),
        cost: primaryDelivery.price,
        sentAt: new Date(primaryDelivery.sent_at || primaryDelivery.created_at),
      },
    });

    // Create dispute tracking records
    await createDisputeTrackingRecords(letter, id);

    logInfo("Letter sent successfully", {
      id,
      letterId: primaryDelivery.id,
      trackingNumber: primaryDelivery.tracking_number,
    });

    return updatedLetter;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to send dispute letter"),
      { id }
    );
    throw error;
  }
}

/**
 * Create dispute tracking records for each bureau
 */
async function createDisputeTrackingRecords(
  letter: DisputeLetter,
  letterId: string
): Promise<void> {
  const db = firestoreAdmin();
  const collectionRef = db.collection(DISPUTE_TRACKING);

  // Get unique bureaus from all disputed accounts
  const bureaus = new Set<string>();
  letter.disputedAccounts.forEach((account) => {
    account.affectedBureaus.forEach((bureau) => bureaus.add(bureau));
  });

  const initialDisputeDate = new Date();
  const responseDeadline = new Date();
  responseDeadline.setDate(responseDeadline.getDate() + 30);

  for (const bureau of bureaus) {
    await collectionRef.add({
      userId: letter.userId,
      letterId,
      bureau,
      status: "letter-sent",
      initialDisputeDate: Timestamp.fromDate(initialDisputeDate),
      responseDeadline: Timestamp.fromDate(responseDeadline),
      notes: [
        {
          note: `Dispute letter sent via certified mail`,
          createdBy: letter.userId,
          createdAt: Timestamp.now(),
        },
      ],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
}

/**
 * Get dispute tracking for a user
 */
export async function getDisputeTracking(
  userId: string
): Promise<DisputeTracking[]> {
  try {
    const db = firestoreAdmin();
    const snapshot = await db
      .collection(DISPUTE_TRACKING)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...normalizeAllDates(doc.data()),
        } as DisputeTracking)
    );
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to get dispute tracking"),
      { userId }
    );
    throw error;
  }
}

/**
 * Update dispute tracking
 */
export async function updateDisputeTracking(
  id: string,
  updates: Partial<Omit<DisputeTracking, "id" | "createdAt" | "updatedAt">>
): Promise<DisputeTracking> {
  logInfo("Updating dispute tracking", { id });

  try {
    const db = firestoreAdmin();
    const docRef = db.collection(DISPUTE_TRACKING).doc(id);

    await docRef.update({
      ...updates,
      updatedAt: Timestamp.now(),
    });

    const doc = await docRef.get();
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as DisputeTracking;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to update dispute tracking"),
      { id }
    );
    throw error;
  }
}

/**
 * Add note to dispute tracking
 */
export async function addDisputeTrackingNote(
  id: string,
  note: string,
  createdBy: string
): Promise<DisputeTracking> {
  const tracking = await getDisputeTrackingById(id);

  if (!tracking) {
    throw new AppError("Dispute tracking not found");
  }

  const updatedNotes = [
    ...(tracking.notes || []),
    {
      note,
      createdBy,
      createdAt: new Date(),
    },
  ];

  return await updateDisputeTracking(id, {
    notes: updatedNotes,
  });
}

/**
 * Get dispute tracking by ID
 */
async function getDisputeTrackingById(
  id: string
): Promise<DisputeTracking | null> {
  try {
    const db = firestoreAdmin();
    const doc = await db.collection(DISPUTE_TRACKING).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as DisputeTracking;
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to get dispute tracking by ID"),
      { id }
    );
    throw error;
  }
}

/**
 * Get all letters pending review (admin)
 */
export async function getLettersPendingReview(): Promise<DisputeLetter[]> {
  try {
    const db = firestoreAdmin();
    const snapshot = await db
      .collection(DISPUTE_LETTER)
      .where("status", "==", "pending-review")
      .orderBy("createdAt", "asc")
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...normalizeAllDates(doc.data()),
        } as DisputeLetter)
    );
  } catch (error) {
    logError(
      error instanceof Error
        ? error
        : new Error("Failed to get letters pending review")
    );
    throw error;
  }
}
