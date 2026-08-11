import { firestoreAdmin } from "@/lib/fireabase-admin";
import * as admin from "firebase-admin";
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

// Clients
export async function getClient(clientId: string): Promise<ClientProfile> {
  const snap = await db().collection("clients").doc(clientId).get();
  if (!snap.exists) throw new NotFoundError("Client", clientId);
  return { id: snap.id, ...(snap.data() as Omit<ClientProfile, "id">) };
}

// Lenders + Products
export async function getLender(
  lenderId: string,
): Promise<Omit<Lender, "products">> {
  const snap = await db().collection("lenders").doc(lenderId).get();
  if (!snap.exists) throw new NotFoundError("Lender", lenderId);
  const data = snap.data() as Omit<Lender, "id" | "products">;
  return { id: snap.id, ...data };
}

export async function getProduct(
  lenderId: string,
  productId: string,
): Promise<Product> {
  const snap = await db()
    .collection("lenders")
    .doc(lenderId)
    .collection("products")
    .doc(productId)
    .get();
  if (!snap.exists)
    throw new NotFoundError("Product", `${lenderId}/${productId}`);
  return { id: snap.id, ...(snap.data() as Omit<Product, "id">) };
}

export async function listLenders(): Promise<Array<Omit<Lender, "products">>> {
  const snap = await db().collection("lenders").get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Lender, "id" | "products">),
  }));
}

export async function listProducts(lenderId: string): Promise<Product[]> {
  const snap = await db()
    .collection("lenders")
    .doc(lenderId)
    .collection("products")
    .get();
  return snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<Product, "id">),
  }));
}

export async function writeLenderHistoryEntry(
  entry: LenderHistoryEntry,
): Promise<void> {
  await db()
    .collection("lenders")
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
