import { badRequest, internalServerError } from "@/app/api/helpers";
import AppError from "@/error/AppError";
import { withAuth } from "@/lib/api-validation";
import { getApplyFunding } from "@/service/apply-funding";
import { refreshCRSData } from "@/service/crs";
import { getUserById } from "@/service/user";

import { getClientEntitlements } from "@/service/course-capabilities";

import { NextRequest, NextResponse } from "next/server";

export const POST = withAuth(
  async (
    req: NextRequest,
    { params }: { params?: Promise<{ userId: string }> },
  ) => {
    const { userId } = (await params) ?? {};
    if (!userId) {
      return badRequest({ errors: "Missing userId" });
    }
    try {
      const body = await req.json().catch(() => ({}));
      const {
        bureaus,
        personalInfo,
        addressInfo,
        refreshBusinessCredit,
        businessIds,
      } = body;

      const hasSelectedBureaus =
        bureaus && (bureaus.equifax || bureaus.experian || bureaus.transunion);

      if (!hasSelectedBureaus && !refreshBusinessCredit) {
        return badRequest({
          errors: "At least one bureau or business credit must be selected.",
        });
      }

      if (
        refreshBusinessCredit &&
        (!businessIds ||
          !Array.isArray(businessIds) ||
          businessIds.length === 0)
      ) {
        return badRequest({
          errors: "Please select at least one business to refresh.",
        });
      }

      if (refreshBusinessCredit) {
        const user = await getUserById(userId);
        if (!user) {
          return badRequest({ errors: "User not found" });
        }

        const entitlements = await getClientEntitlements(userId);
        if (!entitlements.hasCreditReportAccess) {
          return badRequest({
            errors: "Only premium clients can refresh business credit.",
          });
        }
      }

      let referenceNumber = "";

      if (!addressInfo) {
        const appliedFundings = await getApplyFunding(userId);
        if (appliedFundings && appliedFundings.length > 0) {
          referenceNumber = appliedFundings[0].referenceNumber!;
        }

        if (!referenceNumber) {
          return badRequest({ errors: "Missing reference number" });
        }
      }

      await refreshCRSData({
        userId,
        referenceNumber,
        bureaus,
        personalInfo,
        addressInfo,
        refreshBusinessCredit,
        businessIds,
      });

      return NextResponse.json({ message: "ok" }, { status: 200 });
    } catch (err) {
      if (err instanceof AppError) {
        return badRequest({ errors: err.message });
      }
      console.log("err", err);
      return internalServerError();
    }
  },
);
