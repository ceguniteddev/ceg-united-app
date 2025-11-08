import { CHAPTER, COURSE, MUX_DATA } from "@/constant/collection-name";
import { normalizeAllDates } from "@/lib/date-parser";
import { firestoreAdmin, storageAdmin } from "@/lib/fireabase-admin";
import { UploadedFileData } from "@/schema";
import { Chapter } from "@/schema/educational-materials/course";
import { Timestamp } from "firebase-admin/firestore";

export const recordChapterTitle = async ({
  title,
  courseId,
  position,
}: {
  title: string;
  courseId: string;
  position: number;
}) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(`${COURSE}/${courseId}/${CHAPTER}`);
  const docRef = await collectionRef.add({
    title,
    courseId,
    position,
    createdAt: Timestamp.now(),
  });
  const data = (await docRef.get()).data();
  return {
    id: docRef.id,
    ...normalizeAllDates(data),
  };
};

export const updateCourseChapter = async ({
  courseId,
  chapterId,
  data,
}: {
  courseId: string;
  chapterId: string;
  data: any;
}) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .doc(chapterId);

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

export const updateChapter = async ({
  courseId,
  id,
  data,
}: {
  courseId: string;
  id: string;
  data: any;
}) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .doc(id);
  await collectionRef.update({ ...data, updatedAt: Timestamp.now() });
};

export const getChaptersByCourseId = async (courseId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .where("courseId", "==", courseId)
    .orderBy("position", "asc");
  const querySnapshot = await collectionRef.get();
  if (querySnapshot.empty) return null;

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...normalizeAllDates(doc.data()),
  }));
};

export const getChapterById = async ({
  courseId,
  chapterId,
}: {
  courseId: string;
  chapterId: string;
}): Promise<Chapter | null> => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .doc(chapterId);
  const doc = await collectionRef.get();
  if (!doc.exists) return null;
  const data = doc.data();
  return {
    id: doc.id,
    ...normalizeAllDates(data),
  };
};

export const deleteChapter = async (courseId: string, chapterId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .doc(chapterId);
  await collectionRef.delete();
};

export const recordMuxData = async ({
  courseId,
  chapterId,
  assetId,
  playbackId,
}: {
  courseId: string;
  chapterId: string;
  assetId: string;
  playbackId: string;
}) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(`${COURSE}/${courseId}/${CHAPTER}`)
    .doc(chapterId);

  const muxDataObject = {
    assetId: assetId,
    playbackId: playbackId,
    chapterId: chapterId,
    courseId,
  };

  await collectionRef.update({
    videoUrl: `https://stream.mux.com/${playbackId}.m3u8`,
    muxData: muxDataObject,
    updatedAt: Timestamp.now(),
  });
};
