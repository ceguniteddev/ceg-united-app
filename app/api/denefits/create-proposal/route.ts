import { NextRequest, NextResponse } from "next/server";
import { createDenefitsProposal } from "@/service/denefits";
import { getPaymentRequestById } from "@/service/whop/utils";
import { z } from "zod";
import { logError, logInfo } from "@/lib/logger";

const CreateProposalSchema = z.object({
  paymentId: z.string().min(1, "Payment ID is required"),
  serviceAmount: z.number().positive("Service amount must be positive"),
  downpaymentAmount: z.number().positive("Downpayment amount must be positive"),
  serviceName: z.string().min(1, "Service name is required"),
  proposalType: z.enum(["in-house", "no-fee"]),
});

// Public endpoint - validates payment ID instead of requiring authentication
// This is secure because:
// 1. Payment ID is a unique UUID that's hard to guess
// 2. We verify the payment exists in the database
// 3. UserId is retrieved server-side from the payment record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = CreateProposalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request data",
          errors: validation.error.issues,
        },
        { status: 400 },
      );
    }

    const {
      paymentId,
      serviceAmount,
      downpaymentAmount,
      serviceName,
      proposalType,
    } = validation.data;

    // Validate payment exists and get userId
    const paymentRequest = await getPaymentRequestById(paymentId);
    if (!paymentRequest || !paymentRequest.userId) {
      logInfo("Invalid or missing payment request", { paymentId });
      return NextResponse.json(
        {
          success: false,
          message: "Invalid payment request",
        },
        { status: 404 },
      );
    }

    const userId = paymentRequest.userId;

    logInfo("Creating Denefits proposal via API", {
      paymentId,
      userId,
      serviceAmount,
      downpaymentAmount,
      proposalType,
    });

    // Create Denefits proposal
    const result = await createDenefitsProposal({
      userId,
      serviceAmount,
      downpaymentAmount,
      serviceName,
      proposalType,
    });

    logInfo("Denefits proposal created successfully via API", {
      paymentId,
      userId,
      proposal_id: result.proposal_id,
      stored_doc_id: result.stored_doc_id,
    });

    return NextResponse.json({
      success: true,
      proposal_id: result.proposal_id,
      stored_doc_id: result.stored_doc_id,
      message:
        "Financing proposal created successfully. Check your email from Denefits.",
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    logError(
      error instanceof Error
        ? error
        : new Error("Unknown error creating Denefits proposal via API"),
      {
        errorDetails: error,
        errorMessage,
      },
    );

    // Return more specific error information
    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: error instanceof Error ? error.name : "UnknownError",
      },
      { status: 500 },
    );
  }
}
