import { DODO_PAYMENT_REQUESTS_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";

type DodoPaymentRequest = {
  id: string;
  userId?: string;
  [key: string]: unknown;
};

export const getPaymentRequestById = async (
  paymentId: string,
): Promise<DodoPaymentRequest | null> => {
  try {
    const doc = await firestoreAdmin()
      .collection(DODO_PAYMENT_REQUESTS_COLLECTION)
      .doc(paymentId)
      .get();
    return doc.exists
      ? ({ id: doc.id, ...doc.data() } as DodoPaymentRequest)
      : null;
  } catch (error) {
    console.error("Error fetching Dodo payment request:", error);
    return null;
  }
};
