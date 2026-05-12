import { firestoreAdmin } from "@/lib/fireabase-admin"; // Note: misspelling is often 'fireabase-admin' as seen in list_files "lib/fireabase-admin.ts"
import { normalizeAllDates } from "@/lib/date-parser";
import { FUNDING_SUBMISSION_DOCUMENTS } from "@/constant/collection-name";

export interface ClassifiedDocument {
  id?: string;
  emailMessageId: string;
  document_id: string;
  confidence_score: number;
  suggested_file_name: string;
  reasoning: string;
  extracted_data: Record<string, any>;
  createdAt: string;
}

export const saveClassifiedDocument = async (
  emailMessageId: string,
  classificationData: any,
): Promise<ClassifiedDocument> => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(FUNDING_SUBMISSION_DOCUMENTS);

  const docData = {
    emailMessageId,
    ...classificationData,
    createdAt: new Date().toISOString(),
  };

  const docRef = await collectionRef.add(docData);

  return {
    id: docRef.id,
    ...normalizeAllDates(docData),
  };
};

export const getClassifiedDocuments = async (
  emailMessageId: string,
): Promise<ClassifiedDocument[]> => {
  if (!emailMessageId) {
    throw new Error("Email Message ID is required.");
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(FUNDING_SUBMISSION_DOCUMENTS);

  const snapshot = await collectionRef
    .where("emailMessageId", "==", emailMessageId)
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) {
    return [];
  }

  return snapshot.docs.map((doc) => {
    return {
      id: doc.id,
      ...normalizeAllDates(doc.data()),
    } as ClassifiedDocument;
  });
};
