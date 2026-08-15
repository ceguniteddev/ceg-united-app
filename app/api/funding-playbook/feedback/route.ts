import { NextResponse } from "next/server";
import { SavePlaybookFeedbackRequestSchema } from "@/lib/funding-playbook/schemas";
import { savePlaybookFeedback } from "@/lib/funding-playbook/firestore-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsedBody = SavePlaybookFeedbackRequestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Invalid request body.", details: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const { playbookId, ...feedback } = parsedBody.data;
    const feedbackId = await savePlaybookFeedback(playbookId, {
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
