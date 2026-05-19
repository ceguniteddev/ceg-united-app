import { firestoreAdmin } from "@/lib/fireabase-admin";
import bcrypt from "bcryptjs";
import * as admin from "firebase-admin";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/api-validation";

export const GET = withAuth(async (req: NextRequest) => {
  try {
    const db = firestoreAdmin();
    const snapshot = await db
      .collection("user-leads")
      .orderBy("createdAt", "desc")
      .get();

    const leads = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(leads, { status: 200 });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json(
      { error: "Failed to fetch leads" },
      { status: 500 },
    );
  }
});

export async function POST(req: Request) {
  try {
    const { authData } = await req.json();

    if (!authData) {
      return new Response(JSON.stringify({ error: "Missing authData" }), {
        status: 400,
      });
    }

    const decodedData = JSON.parse(
      Buffer.from(authData, "base64").toString("utf-8"),
    );

    // Hash the password if it exists, ensuring plain text is never saved
    if (decodedData.password) {
      const salt = await bcrypt.genSalt(10);
      decodedData.password = await bcrypt.hash(decodedData.password, salt);
    }

    const db = firestoreAdmin();
    const docRef = await db.collection("user-leads").add({
      ...decodedData,
      createdAt: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ leadId: docRef.id }), {
      status: 201,
    });
  } catch (error) {
    console.error("Error creating lead:", error);
    return new Response(JSON.stringify({ error: "Failed to create lead" }), {
      status: 500,
    });
  }
}

export async function PUT(req: Request) {
  try {
    const { leadId, data } = await req.json();

    if (!leadId || !data) {
      return new Response(JSON.stringify({ error: "Missing leadId or data" }), {
        status: 400,
      });
    }

    const decodedData = JSON.parse(
      Buffer.from(data, "base64").toString("utf-8"),
    );

    // Convert explicit nulls to FieldValue.delete()
    for (const key of Object.keys(decodedData)) {
      if (decodedData[key] === null) {
        decodedData[key] = admin.firestore.FieldValue.delete();
      }
    }

    // Hash the password if it is included in an update payload
    if (decodedData.password) {
      const salt = await bcrypt.genSalt(10);
      decodedData.password = await bcrypt.hash(decodedData.password, salt);
    }

    const db = firestoreAdmin();
    const docRef = db.collection("user-leads").doc(leadId);

    await docRef.set(
      {
        ...decodedData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error updating lead:", error);
    return new Response(JSON.stringify({ error: "Failed to update lead" }), {
      status: 500,
    });
  }
}
