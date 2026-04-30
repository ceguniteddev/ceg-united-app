import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { updateApplicationStatus } from "@/service/apply-funding";

export const PUT = withAuth(
  async (
    request: NextRequest,
    {
      params,
    }: { params?: Promise<{ userId: string; referenceNumber: string }> },
  ) => {
    try {
      const resolvedParams = await params;
      const referenceNumber = resolvedParams?.referenceNumber;

      if (!referenceNumber) {
        return badRequest({ errors: "Reference Number is required" });
      }

      const body = await request.json();
      const { status } = body;

      if (!status) {
        return badRequest({ errors: "Status is required" });
      }

      await updateApplicationStatus(referenceNumber, status);

      return NextResponse.json(
        { message: "Status updated successfully" },
        { status: 200 },
      );
    } catch (error) {
      console.error("Error updating status:", error);
      return internalServerError();
    }
  },
);
