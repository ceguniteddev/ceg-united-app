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

export const getDenefitsPayments = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(USER_DENEFITS_CONTRACT);
  const querySnapshot = await collectionRef.get();
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateDenefitsContractUserId = async ({
  contractId,
  userId,
}: {
  contractId: string;
  userId: string;
}) => {
  if (!contractId) {
    throw new AppError("Contract ID is required.");
  }
  if (!userId) {
    throw new AppError("User ID is required.");
  }

  const db = firestoreAdmin();
  const docRef = db.collection(USER_DENEFITS_CONTRACT).doc(contractId);

  const docSnapshot = await docRef.get();
  if (!docSnapshot.exists) {
    throw new AppError("Contract not found.");
  }

  await docRef.update({ userId });

  return {
    id: contractId,
    ...docSnapshot.data(),
    userId,
  };
};
