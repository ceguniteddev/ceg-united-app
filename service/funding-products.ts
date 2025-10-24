"use server";
import { FUNDING_PRODUCTS_COLLECTION } from "@/constant/collection-name";
import { firestoreAdmin } from "@/lib/fireabase-admin";
import { FundingProduct } from "@/schema/funding-products";

export const recordFundingProduct = async (values: FundingProduct) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(FUNDING_PRODUCTS_COLLECTION);
  await collectionRef.add(values);
};

export const getFundingProducts = async () => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(FUNDING_PRODUCTS_COLLECTION);
  const snapshot = await collectionRef.orderBy("productName", "asc").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as FundingProduct));
};

export const getFundingProduct = async (id: string) => {
  const db = firestoreAdmin();
  const collectionRef = db.collection(FUNDING_PRODUCTS_COLLECTION).doc(id);
  const doc = await collectionRef.get();
  return { id: doc.id, ...doc.data() } as FundingProduct;
};

export const deleteFundingProduct = async (id: string) => {
  console.log("deleteFundingProduct", id);
  const data = getFundingProduct(id);
  if (!data) {
    throw new Error("Funding product not found.");
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(FUNDING_PRODUCTS_COLLECTION).doc(id);
  await collectionRef.delete();
};

export const updateFundingProduct = async (id: string, values: FundingProduct) => {
  const data = getFundingProduct(id);
  if (!data) {
    throw new Error("Funding product not found.");
  }

  const db = firestoreAdmin();
  const collectionRef = db.collection(FUNDING_PRODUCTS_COLLECTION).doc(id);
  await collectionRef.update(values);
};
