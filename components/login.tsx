"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";
import Image from "next/image";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { LoaderIcon, LogInIcon, Eye, EyeOff } from "lucide-react";
import { ResponsiveDialog } from "./responsive-dialog";
import ForgotPassword from "./ForgotPassword";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      const token = await getCaptchaTokenRegistration("login");
      try {
        await signIn(token, email, password);
      } catch (err: any) {
        setError(err.message || "Invalid email or password");
      }

      setLoading(false);
    },
    [email, password, signIn],
  );

  return (
    <div className="flex items-center justify-center w-full px-4 sm:px-6">
      <ResponsiveDialog
        isOpen={openForgotPassword}
        setIsOpen={setOpenForgotPassword}
        title=""
        description={""}
        className="w-full sm:w-2/3 lg:w-2/6"
      >
        <ForgotPassword setOpenForgotPassword={setOpenForgotPassword} />
      </ResponsiveDialog>
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-4">
          <Image
            src="/icon.png"
            alt="Logo"
            width={80}
            height={80}
            className="object-contain"
          />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-center mb-6 text-gray-700">
          Sign In to {process.env.NEXT_PUBLIC_APP_NAME}
        </h2>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleLogin}>
          <fieldset disabled={loading}>
            <div className="mb-4">
              <Label className="block text-gray-600 font-medium mb-1 text-sm">
                Email Address
              </Label>
              <Input
                type="email"
                className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="mb-2">
              <Label className="block text-gray-600 font-medium mb-1 text-sm">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pr-10 text-sm border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mb-5 flex justify-end">
              <Link
                href=""
                className={`text-sm font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  loading ? "pointer-events-none opacity-60" : "text-blue-600"
                }`}
                aria-disabled={loading}
                onClick={() => setOpenForgotPassword(true)}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] py-2.5 text-sm bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition cursor-pointer disabled:opacity-70"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoaderIcon className="animate-spin h-4 w-4" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <LogInIcon className="h-4 w-4" />
                  <span>Sign In</span>
                </div>
              )}
            </button>
          </fieldset>
        </form>

        <div className="text-sm text-gray-600 text-center mt-4">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2"
          >
            Register here
          </Link>
        </div>

        <div className="text-xs text-gray-500 text-center mt-3 pt-3 border-t border-gray-100">
          By signing in, you agree to our{" "}
          <a
            href="https://www.cegunited.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline underline-offset-2 hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-1"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}
