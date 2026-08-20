import { NextRequest, NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/api-validation";
import { dodoEnvironment } from "@/lib/dodo-env";
import { CustomerPortal } from "@/lib/dodo-nextjs";
import { getDodoCustomerIdByUserId } from "@/service/dodo";

const portal = CustomerPortal({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY || "",
  environment: dodoEnvironment,
});

export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) => {
  const authenticated = await authenticateRequest(request);
  if (authenticated instanceof NextResponse) return authenticated;

  const { userId } = await params;
  if (authenticated !== true && authenticated.uid !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customerId = await getDodoCustomerIdByUserId(userId);
  if (!customerId) {
    return NextResponse.json(
      { error: "No Dodo Payments customer found" },
      { status: 404 },
    );
  }

  const portalUrl = new URL(request.url);
  portalUrl.searchParams.set("customer_id", customerId);
  return portal(new NextRequest(portalUrl, { headers: request.headers }));
};
