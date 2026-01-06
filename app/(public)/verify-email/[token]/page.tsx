"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Clock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface VerificationResult {
  success: boolean;
  message: string;
  email?: string;
}

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationResult({
          success: false,
          message: "Invalid verification link.",
        });
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email/${token}`);
        const data = await response.json();

        if (!response.ok) {
            console.log(data)
          setVerificationResult({
            success: false,
            message: data.errors || "Verification failed.",
          });
        } else {
          setVerificationResult(data);
        }
      } catch (error) {
        console.error("Error verifying email:", error);
        setVerificationResult({
          success: false,
          message: "An error occurred during verification. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Image
            src="/icon.png"
            alt={process.env.NEXT_PUBLIC_APP_NAME as string}
            width={80}
            height={80}
            className="sm:w-[100px] sm:h-[100px]"
          />
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">
              Email Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600 text-center">
                  Verifying your email address...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6">
                {verificationResult?.success ? (
                  <>
                    <div className="bg-green-100 rounded-full p-3 mb-4">
                      <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-green-700 mb-2">
                      Success!
                    </h3>
                    <p className="text-gray-700 text-center mb-2">
                      {verificationResult.message}
                    </p>
                    {verificationResult.email && (
                      <p className="text-sm text-gray-600 mb-6">
                        Email: <strong>{verificationResult.email}</strong>
                      </p>
                    )}
                    <Button
                      onClick={handleGoToLogin}
                      className="w-full bg-green-500 hover:bg-green-600 text-white"
                    >
                      Go to Login
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="bg-red-100 rounded-full p-3 mb-4">
                      {verificationResult?.message.includes("expired") ? (
                        <Clock className="h-12 w-12 text-orange-600" />
                      ) : (
                        <XCircle className="h-12 w-12 text-red-600" />
                      )}
                    </div>
                    <h3
                      className={`text-xl font-semibold mb-2 ${
                        verificationResult?.message.includes("expired")
                          ? "text-orange-700"
                          : "text-red-700"
                      }`}
                    >
                      {verificationResult?.message.includes("expired")
                        ? "Link Expired"
                        : "Verification Failed"}
                    </h3>
                    <p className="text-gray-700 text-center mb-6">
                      {verificationResult?.message}
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                      <Button
                        onClick={handleGoToLogin}
                        variant="outline"
                        className="w-full"
                      >
                        Go to Login
                      </Button>
                      <Link href="/register" className="w-full">
                        <Button variant="ghost" className="w-full">
                          Register New Account
                        </Button>
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center mt-4 text-sm text-gray-600">
          <p>
            Need help?{" "}
            <a
              href="mailto:contact@cegunited.com"
              className="text-blue-600 hover:underline"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
