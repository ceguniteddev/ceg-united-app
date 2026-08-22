"use server";

import {
  COURSE,
  USER_COURSE_PROGRESS as USER_PROGRESS,
  USER_COURSE_ENROLLMENT,
  CHAPTER,
} from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  UserProgress,
  UserCourseEnrollment,
  CourseWithProgress,
} from "@/schema/educational-materials/course";
import { Timestamp } from "firebase-admin/firestore";
import { getCourseById, getPublishedCourseIds } from "./course";
import { getUserMembership } from "@/service/membership";
import { getUserAddons } from "@/service/addons";

/**
 * Update user progress for a chapter (complete or incomplete)
 */
export const updateUserProgress = async ({
  userId,
  chapterId,
  courseId,
  isCompleted,
}: {
  userId: string;
  chapterId: string;
  courseId: string;
  isCompleted: boolean;
}): Promise<UserProgress> => {
  if (isCompleted) {
    return await markChapterComplete({ userId, chapterId, courseId });
  } else {
    return await markChapterIncomplete({ userId, chapterId, courseId });
  }
};

/**
 * Enroll a user in a course
 */
export const enrollUserInCourse = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}): Promise<UserCourseEnrollment> => {
  const db = firestoreAdmin();

  // Check if already enrolled
  const existingEnrollment = await db
    .collection(USER_COURSE_ENROLLMENT)
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .limit(1)
    .get();

  if (!existingEnrollment.empty) {
    const doc = existingEnrollment.docs[0];
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as UserCourseEnrollment;
  }

  // Create new enrollment
  const enrollmentRef = await db.collection(USER_COURSE_ENROLLMENT).add({
    userId,
    courseId,
    enrolledAt: Timestamp.now(),
    lastAccessedAt: Timestamp.now(),
    progressPercentage: 0,
  });

  const enrollmentDoc = await enrollmentRef.get();
  return {
    id: enrollmentRef.id,
    ...normalizeAllDates(enrollmentDoc.data()),
  } as UserCourseEnrollment;
};

/**
 * Unenroll a user from a course
 */
export const unenrollUserFromCourse = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}): Promise<void> => {
  const db = firestoreAdmin();

  // Delete the enrollment
  const enrollmentSnapshot = await db
    .collection(USER_COURSE_ENROLLMENT)
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .limit(1)
    .get();

  if (!enrollmentSnapshot.empty) {
    await enrollmentSnapshot.docs[0].ref.delete();
  }

  // Get all chapters for this course
  const chaptersSnapshot = await db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .get();

  const chapterIds = chaptersSnapshot.docs.map((doc) => doc.id);

  if (chapterIds.length > 0) {
    // Delete all progress records for this user and course
    const progressSnapshot = await db
      .collection(USER_PROGRESS)
      .where("userId", "==", userId)
      .where("chapterId", "in", chapterIds)
      .get();

    const batch = db.batch();
    progressSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
};

/**
 * Get user's enrollment for a course
 */
export const getUserCourseEnrollment = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}): Promise<UserCourseEnrollment | null> => {
  const db = firestoreAdmin();

  const querySnapshot = await db
    .collection(USER_COURSE_ENROLLMENT)
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return null;
  }

  const doc = querySnapshot.docs[0];
  return {
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  } as UserCourseEnrollment;
};

/**
 * Update last accessed time for a course
 */
export const updateCourseAccess = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}): Promise<void> => {
  const db = firestoreAdmin();

  const querySnapshot = await db
    .collection(USER_COURSE_ENROLLMENT)
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref;
    await docRef.update({
      lastAccessedAt: Timestamp.now(),
    });
  }
};

/**
 * Mark a chapter as completed
 */
export const markChapterComplete = async ({
  userId,
  chapterId,
  courseId,
}: {
  userId: string;
  chapterId: string;
  courseId: string;
}): Promise<UserProgress> => {
  const db = firestoreAdmin();

  // Check if progress already exists
  const existingProgress = await db
    .collection(USER_PROGRESS)
    .where("userId", "==", userId)
    .where("chapterId", "==", chapterId)
    .limit(1)
    .get();

  let progressDoc;

  if (!existingProgress.empty) {
    // Update existing
    const docRef = existingProgress.docs[0].ref;
    await docRef.update({
      isCompleted: true,
      updatedAt: Timestamp.now(),
    });
    progressDoc = await docRef.get();
  } else {
    // Create new
    const progressRef = await db.collection(USER_PROGRESS).add({
      userId,
      chapterId,
      isCompleted: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    progressDoc = await progressRef.get();
  }

  // Update course enrollment progress percentage
  await updateCourseProgress({ userId, courseId });

  return {
    id: progressDoc.id,
    ...normalizeAllDates(progressDoc.data()),
  } as UserProgress;
};

/**
 * Mark a chapter as incomplete
 */
export const markChapterIncomplete = async ({
  userId,
  chapterId,
  courseId,
}: {
  userId: string;
  chapterId: string;
  courseId: string;
}): Promise<UserProgress> => {
  const db = firestoreAdmin();

  const querySnapshot = await db
    .collection(USER_PROGRESS)
    .where("userId", "==", userId)
    .where("chapterId", "==", chapterId)
    .limit(1)
    .get();

  if (!querySnapshot.empty) {
    const docRef = querySnapshot.docs[0].ref;
    await docRef.update({
      isCompleted: false,
      updatedAt: Timestamp.now(),
    });

    // Update course enrollment progress percentage
    await updateCourseProgress({ userId, courseId });

    const progressDoc = await docRef.get();
    return {
      id: progressDoc.id,
      ...normalizeAllDates(progressDoc.data()),
    } as UserProgress;
  }

  throw new Error("Progress not found");
};

/**
 * Get user progress for all chapters in a course
 */
export const getUserProgressForCourse = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}): Promise<UserProgress[]> => {
  const db = firestoreAdmin();

  // Get all chapters for this course
  const chaptersSnapshot = await db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .get();

  const chapterIds = chaptersSnapshot.docs.map((doc) => doc.id);

  if (chapterIds.length === 0) {
    return [];
  }

  // Get progress for these chapters
  const progressSnapshot = await db
    .collection(USER_PROGRESS)
    .where("userId", "==", userId)
    .where("chapterId", "in", chapterIds)
    .get();

  return progressSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  })) as UserProgress[];
};

/**
 * Calculate and update course progress percentage
 */
export const updateCourseProgress = async ({
  userId,
  courseId,
}: {
  userId: string;
  courseId: string;
}): Promise<void> => {
  const db = firestoreAdmin();

  // Get all chapters
  const chaptersSnapshot = await db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .where("isPublished", "==", true)
    .get();

  const totalChapters = chaptersSnapshot.size;

  if (totalChapters === 0) {
    return;
  }

  const chapterIds = chaptersSnapshot.docs.map((doc) => doc.id);

  // Get completed chapters
  const progressSnapshot = await db
    .collection(USER_PROGRESS)
    .where("userId", "==", userId)
    .where("chapterId", "in", chapterIds)
    .where("isCompleted", "==", true)
    .get();

  const completedChapters = progressSnapshot.size;
  const progressPercentage = Math.round(
    (completedChapters / totalChapters) * 100,
  );

  // Update enrollment
  const enrollmentSnapshot = await db
    .collection(USER_COURSE_ENROLLMENT)
    .where("userId", "==", userId)
    .where("courseId", "==", courseId)
    .limit(1)
    .get();

  if (!enrollmentSnapshot.empty) {
    const docRef = enrollmentSnapshot.docs[0].ref;
    const updateData: any = {
      progressPercentage,
      lastAccessedAt: Timestamp.now(),
    };

    // If 100% complete, set completedAt
    if (progressPercentage === 100) {
      updateData.completedAt = Timestamp.now();
    }

    await docRef.update(updateData);
  }
};

/**
 * Get all courses with progress for a user.
 * Premium clients are automatically enrolled in all published courses.
 */
export const getUserCoursesWithProgress = async (
  userId: string,
): Promise<CourseWithProgress[]> => {
  const db = firestoreAdmin();

  // Auto-enroll clients with active membership or add-on in all published courses
  const membership = await getUserMembership(userId);
  const addons = await getUserAddons(userId);
  const hasPaidContract =
    membership?.status === "active" ||
    addons.some((addon) => addon.status === "active");

  if (hasPaidContract) {
    const [publishedCourseIds, existingEnrollmentsSnapshot] = await Promise.all(
      [
        getPublishedCourseIds(),
        db
          .collection(USER_COURSE_ENROLLMENT)
          .where("userId", "==", userId)
          .get(),
      ],
    );

    const enrolledCourseIds = new Set(
      existingEnrollmentsSnapshot.docs.map((doc) => doc.data().courseId),
    );

    const missingCourseIds = publishedCourseIds.filter(
      (id) => !enrolledCourseIds.has(id),
    );

    if (missingCourseIds.length > 0) {
      await Promise.all(
        missingCourseIds.map((courseId) =>
          enrollUserInCourse({ userId, courseId }),
        ),
      );
    }
  }

  // Get user's enrollments
  const enrollmentsSnapshot = await db
    .collection(USER_COURSE_ENROLLMENT)
    .where("userId", "==", userId)
    .get();

  if (enrollmentsSnapshot.empty) {
    return [];
  }

  const coursesWithProgress: CourseWithProgress[] = [];

  for (const enrollmentDoc of enrollmentsSnapshot.docs) {
    const enrollment = {
      id: enrollmentDoc.id,
      ...normalizeAllDates(enrollmentDoc.data()),
    } as UserCourseEnrollment;

    // Get course details
    const course = await getCourseById(enrollment.courseId);

    if (course) {
      // Get user progress for this course
      const userProgress = await getUserProgressForCourse({
        userId,
        courseId: enrollment.courseId,
      });

      const totalChapters = course.chapters?.length || 0;
      const completedChapters = userProgress.filter(
        (p) => p.isCompleted,
      ).length;

      coursesWithProgress.push({
        ...course,
        enrollment,
        totalChapters,
        completedChapters,
        userProgress,
      });
    }
  }

  return coursesWithProgress;
};
