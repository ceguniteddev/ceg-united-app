import { NextResponse } from "next/server";
import { SavePlaybookFeedbackRequestSchema } from "@/lib/funding-playbook/schemas";
import { savePlaybookFeedback } from "@/lib/funding-playbook/firestore-helpers";
import { getCurrentUser } from "@/service/user";
import { unauthorized, forbidden } from "@/app/api/helpers";

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return unauthorized();
    }

    const body = await req.json();
    const parsedBody = SavePlaybookFeedbackRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const { playbookId, clientId, ...feedback } = parsedBody.data;

    if (currentUser.role !== "Admin" && currentUser.uid !== clientId) {
      return forbidden(
        "Access denied: You cannot submit feedback for another user.",
      );
    }

    const feedbackId = await savePlaybookFeedback(playbookId, {
      clientId,
      ...feedback,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, feedbackId });
  } catch (err) {
    console.error("savePlaybookFeedback failed", err);
    return NextResponse.json(
      { error: "Internal error saving feedback." },
      { status: 500 },
    );
  }
}
