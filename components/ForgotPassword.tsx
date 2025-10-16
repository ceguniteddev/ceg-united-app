"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { LoaderIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  setOpenForgotPassword: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ForgotPasswordPage({ setOpenForgotPassword }: Props) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReset = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);

      try {
        const token = await getCaptchaTokenRegistration("forgot_password");
        await resetPassword(token, email);
        setSuccess(
          "If an account exists for that email, a reset link has been sent."
        );
        setOpenForgotPassword(false);
        toast.success("Password reset link sent.");
      } catch (err: any) {
        setError(
          err?.message || "Unable to send reset link. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [email, resetPassword, setOpenForgotPassword]
  );

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
          Reset your password
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        {success && (
          <p className="text-green-600 text-sm text-center mb-4">{success}</p>
        )}

        <form onSubmit={handleReset}>
          <fieldset disabled={loading}>
            <div className="mb-4">
              <Label className="block text-gray-600 font-medium mb-1">
                Email Address
              </Label>
              <Input
                type="email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition cursor-pointer disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoaderIcon className="animate-spin h-4 w-4" />
                  Resetting…
                </div>
              ) : (
                "Reset"
              )}
            </button>
          </fieldset>
        </form>

        <div className="text-sm text-gray-600 text-center mt-4">
          Remembered it?{" "}
          <Link
            href=""
            onClick={() => setOpenForgotPassword(false)}
            className="font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
