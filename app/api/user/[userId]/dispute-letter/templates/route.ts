import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  getMessage,
  internalServerError,
  unauthorized,
} from "@/app/api/helpers";
import {
  getLetterTemplates,
  createLetterTemplate,
} from "@/service/dispute-letter/template";
import { LetterTemplateSchema, DisputeTypeEnum } from "@/schema/dispute-letter";

/**
 * GET /api/user/[userId]/dispute-letter/templates
 * Get all letter templates
 */
export const GET = withAuth(
  async (
    request: NextRequest,
    context: { params?: Promise<{ userId: string }>; currentUser: any }
  ) => {
    const { currentUser } = context;
    const { userId } = (await context.params) ?? {};

    if (!currentUser) {
      return badRequest({ errors: "User not authenticated" });
    }

    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    // Check authorization - user can only access templates for themselves unless admin
    if (!currentUser.admin && currentUser.uid !== userId) {
      return unauthorized();
    }

    try {
      const { searchParams } = new URL(request.url);
      const disputeType = searchParams.get("disputeType");
      const isActive = searchParams.get("isActive");

      const queryParams: {
        disputeType?: any;
        isActive?: boolean;
      } = {};

      if (disputeType) {
        const validation = DisputeTypeEnum.safeParse(disputeType);
        if (validation.success) {
          queryParams.disputeType = validation.data;
        }
      }

      if (isActive !== null) {
        queryParams.isActive = isActive === "true";
      }

      const templates = await getLetterTemplates(queryParams);
      return NextResponse.json(templates, { status: 200 });
    } catch (error: any) {
      console.error("Failed to get letter templates:", error);
      return internalServerError();
    }
  }
);

/**
 * POST /api/user/[userId]/dispute-letter/templates
 * Create a new letter template (admin only)
 */
export const POST = withAuth(
  async (
    request: NextRequest,
    context: { params?: Promise<{ userId: string }>; currentUser: any }
  ) => {
    const { currentUser } = context;
    const { userId } = (await context.params) ?? {};

    if (!currentUser) {
      return badRequest({ errors: "User not authenticated" });
    }

    if (!currentUser.admin) {
      return unauthorized();
    }

    if (!userId) {
      return badRequest({ errors: "User ID is required" });
    }

    try {
      const body = await request.json();
      const validation = LetterTemplateSchema.omit({
        id: true,
        createdAt: true,
        updatedAt: true,
      }).safeParse(body);

      if (!validation.success) {
        const message = getMessage(validation.error);
        return badRequest({ errors: message });
      }

      const template = await createLetterTemplate(validation.data);
      return NextResponse.json(template, { status: 201 });
    } catch (error: any) {
      console.error("Failed to create letter template:", error);
      return internalServerError();
    }
  }
);
