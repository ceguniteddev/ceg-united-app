import { firestoreAdmin } from "@/lib/fireabase-admin";
import { PAYMENT_REQUESTS_COLLECTION } from "@/constant/collection-name";

export const getPaymentRequestById = async (
  paymentId: string,
): Promise<{ id: string; [key: string]: any } | null> => {
  try {
    const doc = await firestoreAdmin()
      .collection(PAYMENT_REQUESTS_COLLECTION)
      .doc(paymentId)
      .get();

    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching payment request:", error);
    return null;
  }
};
