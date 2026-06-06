"use server";

import { CONSUMER_REPORTING_AGENCY_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { AgencySchemaForm } from "@/schema/consumer-reporting-agency";
// import AppError from "@/error/AppError";
import { normalizeAllDates } from "@/lib/date-parser";

export const getConsumerReportingAgencies = async (): Promise<{
  success: boolean;
  data?: AgencySchemaForm[];
  error?: string;
  message?: string;
}> => {
  try {
    const db = firestoreAdmin();
    const collectionRef = db.collection(CONSUMER_REPORTING_AGENCY_COLLECTION);
    const snapshot = await collectionRef.orderBy("name", "asc").get();

    if (snapshot.empty) {
      return { success: true, data: [] };
    }

    const result = snapshot.docs.map((doc) => ({
      key: doc.id,
      ...normalizeAllDates(doc.data()),
    })) as AgencySchemaForm[];

    return { success: true, data: result };
  } catch (error) {
    console.error("Unexpected error in getConsumerReportingAgencies:", error);
    return {
      success: false,
      error: "error",
      message:
        "An unexpected error occurred while fetching consumer reporting agencies.",
    };
  }
};

export const getConsumerReportingAgency = async (
  id: string,
): Promise<AgencySchemaForm | null> => {
  const db = firestoreAdmin();
  const doc = await db
    .collection(CONSUMER_REPORTING_AGENCY_COLLECTION)
    .doc(id)
    .get();
  if (!doc.exists) return null;
  return { key: doc.id, ...normalizeAllDates(doc.data()) } as AgencySchemaForm;
};

export const addConsumerReportingAgency = async (
  data: AgencySchemaForm,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const db = firestoreAdmin();
    const { key, ...rest } = data;

    // Ensure the key is unique
    const doc = await db
      .collection(CONSUMER_REPORTING_AGENCY_COLLECTION)
      .doc(key)
      .get();
    if (doc.exists) {
      return {
        success: false,
        message: "An agency with this key already exists.",
      };
    }

    await db
      .collection(CONSUMER_REPORTING_AGENCY_COLLECTION)
      .doc(key)
      .set({
        ...rest,
        key, // Also store the key in the document data
        createdAt: new Date(),
      });

    return {
      success: true,
      message: "Consumer reporting agency added successfully.",
    };
  } catch (error) {
    console.error("Error adding consumer reporting agency:", error);
    return {
      success: false,
      message: "Failed to add consumer reporting agency.",
    };
  }
};

export const updateConsumerReportingAgency = async (
  id: string,
  data: AgencySchemaForm,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const db = firestoreAdmin();
    const docRef = db.collection(CONSUMER_REPORTING_AGENCY_COLLECTION).doc(id);

    const doc = await docRef.get();
    if (!doc.exists) {
      return { success: false, message: "Agency not found." };
    }

    const { key, ...rest } = data;
    await docRef.update({
      ...rest,
      updatedAt: new Date(),
    });

    return {
      success: true,
      message: "Consumer reporting agency updated successfully.",
    };
  } catch (error) {
    console.error("Error updating consumer reporting agency:", error);
    return {
      success: false,
      message: "Failed to update consumer reporting agency.",
    };
  }
};

export const deleteConsumerReportingAgency = async (
  id: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const db = firestoreAdmin();
    await db.collection(CONSUMER_REPORTING_AGENCY_COLLECTION).doc(id).delete();
    return {
      success: true,
      message: "Consumer reporting agency deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting consumer reporting agency:", error);
    return {
      success: false,
      message: "Failed to delete consumer reporting agency.",
    };
  }
};
