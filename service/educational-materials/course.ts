"use server";
import { ATTACHMENT, COURSE } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { UploadedFileData } from "@/schema";
import { Attachment, Course } from "@/schema/educational-materials/course";
import { Timestamp } from "firebase-admin/firestore";
import { getChaptersByCourseId } from "./chapter";

export const recordCourseTitle = async (title: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(COURSE);
  const docRef = await collectionRef.add({ title, createdAt: Timestamp.now() });
  const data = (await docRef.get()).data();
  return {
    id: docRef.id,
    ...normalizeAllDates(data),
  };
};

export const updateCourse = async ({ id, data }: { id: string; data: any }) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(COURSE).doc(id);

  const doc = await collectionRef.get();
  if (!doc.exists) {
    return null;
  }

  await collectionRef.update({
    ...data,
    updatedAt: Timestamp.now(),
  });

  const updatedDoc = await collectionRef.get();

  return {
    id: updatedDoc.id,
    ...normalizeAllDates(updatedDoc.data()),
  };
};

export const getCourseById = async (id: string): Promise<Course | null> => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(COURSE).doc(id);
  const doc = await collectionRef.get();
  if (!doc.exists) return null;
  const data = doc.data();

  const imageUrl = await getCourseDocument(data?.imageUrl);

  const chapters = await getChaptersByCourseId(id);

  const attachments = await getAttachmentsByCourseId(id);

  return {
    id: doc.id,
    ...normalizeAllDates(data),
    imageUrl,
    chapters,
    attachments,
  };
};

export const deleteCourse = async (id: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(COURSE).doc(id);
  await collectionRef.delete();
};

export const getCourses = async (): Promise<Course[] | null> => {
  try {
    const db = firestoreAdmin();
    const collectionRef = db.collection(COURSE).orderBy("createdAt", "desc");
    const querySnapshot = await collectionRef.get();

    if (querySnapshot.empty) {
      return [];
    }

    const courses = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        try {
          const data = doc.data();
          // These can run in parallel
          const [imageUrl, chapters, attachments] = await Promise.all([
            getCourseDocument(data?.imageUrl),
            getChaptersByCourseId(doc.id),
            getAttachmentsByCourseId(doc.id),
          ]);

          return {
            id: doc.id,
            ...normalizeAllDates(data),
            imageUrl,
            chapters,
            attachments,
          };
        } catch (error) {
          console.error(`Failed to process course ${doc.id}:`, error);
          return null;
        }
      }),
    );

    return courses.filter((course) => course !== null);
  } catch (error) {
    console.error("Failed to get courses:", error);
    return null;
  }
};

/**
 * Get IDs of all published courses (lightweight, no subcollection fetching)
 */
export const getPublishedCourseIds = async (): Promise<string[]> => {
  const db = firestoreAdmin();
  const querySnapshot = await db
    .collection(COURSE)
    .where("isPublished", "==", true)
    .get();
  return querySnapshot.docs.map((doc) => doc.id);
};

export const uploadCourseDocument = async ({
  courseId,
  file,
}: {
  courseId: string;
  file: File;
}): Promise<UploadedFileData> => {
  const bucket = storageAdmin();
  const prefix = `courses/${courseId}/image/`;
  const newFilename: string = file.name;

  const path = `${prefix}${newFilename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blob = bucket.file(path);
  await blob.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  const expires = Date.now() + 10 * 60 * 1000;

  const [signedUrl] = await blob.getSignedUrl({
    action: "read",
    expires,
  });

  return {
    originalFilename: file.name,
    gcsPath: path,
    size: file.size,
    contentType: file.type,
    publicUrl: signedUrl,
  };
};

export const deleteCourseDocument = async (path: string) => {
  try {
    const bucket = storageAdmin();
    const blob = bucket.file(path);
    await blob.delete();
    console.log(`Successfully deleted document: ${path}`);
  } catch (error: any) {
    // It's often safe to ignore "Not Found" errors during deletion
    if (error.code === 404) {
      console.warn(
        `Attempted to delete a document that does not exist: ${path}`,
      );
      return;
    }
    console.error(`Failed to delete document ${path}:`, error);
    // Re-throw the error if it's not a 404, so the mutation hook knows it failed
    throw error;
  }
};

export const getCourseDocument = async (path: string) => {
  if (!path) return null;
  const bucket = storageAdmin();
  const blob = bucket.file(path);
  // Use 7 day expiration instead of 10 minutes for better UX
  const [signedUrl] = await blob.getSignedUrl({
    action: "read",
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  });
  return signedUrl;
};

export const uploadCourseAttachment = async ({
  courseId,
  file,
}: {
  courseId: string;
  file: File;
}): Promise<UploadedFileData> => {
  const bucket = storageAdmin();
  const prefix = `courses/${courseId}/attachments/`;
  const newFilename: string = file.name;

  const path = `${prefix}${newFilename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const blob = bucket.file(path);
  await blob.save(buffer, {
    metadata: {
      contentType: file.type,
    },
  });

  const expires = Date.now() + 10 * 60 * 1000;

  const [signedUrl] = await blob.getSignedUrl({
    action: "read",
    expires,
  });

  await recordCourseAttachment({ url: path, name: newFilename, courseId });

  return {
    originalFilename: file.name,
    gcsPath: path,
    size: file.size,
    contentType: file.type,
    publicUrl: signedUrl,
  };
};

export const recordCourseAttachment = async ({
  url,
  name,
  courseId,
}: {
  url: string;
  name: string;
  courseId: string;
}) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(`${COURSE}/${courseId}/${ATTACHMENT}`);
  const docRef = await collectionRef.add({
    url,
    name,
    courseId,
    createdAt: Timestamp.now(),
  });
  const data = (await docRef.get()).data();
  return {
    id: docRef.id,
    ...normalizeAllDates(data),
  };
};

export const getAttachmentsByCourseId = async (courseId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${ATTACHMENT}`)
    .where("courseId", "==", courseId)
    .orderBy("createdAt", "asc");
  const querySnapshot = await collectionRef.get();
  if (querySnapshot.empty) return null;

  const attachments = await Promise.all(
    querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      // Generate signed URL with 7 day expiration
      const url = await getCourseDocument(data?.url);
      return {
        id: doc.id,
        ...normalizeAllDates(data),
        url,
      };
    }),
  );

  return attachments;
};

export const getAttachmentById = async ({
  courseId,
  attachmentId,
}: {
  courseId: string;
  attachmentId: string;
}): Promise<Attachment | null> => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${ATTACHMENT}`)
    .doc(attachmentId);
  const doc = await collectionRef.get();
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...normalizeAllDates(data),
  };
};

export const deleteAttachment = async ({
  courseId,
  attachmentId,
}: {
  courseId: string;
  attachmentId: string;
}) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${ATTACHMENT}`)
    .doc(attachmentId);
  await collectionRef.delete();
};

export const getUserCourses = async (userId: string): Promise<Course[]> => {
  try {
    // First, check if user has paid or is mapped in denefits contract
    const db = firestoreAdmin();

    // Check if user exists in USER_DENEFITS_CONTRACT collection
    const { USER_DENEFITS_CONTRACT } =
      await import("@/constant/collection-name");
    const denefitsRef = db
      .collection(USER_DENEFITS_CONTRACT)
      .where("userId", "==", userId);
    const denefitsSnapshot = await denefitsRef.get();

    // If user doesn't have denefits contract, return empty array
    if (denefitsSnapshot.empty) {
      return [];
    }

    // If user has denefits contract, return all published courses
    const coursesRef = db
      .collection(COURSE)
      .where("isPublished", "==", true)
      .orderBy("createdAt", "desc");

    const coursesSnapshot = await coursesRef.get();

    if (coursesSnapshot.empty) {
      return [];
    }

    const courses = await Promise.all(
      coursesSnapshot.docs.map(async (doc) => {
        try {
          const data = doc.data();
          const imageUrl = await getCourseDocument(data?.imageUrl);
          const chapters = await getChaptersByCourseId(doc.id);

          return {
            id: doc.id,
            ...normalizeAllDates(data),
            imageUrl,
            chapters,
          };
        } catch (error) {
          console.error(`Failed to process course ${doc.id}:`, error);
          return null;
        }
      }),
    );

    return courses.filter((course) => course !== null) as Course[];
  } catch (error) {
    console.error("Failed to get user courses:", error);
    return [];
  }
};
