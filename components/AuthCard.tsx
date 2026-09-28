"use client";

/**
 * <AuthCard/>
 * -----------------------------------------------------------------
 * Self-contained sign-in card with dark cinematic design.
 * Features:
 *   - Email + password sign-in integrated with useAuth() and reCAPTCHA Enterprise
 *   - Client-side validation and humanized error messages
 *   - Password visibility toggle
 *   - Forgot password dialog integration
 *   - Direct routing to registration onboarding
 *   - NO Google Sign-In
 *   - Scoped .auth-* class names to prevent style leakage
 */
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/provider/AuthContext";
import { getCaptchaTokenRegistration } from "@/lib/captcha";
import { humanizeAuthError } from "@/lib/auth-errors";
import { validateEmail, validatePassword } from "@/lib/validation";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import ForgotPassword from "@/components/ForgotPassword";
import { AlertIcon, EyeIcon, EyeOffIcon, LockIcon, MailIcon } from "./Icons";

export type AuthMode = "signin" | "signup";

type Props = {
  initialMode?: AuthMode;
  onAuthed?: () => void;
};

export default function AuthCard({ initialMode = "signin", onAuthed }: Props) {
  const router = useRouter();
  const { signIn } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<{
    kind: "error" | "success";
    msg: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [openForgotPassword, setOpenForgotPassword] = useState(false);

  const switchMode = useCallback(
    (next: AuthMode) => {
      if (next === "signup") {
        router.push("/register");
        return;
      }
      setMode(next);
      setErrors({});
      setBanner(null);
    },
    [router],
  );

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBanner(null);
    const nextErrors: Record<string, string> = {};

    const em = validateEmail(email);
    if (em) nextErrors.email = em;
    const pw = validatePassword(password, { signup: false });
    if (pw) nextErrors.password = pw;

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const token = await getCaptchaTokenRegistration("login");
      await signIn(token, email, password);
      onAuthed?.();
    } catch (err: any) {
      const errorMessage = humanizeAuthError(err?.code, err?.message);
      setBanner({ kind: "error", msg: errorMessage });
    } finally {
      setBusy(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <>
      <ResponsiveDialog
        isOpen={openForgotPassword}
        setIsOpen={setOpenForgotPassword}
        title=""
        description=""
        className="w-full sm:w-2/3 lg:w-2/6"
      >
        <ForgotPassword setOpenForgotPassword={setOpenForgotPassword} />
      </ResponsiveDialog>

      <div className="auth-card-wrap auth-reveal d2">
        <div className="auth-card-glow" aria-hidden />
        <div className="auth-card-box">
          {/* Tabs */}
          <div
            className="auth-tabs"
            role="tablist"
            aria-label="Sign in or create account"
          >
            <button
              role="tab"
              aria-selected={!isSignup}
              className={`auth-tab-btn ${!isSignup ? "active" : ""}`}
              onClick={() => switchMode("signin")}
              type="button"
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={isSignup}
              className={`auth-tab-btn ${isSignup ? "active" : ""}`}
              onClick={() => switchMode("signup")}
              type="button"
            >
              Create account
            </button>
          </div>

          <h2 className="auth-card-title">
            {isSignup ? "Start free" : "Welcome back"}
          </h2>
          <p className="auth-card-lede">
            {isSignup
              ? "Create your account in under 2 minutes."
              : "Sign in to your CEG United dashboard."}
          </p>

          {banner && (
            <div
              className={`auth-alert ${banner.kind === "error" ? "auth-alert-error" : "auth-alert-success"}`}
              role="alert"
            >
              <AlertIcon /> <span>{banner.msg}</span>
            </div>
          )}

          <form onSubmit={handleEmailSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="ceg-email" className="auth-label">
                Email address
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <MailIcon />
                </span>
                <input
                  id="ceg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="auth-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : undefined}
                  required
                />
              </div>
              {errors.email && (
                <div id="err-email" className="auth-field-error">
                  <AlertIcon />
                  {errors.email}
                </div>
              )}
            </div>

            <div className="auth-field">
              <label htmlFor="ceg-password" className="auth-label">
                Password
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <LockIcon />
                </span>
                <input
                  id="ceg-password"
                  name="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Your password"
                  className="auth-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "err-password" : undefined
                  }
                  required
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  onClick={() => setShowPw((v) => !v)}
                >
                  {showPw ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {errors.password && (
                <div id="err-password" className="auth-field-error">
                  <AlertIcon />
                  {errors.password}
                </div>
              )}
            </div>

            <div className="auth-form-row">
              <label className="auth-checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me
              </label>
              <button
                type="button"
                className="auth-forgot-btn"
                onClick={() => setOpenForgotPassword(true)}
              >
                Forgot password?
              </button>
            </div>

            <button className="auth-btn-primary" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="auth-spinner" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="auth-card-foot">
            New to CEG? <Link href="/register">Create an account</Link>
          </div>

          <p className="auth-legal">
            By signing in, you agree to our{" "}
            <a
              href="https://www.cegunited.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="https://www.cegunited.com/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>
            .
          </p>
        </div>
      </div>
    </>
  );
}
