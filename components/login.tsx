"use client";

import { useCallback, useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";
import { getCaptchaTokenRegistration } from "@/lib/captcha";

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setLoading(true);

      const token = await getCaptchaTokenRegistration("registration");
      try {
        await signIn(token, email, password);
      } catch (err: any) {
        setError(err.message || "Invalid email or password");
      }

      setLoading(false);
    },
    [email, password, signIn]
  );
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-700">
          Sign In to {process.env.NEXT_PUBLIC_APP_NAME}
        </h2>

        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

        <form onSubmit={handleLogin}>
          <fieldset disabled={loading}>
            <div className="mb-4">
              <Label className="block text-gray-600 font-medium mb-1">Email Address</Label>
              <Input
                type="email"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <Label className="block text-gray-600 font-medium mb-1">Password</Label>
              <Input
                type="password"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
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
      </div>
    </div>
  );
}
