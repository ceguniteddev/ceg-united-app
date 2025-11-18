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
import { z } from "zod";

/**
 * GET /api/dispute-letter/templates
 * Get all letter templates
 */
export const GET = withAuth(async (request: NextRequest, context) => {
  const currentUser = context.currentUser;

  if (!currentUser) {
    return badRequest({ errors: "User not authenticated" });
  }

  try {
    const { searchParams } = new URL(request.url);
    const disputeType = searchParams.get("disputeType");
    const isActive = searchParams.get("isActive");

    const params: {
      disputeType?: any;
      isActive?: boolean;
    } = {};

    if (disputeType) {
      const validation = DisputeTypeEnum.safeParse(disputeType);
      if (validation.success) {
        params.disputeType = validation.data;
      }
    }

    if (isActive !== null) {
      params.isActive = isActive === "true";
    }

    const templates = await getLetterTemplates(params);
    return NextResponse.json(templates, { status: 200 });
  } catch (error: any) {
    console.error("Failed to get letter templates:", error);
    return internalServerError();
  }
});

/**
 * POST /api/dispute-letter/templates
 * Create a new letter template (admin only)
 */
export const POST = withAuth(async (request: NextRequest, context) => {
  const currentUser = context.currentUser;

  if (!currentUser) {
    return badRequest({ errors: "User not authenticated" });
  }

  if (!currentUser.admin) {
    return unauthorized();
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
});
