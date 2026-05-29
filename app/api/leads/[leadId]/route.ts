import { firestoreAdmin } from "@/lib/fireabase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";

export const GET = withAuth(
  async (
    req: NextRequest,
    context: { params: Promise<{ leadId: string }> },
  ) => {
    try {
      const { leadId } = await context.params;

      if (!leadId) {
        return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
      }

      const db = firestoreAdmin();
      const docRef = db.collection("user-leads").doc(leadId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      return NextResponse.json({ id: doc.id, ...doc.data() }, { status: 200 });
    } catch (error) {
      console.error("Error fetching lead:", error);
      return NextResponse.json(
        { error: "Failed to fetch lead" },
        { status: 500 },
      );
    }
  },
);

export const DELETE = withAuth(
  async (
    req: NextRequest,
    context: { params: Promise<{ leadId: string }> },
  ) => {
    try {
      const { leadId } = await context.params;

      if (!leadId) {
        return NextResponse.json({ error: "Missing leadId" }, { status: 400 });
      }

      const db = firestoreAdmin();
      const docRef = db.collection("user-leads").doc(leadId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
      }

      await docRef.delete();

      return NextResponse.json(
        { success: true, message: "Lead deleted successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error deleting lead:", error);
      return NextResponse.json(
        { error: "Failed to delete lead" },
        { status: 500 },
      );
    }
  },
);
