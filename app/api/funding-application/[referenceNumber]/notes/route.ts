import { badRequest } from "@/app/api/helpers";
import {
  getFundApplicationNote,
  updateFundApplicationNote,
} from "@/service/apply-funding";
import { NextResponse } from "next/server";

// Handler for GET requests
export async function GET(
  request: Request,
  { params }: { params?: Promise<{ referenceNumber: string }> }
) {
  try {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }

    const noteData = await getFundApplicationNote(referenceNumber);
    return NextResponse.json(noteData);
  } catch (error: any) {
    console.error("GET /api/notes Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Handler for POST requests (for updating)
export async function POST(
  request: Request,
  { params }: { params?: Promise<{ referenceNumber: string }> }
) {
  try {
    const { referenceNumber } = (await params) ?? {};
    if (!referenceNumber) {
      return badRequest({ errors: "Missing reference number" });
    }

    const body = await request.json();

    // The backend service already validates the note structure
    await updateFundApplicationNote({ referenceNumber, note: body });

    return NextResponse.json({ message: "Note updated successfully" });
  } catch (error: any) {
    console.error("POST /api/notes Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
