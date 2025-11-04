import AppError from "@/error/AppError";
import { authenticationAdmin, firestoreAdmin } from "@/lib/fireabase-admin";
import { DenefitsRequest, DenefitsRequestSchema } from "@/schema/denefits";
import { getUserById } from "./user";
import { USER_DENEFITS_CONTRACT } from "@/constant/collection-name";

export const recordContractCreated = async ({
  denefitsRequest,
}: {
  denefitsRequest: DenefitsRequest;
}) => {
  const query = DenefitsRequestSchema.safeParse(denefitsRequest);
  if (!query.success) {
    throw new AppError(query.error.message);
  }

  const db = firestoreAdmin();

  const auth = authenticationAdmin();
  let authUser = null;

  try {
    authUser = await auth.getUserByEmail(query.data.customer_email);
  } catch (error: any) {
    console.log("User not found");

    const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
    await collectionRef.add({ ...query.data, userId: null });

    return null;
  }

  if (!authUser) {
    console.log("User not found");
    return null;
  }

  const userData = await getUserById(authUser.uid);
  if (!userData) {
    console.log("User not found");
    return null;
  }

  const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
  await collectionRef.add({ ...query.data, userId: authUser.uid });
};

export const getContracts = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map((doc) => doc.data());
};

export const getContractsByUserId = async (userId: string) => {
  const db = firestoreAdmin();
  const collectionRef = db
    .collection(USER_DENEFITS_CONTRACT)
    .where("userId", "==", userId);
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map((doc) => doc.data());
};
