import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  badRequest,
  unauthorized,
  getMessage,
  internalServerError,
} from "@/app/api/helpers";
import { getActiveClientFundingDetails } from "@/service/bank-products";
import { getCurrentUser } from "@/service/user";

const querySchema = z.object({
  userId: z.string(),
  referenceNumber: z.string(),
  pathwayId: z.string().optional(),
});

export const GET = withAuth(
  async (
    request: NextRequest,
    context: { params: Promise<{ userId: string; referenceNumber: string }> },
  ) => {
    try {
      const { userId: paramUserId, referenceNumber: paramReferenceNumber } =
        await context.params;

      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return unauthorized();
      }

      const isClient = currentUser.role === "Client";

      // If they are a Client, force them to only query their own records
      if (isClient && currentUser.uid !== paramUserId) {
        return unauthorized();
      }

      const { searchParams } = new URL(request.url);
      const pathwayId = searchParams.get("pathwayId") ?? undefined;

      const queryToValidate = {
        userId: paramUserId,
        referenceNumber: paramReferenceNumber,
        pathwayId,
      };

      const query = querySchema.safeParse(queryToValidate);

      if (!query.success) {
        const message = getMessage(query.error);
        return badRequest({ errors: message });
      }

      const {
        userId,
        referenceNumber,
        pathwayId: validatedPathwayId,
      } = query.data;

      const data = await getActiveClientFundingDetails({
        userId,
        referenceNumber,
        pathwayId: validatedPathwayId,
      });

      return NextResponse.json(data, { status: 200 });
    } catch (error: any) {
      console.error(
        "Unexpected error in active user funding application details API:",
        error,
      );
      return internalServerError();
    }
  },
);
