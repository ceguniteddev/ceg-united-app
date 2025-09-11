import { firestoreAdmin } from "@/lib/fireabase-admin";
import { getCurrentUser } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ count: 0 });

  const db = firestoreAdmin();
  const entriesSnap = await db
    .collection("changelog")
    .where("status", "==", "published")
    .where("publishAt", "<=", new Date())
    .get();

  const readsSnap = await db.collection("changelogReads").where("userId", "==", user.uid).get();

  const readIds = new Set(readsSnap.docs.map((d) => d.data().entryId));
  const count = entriesSnap.docs.filter((d) => !readIds.has(d.id)).length;
  return NextResponse.json({ count });
}
