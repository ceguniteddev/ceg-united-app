import { DODO_PAYMENT_REQUESTS_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";

export const getPaymentRequestById = async (paymentId: string) => {
  try {
    const doc = await firestoreAdmin()
      .collection(DODO_PAYMENT_REQUESTS_COLLECTION)
      .doc(paymentId)
      .get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  } catch (error) {
    console.error("Error fetching Dodo payment request:", error);
    return null;
  }
};
