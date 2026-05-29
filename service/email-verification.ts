"use server";

import { firestoreAdmin, authenticationAdmin } from "@/lib/fireabase-admin";
import { EMAIL_VERIFICATION_TOKENS } from "@/constant/collection-name";
import { randomBytes } from "crypto";
import AppError from "@/error/AppError";
import { Timestamp } from "firebase-admin/firestore";
import {
  fundAnalysis,
  generateCRSReport,
  getCRSReport,
  requestMapBankProductsN8nNewRegistration,
  sendClientFundingApplicationAuditAnalysis,
  sendClientFundingApplicationCongratsMessage,
  sendClientFundingApplicationCongratsMessageNewRegistration,
} from "./crs";
import { RegistrationType } from "@/schema/users";
import { logInfo } from "@/lib/logger";

interface VerificationToken {
  userId: string;
  email: string;
  token: string;
  referenceNumber?: string;
  createdAt: Date;
  expiresAt: Date;
  verified: boolean;
  registrationType: RegistrationType;
}

/**
 * Generate a unique email verification token for a user
 */
export const generateEmailVerificationToken = async ({
  userId,
  email,
  referenceNumber,
  registrationType,
}: {
  userId: string;
  email: string;
  referenceNumber?: string;
  registrationType: RegistrationType;
}): Promise<string> => {
  const db = firestoreAdmin();
  const token = randomBytes(32).toString("hex");

  const verificationData: VerificationToken = {
    userId,
    email,
    token,
    referenceNumber,
    registrationType,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    verified: false,
  };

  await db
    .collection(EMAIL_VERIFICATION_TOKENS)
    .doc(token)
    .set({
      ...verificationData,
      createdAt: Timestamp.now(),
      expiresAt: Timestamp.fromDate(verificationData.expiresAt),
    });

  return token;
};

/**
 * Verify email token and update user authentication
 */
export const verifyEmailToken = async (
  token: string,
): Promise<{ success: boolean; message: string; email?: string }> => {
  const db = firestoreAdmin();
  const authAdmin = authenticationAdmin();

  try {
    const tokenDoc = await db
      .collection(EMAIL_VERIFICATION_TOKENS)
      .doc(token)
      .get();

    if (!tokenDoc.exists) {
      logInfo(
        "Invalid verification link. Please request a new verification email.",
      );
      return {
        success: false,
        message:
          "Invalid verification link. Please request a new verification email.",
      };
    }

    const tokenData = tokenDoc.data() as VerificationToken & {
      createdAt: FirebaseFirestore.Timestamp;
      expiresAt: FirebaseFirestore.Timestamp;
    };

    // Check if already verified
    if (tokenData.verified) {
      logInfo("Email has already been verified. You can now log in");
      return {
        success: true,
        message: "Email has already been verified. You can now log in.",
        email: tokenData.email,
      };
    }

    // Check if token expired
    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();
    if (now > expiresAt) {
      logInfo(
        "Verification link has expired. Please request a new verification email.",
      );
      return {
        success: false,
        message:
          "Verification link has expired. Please request a new verification email.",
      };
    }

    // Update Firebase Auth user emailVerified status
    await authAdmin.updateUser(tokenData.userId, {
      emailVerified: true,
    });

    // Mark token as verified
    await db.collection(EMAIL_VERIFICATION_TOKENS).doc(token).update({
      verified: true,
      verifiedAt: Timestamp.now(),
    });

    // Trigger CRS and Funding Analysis if referenceNumber exists
    if (tokenData.referenceNumber) {
      console.log("Triggering CRS and Funding Analysis for:", {
        userId: tokenData.userId,
        referenceNumber: tokenData.referenceNumber,
      });

      try {
        // const data = await getCRSReport(tokenData.userId);

        // if (!data || data.length === 0) {
        //   await generateCRSReport({
        //     userId: tokenData.userId,
        //     referenceNumber: tokenData.referenceNumber,
        //     bureaus: { equifax: true, experian: true, transunion: true },
        //   });
        // }

        // await fundAnalysis({
        //   referenceNumber: tokenData.referenceNumber,
        //   userId: tokenData.userId,
        // });

        // Send Client Congrats Message
        await sendClientFundingApplicationCongratsMessageNewRegistration({
          userId: tokenData.userId,
          referenceNumber: tokenData.referenceNumber,
        });

        // await requestMapBankProductsN8nNewRegistration({
        //   userId: tokenData.userId,
        //   referenceNumber: tokenData.referenceNumber,
        // });

        // Send Client Audit Analysis
        // await sendClientFundingApplicationAuditAnalysis({
        //   userId: tokenData.userId,
        //   referenceNumber: tokenData.referenceNumber,
        // });

        console.log("Successfully triggered analysis for verified user");
      } catch (analysisError) {
        console.error("Error triggering analysis:", analysisError);
        // Don't fail the verification if analysis fails
      }
    }

    return {
      success: true,
      message:
        "Email verified successfully! You can now log in to your account.",
      email: tokenData.email,
    };
  } catch (error) {
    console.error("Error verifying email token:", error);
    throw new AppError(
      "An error occurred while verifying your email. Please try again later.",
    );
  }
};

/**
 * Get verification status by token
 */
export const getVerificationTokenStatus = async (
  token: string,
): Promise<{
  exists: boolean;
  verified: boolean;
  expired: boolean;
  email?: string;
}> => {
  const db = firestoreAdmin();

  try {
    const tokenDoc = await db
      .collection(EMAIL_VERIFICATION_TOKENS)
      .doc(token)
      .get();

    if (!tokenDoc.exists) {
      return { exists: false, verified: false, expired: false };
    }

    const tokenData = tokenDoc.data() as VerificationToken & {
      expiresAt: FirebaseFirestore.Timestamp;
    };

    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();
    const expired = now > expiresAt;

    return {
      exists: true,
      verified: tokenData.verified,
      expired,
      email: tokenData.email,
    };
  } catch (error) {
    console.error("Error getting verification token status:", error);
    throw new AppError("An error occurred. Please try again later.");
  }
};
