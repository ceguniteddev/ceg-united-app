import { withAuth } from "@/lib/api-validation";
import { NextRequest, NextResponse } from "next/server";
import { badRequest, getMessage, internalServerError } from "@/app/api/helpers";
import z from "zod";
import { getUsers } from "@/service/user";
import { UserWithId } from "@/schema/registration";
import { ROLES } from "@/schema";
import { isActive } from "@tiptap/core";

const querySchema = z.object({
  role: z.enum(ROLES),
  email: z.email().optional(),
  isActive: z.coerce.boolean().optional(),
});

export const GET = withAuth(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const query = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!query.success) {
    const message = getMessage(query.error);
    return badRequest({ errors: message });
  }

  const { role, email, isActive } = query.data;

  try {
    const data = (await getUsers({ role, email, isActive })) as UserWithId[];
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return internalServerError();
  }
});
