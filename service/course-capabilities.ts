"use server";

import {
  COURSE,
  USER_COURSE_CAPABILITY_GRANTS,
} from "@/constant/collection-name";
import { resolveClientEntitlements } from "@/lib/client-entitlements";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import type {
  CourseCapabilityGrant,
  CourseGrantSource,
  CourseKey,
  UserCourseCapabilityGrant,
} from "@/schema/educational-materials/course";
import { getUserMembership } from "@/service/membership";

const grantDocumentId = (userId: string, courseId: string) =>
  `${userId}_${courseId}`.replace(/[^a-zA-Z0-9_-]/g, "_");

export const getUserCourseCapabilityGrants = async (
  userId: string,
): Promise<UserCourseCapabilityGrant[]> => {
  const snapshot = await firestoreAdmin()
    .collection(USER_COURSE_CAPABILITY_GRANTS)
    .where("userId", "==", userId)
    .where("status", "==", "active")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as UserCourseCapabilityGrant[];
};

export const getClientEntitlements = async (userId: string) => {
  const [membership, courseGrants] = await Promise.all([
    getUserMembership(userId),
    getUserCourseCapabilityGrants(userId),
  ]);
  return resolveClientEntitlements({ membership, courseGrants });
};

export const buildVerifiedCourseGrant = async ({
  userId,
  courseId,
  courseKey,
  capabilityGrant,
  source,
  providerPaymentId,
  providerEventId,
}: {
  userId: string;
  courseId: string;
  courseKey: CourseKey;
  capabilityGrant: CourseCapabilityGrant;
  source: Exclude<CourseGrantSource, "manual_admin">;
  providerPaymentId: string;
  providerEventId?: string;
}) => ({
  id: grantDocumentId(userId, courseId),
  ref: firestoreAdmin()
    .collection(USER_COURSE_CAPABILITY_GRANTS)
    .doc(grantDocumentId(userId, courseId)),
  data: {
    userId,
    courseId,
    courseKey,
    capabilityGrant,
    source,
    providerPaymentId,
    providerEventId: providerEventId || null,
    status: "active" as const,
    grantedAt: new Date(),
    revokedAt: null,
    updatedAt: new Date(),
  },
});

export const setAdminCourseCapabilityGrant = async ({
  userId,
  courseId,
  active,
  adminId,
  adminEmail,
  reason,
}: {
  userId: string;
  courseId: string;
  active: boolean;
  adminId: string;
  adminEmail: string;
  reason: string;
}) => {
  if (!reason.trim()) throw new Error("A grant reason is required.");

  const db = firestoreAdmin();
  const course = await db.collection(COURSE).doc(courseId).get();
  const data = course.data();
  if (!course.exists || !data?.courseKey || !data?.capabilityGrant) {
    throw new Error("Course capability configuration is incomplete.");
  }

  const ref = db
    .collection(USER_COURSE_CAPABILITY_GRANTS)
    .doc(grantDocumentId(userId, courseId));
  const now = new Date();
  await ref.set(
    active
      ? {
          userId,
          courseId,
          courseKey: data.courseKey,
          capabilityGrant: data.capabilityGrant,
          source: "manual_admin",
          status: "active",
          grantedAt: now,
          grantedByAdminId: adminId,
          grantedByAdminEmail: adminEmail,
          reason: reason.trim(),
          revokedAt: null,
          updatedAt: now,
        }
      : {
          userId,
          courseId,
          status: "revoked",
          revokedAt: now,
          revokedByAdminId: adminId,
          revokedByAdminEmail: adminEmail,
          reason: reason.trim(),
          updatedAt: now,
        },
    { merge: true },
  );
  return { success: true };
};
