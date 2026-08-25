"use server";

import {
  COURSE,
  USER_COLLECTION,
  USER_COURSE_ENROLLMENT,
  USER_LUMINO_PAYMENTS,
  LUMINO_WEBHOOK_EVENTS,
} from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { logError, logInfo } from "@/lib/logger";
import { LuminoZapierWebhookPayload } from "@/schema/lumino-webhook";
import { Timestamp } from "firebase-admin/firestore";
import * as crypto from "node:crypto";
import { getCourseById } from "@/service/educational-materials/course";
import { getUserRecordByEmail } from "@/service/user";
import { Course } from "@/schema/educational-materials/course";

export interface LuminoWebhookResult {
  success: boolean;
  duplicate: boolean;
  enrolled: boolean;
  userId?: string;
  courseId?: string | null;
  enrolledCourseIds?: string[];
  paymentId: string;
  status: string;
  message: string;
}

/**
 * Validates the Authorization: Bearer token against LUMINO_ZAPIER_WEBHOOK_SECRET.
 * Uses a constant-time comparison to prevent timing attacks.
 */
export const validateLuminoWebhookAuth = async (
  authHeader: string | null | undefined,
): Promise<boolean> => {
  const secret = process.env.LUMINO_ZAPIER_WEBHOOK_SECRET;
  if (!secret) {
    logError(
      new Error(
        "LUMINO_ZAPIER_WEBHOOK_SECRET is not configured in environment",
      ),
    );
    return false;
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }

  const token = authHeader.slice(7).trim();
  if (!token) return false;

  const secretBuffer = Buffer.from(secret);
  const tokenBuffer = Buffer.from(token);

  if (secretBuffer.length !== tokenBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(secretBuffer, tokenBuffer);
};

/**
 * Finds a client user record in Firestore by normalized email address.
 */
export const findClientByEmail = async (
  email: string,
): Promise<{ id: string; [key: string]: any } | null> => {
  const db = firestoreAdmin();
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Direct search in Firestore 'user' collection
  const querySnapshot = await db
    .collection(USER_COLLECTION)
    .where("email", "==", normalizedEmail)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return { id: doc.id, ...normalizeAllDates(doc.data()) };
  }

  // 2. Fallback: Lookup in Firebase Auth and find by auth UID
  try {
    const authUser = await getUserRecordByEmail(normalizedEmail);
    if (authUser?.uid) {
      const userDoc = await db
        .collection(USER_COLLECTION)
        .doc(authUser.uid)
        .get();
      if (userDoc.exists) {
        return { id: userDoc.id, ...normalizeAllDates(userDoc.data()) };
      }
      return { id: authUser.uid, email: normalizedEmail };
    }
  } catch (error) {
    logError(
      new Error(
        `Failed to lookup auth user by email ${normalizedEmail}: ${error}`,
      ),
    );
  }

  return null;
};

/**
 * Sanitizes and parses a payment amount from string/number format (e.g. "$1,139.84" -> 1139.84).
 */
export const parsePaymentAmountNumber = async (
  rawAmount: string | number | null | undefined,
): Promise<number | null> => {
  if (typeof rawAmount === "number") {
    return isNaN(rawAmount) ? null : rawAmount;
  }
  if (!rawAmount || typeof rawAmount !== "string") {
    return null;
  }
  const sanitized = rawAmount.replace(/[^0-9.-]/g, "").trim();
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Resolves the target published course(s) to enroll the client in.
 * 1. If courseId is explicitly provided, it resolves that single course.
 * 2. If paymentAmount is provided, it matches published courses whose price or discountPrice matches the paid amount.
 * 3. Otherwise, it resolves published courses configured with a Lumino checkout URL.
 */
export const resolveTargetCourses = async ({
  courseId,
  paymentAmount,
}: {
  courseId?: string | null;
  paymentAmount?: string | number | null;
}): Promise<Course[]> => {
  const db = firestoreAdmin();

  if (courseId) {
    const course = await getCourseById(courseId);
    if (!course) {
      const errorMsg = `Course not found for courseId: ${courseId}`;
      logError(new Error(errorMsg));
      const error: any = new Error(errorMsg);
      error.statusCode = 404;
      throw error;
    }
    if (!course.isPublished) {
      const errorMsg = `Course '${course.title || courseId}' is not published`;
      logError(new Error(errorMsg));
      const error: any = new Error(errorMsg);
      error.statusCode = 422;
      throw error;
    }
    return [course];
  }

  // Fetch all published courses from Firestore
  const publishedSnapshot = await db
    .collection(COURSE)
    .where("isPublished", "==", true)
    .get();

  if (publishedSnapshot.empty) {
    const errorMsg = "No published courses found for enrollment.";
    logError(new Error(errorMsg));
    const error: any = new Error(errorMsg);
    error.statusCode = 404;
    throw error;
  }

  const publishedCourses: Course[] = publishedSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  })) as Course[];

  const numericPaidAmount = await parsePaymentAmountNumber(paymentAmount);

  // Match by paid amount against course price / discount price
  if (numericPaidAmount !== null) {
    const matchingCourses = publishedCourses.filter((c) => {
      const price = c.price ?? 0;
      const discountPrice = c.discountPrice;
      const effectivePrice =
        discountPrice != null && discountPrice >= 0 ? discountPrice : price;

      const paidCents = Math.round(numericPaidAmount * 100);
      const effectiveCents = Math.round(effectivePrice * 100);
      const standardCents = Math.round(price * 100);
      const discountCents =
        discountPrice != null ? Math.round(discountPrice * 100) : null;

      return (
        paidCents === effectiveCents ||
        paidCents === standardCents ||
        paidCents === discountCents
      );
    });

    if (matchingCourses.length > 0) {
      return matchingCourses;
    }

    const errorMsg = `No published course found matching the paid amount of $${numericPaidAmount.toFixed(2)}`;
    logError(new Error(errorMsg));
    const error: any = new Error(errorMsg);
    error.statusCode = 404;
    throw error;
  }

  // Fallback: match courses with luminoCheckoutUrl
  const luminoCourses = publishedCourses.filter((c) =>
    Boolean(c.luminoCheckoutUrl),
  );

  return luminoCourses.length > 0 ? luminoCourses : publishedCourses;
};

/**
 * Processes a verified Lumino payment webhook sent via Zapier.
 * Ensures atomicity, deduplication by paymentId, course resolution,
 * and user enrollment.
 */
export const processLuminoZapierWebhook = async (
  payload: LuminoZapierWebhookPayload,
): Promise<LuminoWebhookResult> => {
  const db = firestoreAdmin();
  const normalizedStatus = payload.paymentStatus.trim().toLowerCase();

  // 1. Record raw webhook receipt for audit & debugging
  try {
    await db.collection(LUMINO_WEBHOOK_EVENTS).add({
      ...payload,
      receivedAt: Timestamp.now(),
    });
  } catch (err) {
    logError(new Error(`Failed to record raw Lumino webhook event: ${err}`));
  }

  // 2. If status is not Succeeded, ignore without enrolling
  if (normalizedStatus !== "succeeded") {
    logInfo("Ignoring non-succeeded Lumino payment status", {
      paymentId: payload.paymentId,
      status: payload.paymentStatus,
      email: payload.customerEmail,
    });
    return {
      success: true,
      duplicate: false,
      enrolled: false,
      paymentId: payload.paymentId,
      status: payload.paymentStatus,
      message: `Payment status is '${payload.paymentStatus}'. No enrollment performed.`,
    };
  }

  // 3. Resolve user by email
  const user = await findClientByEmail(payload.customerEmail);
  if (!user || !user.id) {
    const errorMsg = `Client not found for email: ${payload.customerEmail}`;
    logError(new Error(errorMsg));
    const error: any = new Error(errorMsg);
    error.statusCode = 404;
    throw error;
  }

  // 4. Resolve target course(s) by courseId or matching paymentAmount against course price
  const targetCourses = await resolveTargetCourses({
    courseId: payload.courseId,
    paymentAmount: payload.paymentAmount,
  });
  const targetCourseIds = targetCourses
    .map((c) => c.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);

  // 5. Execute atomic transaction to claim payment and enroll student
  let wasAlreadyProcessed = false;
  const newlyEnrolledCourseIds: string[] = [];

  await db.runTransaction(async (transaction) => {
    // Check for payment idempotency
    const paymentRef = db
      .collection(USER_LUMINO_PAYMENTS)
      .doc(payload.paymentId);
    const paymentDoc = await transaction.get(paymentRef);

    if (paymentDoc.exists) {
      wasAlreadyProcessed = true;
      return;
    }

    // Record the payment
    transaction.set(paymentRef, {
      paymentId: payload.paymentId,
      userId: user.id,
      customerEmail: payload.customerEmail.toLowerCase().trim(),
      customerName: payload.customerName || null,
      courseId: payload.courseId || targetCourseIds[0] || null,
      enrolledCourseIds: targetCourseIds,
      courseTitle: targetCourses.map((c) => c.title).join(", ") || "",
      amount: payload.paymentAmount ?? null,
      currency: payload.paymentCurrency ?? "USD",
      paymentMethod: payload.paymentMethod ?? null,
      paymentCreatedAt: payload.paymentCreatedAt ?? null,
      paymentStatus: "Succeeded",
      provider: "lumino_zapier",
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Check existing enrollments for each target course
    for (const course of targetCourses) {
      if (!course.id) continue;
      const courseId = course.id;

      const enrollmentQuery = db
        .collection(USER_COURSE_ENROLLMENT)
        .where("userId", "==", user.id)
        .where("courseId", "==", courseId)
        .limit(1);

      const enrollmentSnapshot = await transaction.get(enrollmentQuery);

      if (enrollmentSnapshot.empty) {
        newlyEnrolledCourseIds.push(courseId);
        const newEnrollmentRef = db.collection(USER_COURSE_ENROLLMENT).doc();
        transaction.set(newEnrollmentRef, {
          userId: user.id,
          courseId: courseId,
          enrolledAt: Timestamp.now(),
          lastAccessedAt: Timestamp.now(),
          progressPercentage: 0,
          luminoPaymentId: payload.paymentId,
          status: "active",
        });

        // Increment enrolledStudentsCount on the course
        const courseRef = db.collection(COURSE).doc(courseId);
        const courseDoc = await transaction.get(courseRef);
        if (courseDoc.exists) {
          const currentCount = courseDoc.data()?.enrolledStudentsCount || 0;
          transaction.update(courseRef, {
            enrolledStudentsCount: currentCount + 1,
          });
        }
      }
    }
  });

  if (wasAlreadyProcessed) {
    logInfo("Lumino payment was already processed (duplicate delivery)", {
      paymentId: payload.paymentId,
      userId: user.id,
      enrolledCourseIds: targetCourseIds,
    });
    return {
      success: true,
      duplicate: true,
      enrolled: false,
      userId: user.id,
      courseId: payload.courseId || targetCourseIds[0] || null,
      enrolledCourseIds: targetCourseIds,
      paymentId: payload.paymentId,
      status: "duplicate",
      message: "Payment was already processed successfully.",
    };
  }

  logInfo("Successfully processed Lumino payment and enrolled user", {
    paymentId: payload.paymentId,
    userId: user.id,
    targetCourseIds,
    newEnrollments: newlyEnrolledCourseIds,
  });

  return {
    success: true,
    duplicate: false,
    enrolled: newlyEnrolledCourseIds.length > 0,
    userId: user.id,
    courseId: payload.courseId || targetCourseIds[0] || null,
    enrolledCourseIds: targetCourseIds,
    paymentId: payload.paymentId,
    status: "succeeded",
    message:
      newlyEnrolledCourseIds.length > 0
        ? `Payment recorded and user enrolled in ${newlyEnrolledCourseIds.length} course(s).`
        : "Payment recorded. User was already enrolled in the course(s).",
  };
};
