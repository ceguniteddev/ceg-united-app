import { NextRequest, NextResponse } from "next/server";
import { badRequest, internalServerError, notFound } from "@/app/api/helpers";
import { withAuth } from "@/lib/api-validation";
import { brokerageSchema } from "@/schema/brokerage";
import {
  deleteBrokerage,
  getBrokerageById,
  updateBrokerage,
} from "@/service/brokerage";

export const GET = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ id: string }> },
  ) => {
    const id = (await params)?.id;
    if (!id) return badRequest({ errors: "ID is required" });

    try {
      const data = await getBrokerageById(id);
      if (!data) return notFound();

      return NextResponse.json(data, { status: 200 });
    } catch (error) {
      console.error("Error fetching brokerage:", error);
      return internalServerError();
    }
  },
);

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ id: string }> },
  ) => {
    const id = (await params)?.id;
    if (!id) return badRequest({ errors: "ID is required" });

    try {
      const body = await request.json();
      const result = brokerageSchema.partial().safeParse(body);

      if (!result.success) {
        return badRequest({ errors: result.error.flatten() });
      }

      await updateBrokerage(id, result.data);
      return NextResponse.json(
        { message: "Updated successfully" },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Error updating brokerage:", error);
      if (error.message === "Brokerage not found") {
        return notFound();
      }
      return internalServerError();
    }
  },
);

export const DELETE = withAuth(
  async (
    request: NextRequest,
    { params }: { params?: Promise<{ id: string }> },
  ) => {
    const id = (await params)?.id;
    if (!id) return badRequest({ errors: "ID is required" });

    try {
      await deleteBrokerage(id);
      return NextResponse.json(
        { message: "Deleted successfully" },
        { status: 200 },
      );
    } catch (error: any) {
      console.error("Error deleting brokerage:", error);
      if (error.message === "Brokerage not found") {
        return notFound();
      }
      return internalServerError();
    }
  },
);
