import { firestoreAdmin } from "@/lib/fireabase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");
  const limitParam = Number(searchParams.get("limit") ?? 20);

  const db = firestoreAdmin();

  let q = db
    .collection("changelog")
    .where("status", "==", "published")
    .where("publishAt", "<=", new Date())
    .orderBy("publishAt", "desc")
    .limit(Math.min(limitParam, 50));

  if (tag) q = q.where("tags", "array-contains", tag);

  const snap = await q.get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  // Verify auth & admin claim (e.g., from cookies/session/JWT)
  const body = await req.json();
  const now = new Date();

  const data = {
    title: body.title,
    summary: body.summary ?? "",
    body: body.body ?? "",
    tags: body.tags ?? [],
    productArea: body.productArea ?? null,
    audience: body.audience ?? [],
    breaking: !!body.breaking,
    version: body.version ?? null,
    links: body.links ?? [],
    pinned: !!body.pinned,
    banner: !!body.banner,
    status: body.status ?? "draft",
    publishAt: new Date(body.publishAt ?? now),
    createdAt: now,
    updatedAt: now,
    authorId: body.authorId,
  };
  const db = firestoreAdmin();
  const ref = await db.collection("changelog").add(data);
  return NextResponse.json({ id: ref.id }, { status: 201 });
}
