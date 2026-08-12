import { firestoreAdmin } from "@/lib/fireabase-admin";
import {
  USER_COLLECTION,
  BANK_MANAGEMENT_COLLECTION,
  BANK_PRODUCTS_COLLECTION,
} from "@/constant/collection-name";
import type {
  ClientProfile,
  Lender,
  Product,
  Playbook,
  BranchCacheDoc,
  LenderHistoryEntry,
} from "@/types/funding-playbook";

export function db() {
  return firestoreAdmin();
}

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} not found: ${id}`);
    this.name = "NotFoundError";
  }
}

// ── Clients ──────────────────────────────────────────────────────────
// NOTE: Reads from USER_COLLECTION ("user") — the same collection used
// by the existing service layer (service/user.ts). The funding-playbook
// ClientProfile type does NOT match the UserWithId schema in the user
// collection. The data shapes differ significantly (ClientProfile expects
// fields like income, dti, creditReports vs. firstName, lastName, role
// in the user collection). This helper pulls raw data from the right
// collection; the caller is responsible for any transformation.
export async function getClient(clientId: string): Promise<ClientProfile> {
  const snap = await db().collection(USER_COLLECTION).doc(clientId).get();
  if (!snap.exists) throw new NotFoundError("Client", clientId);
  return { id: snap.id, ...(snap.data() as Omit<ClientProfile, "id">) };
}

// ── Lenders ──────────────────────────────────────────────────────────
// NOTE: Reads from BANK_MANAGEMENT_COLLECTION ("bank-management") — the
// same collection used by service/bank-management.ts. The funding-playbook
// Lender type does NOT match the BankManagement schema (Lender expects
// primaryBureau, doubleDipRules, reconsiderationPhone, etc., while
// BankManagement has bankName, website, contacts, successFeePercentage).
export async function getLender(
  lenderId: string,
): Promise<Omit<Lender, "products">> {
  const snap = await db()
    .collection(BANK_MANAGEMENT_COLLECTION)
    .doc(lenderId)
    .get();
  if (!snap.exists) throw new NotFoundError("Lender", lenderId);
  const data = snap.data() as Omit<Lender, "id" | "products">;
  return { id: snap.id, ...data };
}

// ── Products ─────────────────────────────────────────────────────────
// NOTE: Reads from BANK_PRODUCTS_COLLECTION ("bank-products") — the same
// flat collection used by service/bank-products.ts. Previously this used
// a subcollection (lenders/{lenderId}/products/{productId}); now it reads
// from the top-level bank-products collection by product ID directly.
// The funding-playbook Product type does NOT match the BankFormData schema
// (Product expects displayName, typicalApprovalRange, cegProductLift, etc.,
// while BankFormData has bankName, products[] array, underwritingNotes, etc.).
export async function getProduct(
  lenderId: string,
  productId: string,
): Promise<Product> {
  const snap = await db()
    .collection(BANK_PRODUCTS_COLLECTION)
    .doc(productId)
    .get();
  if (!snap.exists) throw new NotFoundError("Product", productId);
  return { id: snap.id, ...(snap.data() as Omit<Product, "id">) };
}

// ── Lender listing ───────────────────────────────────────────────────
export async function listLenders(): Promise<Array<Omit<Lender, "products">>> {
  const snap = await db().collection(BANK_MANAGEMENT_COLLECTION).get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lender, "id" | "products">),
  }));
}

// ── Product listing ──────────────────────────────────────────────────
// Filters BANK_PRODUCTS_COLLECTION by the bankId field matching lenderId.
export async function listProducts(lenderId: string): Promise<Product[]> {
  const snap = await db()
    .collection(BANK_PRODUCTS_COLLECTION)
    .where("bankId", "==", lenderId)
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Product, "id">),
  }));
}

// ── Lender history (audit subcollection) ─────────────────────────────
// NOTE: Uses BANK_MANAGEMENT_COLLECTION as parent; the history subcollection
// is specific to the funding-playbook feature and has no service-layer analog.
export async function writeLenderHistoryEntry(
  entry: LenderHistoryEntry,
): Promise<void> {
  await db()
    .collection(BANK_MANAGEMENT_COLLECTION)
    .doc(entry.lenderId)
    .collection("history")
    .doc(entry.id)
    .set(entry);
}

// Playbooks (cache, 24h TTL)
export function playbookId(
  clientId: string,
  lenderId: string,
  productId: string,
): string {
  return `${clientId}_${lenderId}_${productId}`;
}

export async function getCachedPlaybook(id: string): Promise<Playbook | null> {
  const snap = await db().collection("playbooks").doc(id).get();
  if (!snap.exists) return null;
  const data = snap.data() as Playbook;
  const expiresAt = new Date(data.meta.expiresAt).getTime();
  if (Date.now() >= expiresAt) return null;
  return data;
}

export async function cachePlaybook(playbook: Playbook): Promise<void> {
  await db().collection("playbooks").doc(playbook.meta.id).set(playbook);
}

export async function savePlaybookFeedback(
  playbookId: string,
  feedback: Record<string, unknown>,
): Promise<string> {
  const ref = db()
    .collection("playbooks")
    .doc(playbookId)
    .collection("feedback")
    .doc();
  await ref.set({ id: ref.id, ...feedback });
  return ref.id;
}

// Branch cache (7 day TTL)
export function branchCacheId(zip: string, lenderId: string): string {
  return `${zip}_${lenderId}`;
}

export async function getCachedBranches(
  zip: string,
  lenderId: string,
): Promise<BranchCacheDoc | null> {
  const snap = await db()
    .collection("branches_cache")
    .doc(branchCacheId(zip, lenderId))
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as BranchCacheDoc;
  if (Date.now() >= new Date(data.expiresAt).getTime()) return null;
  return data;
}

export async function cacheBranches(doc: BranchCacheDoc): Promise<void> {
  await db()
    .collection("branches_cache")
    .doc(branchCacheId(doc.zip, doc.lenderId))
    .set(doc);
}

// Reconsideration script cache (24h TTL)
export function reconsiderationCacheId(
  clientId: string,
  lenderId: string,
  denialReason: string,
): string {
  const normalized = denialReason
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
  return `${clientId}_${lenderId}_${normalized}`;
}

export async function getCachedReconsiderationScript(
  id: string,
): Promise<{ script: string; expiresAt: string } | null> {
  const snap = await db()
    .collection("reconsideration_scripts_cache")
    .doc(id)
    .get();
  if (!snap.exists) return null;
  const data = snap.data() as { script: string; expiresAt: string };
  if (Date.now() >= new Date(data.expiresAt).getTime()) return null;
  return data;
}

export async function cacheReconsiderationScript(
  id: string,
  script: string,
  ttlHours = 24,
): Promise<void> {
  const expiresAt = new Date(
    Date.now() + ttlHours * 60 * 60 * 1000,
  ).toISOString();
  await db()
    .collection("reconsideration_scripts_cache")
    .doc(id)
    .set({ script, expiresAt, cachedAt: new Date().toISOString() });
}
