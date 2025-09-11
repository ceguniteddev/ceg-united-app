import { firestoreAdmin } from "@/lib/fireabase-admin";
import { getCurrentUser } from "@/service/user";
import { NextRequest, NextResponse } from "next/server";

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const db = firestoreAdmin();
  const docId = `${user.uid}_${params.id}`;
  await db.collection("changelogReads").doc(docId).set(
    {
      userId: user.uid,
      entryId: params.id,
      readAt: new Date(),
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true });
}
