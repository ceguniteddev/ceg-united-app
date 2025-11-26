"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  User,
} from "firebase/auth";
import { authFirebase } from "@/lib/firebase";
import { createSession, deleteCookie, logoutSession } from "@/lib/session";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { getUserById } from "@/service/user";
import { Role } from "@/schema";
import { useQueryClient } from "@tanstack/react-query";
import { createEnterpriseAssessment } from "@/lib/captcha/captcha";
import AppError from "@/error/AppError";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isBroker: boolean;
  isOnboarded: boolean;
  role: Role | null;
  loading: boolean;
  signIn: (
    token: string | null,
    email: string,
    password: string
  ) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (token: string | null, email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBroker, setIsBroker] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [loading, setLoading] = useState(true); // Still true to prevent flicker on load
  const [isLoggingIn, setIsLoggingIn] = useState(false); // Track if user is actively logging in
  const router = useRouter();
  const queryClient = useQueryClient();

  // Helper function to load user role and set state
  const loadAndSetUserData = useCallback(async (firebaseUser: User) => {
    if (!firebaseUser) {
      return;
    }
    // No need to create a session here, just get user data
    const userData = await getUserById(firebaseUser.uid);
    if (!userData) {
      return;
    }
    const userRole = userData?.role ?? "Client";

    setUser(firebaseUser);
    setRole(userRole as Role);
    setIsAdmin(userRole === "Admin");
    setIsBroker(userRole === "Broker");
    setIsOnboarded(userData.isOnboarded || false);
  }, []);

  const logOut = useCallback(async () => {
    await Promise.all([await logoutSession(), await authFirebase.signOut()]);
    router.push("/");

    setUser(null);
    setRole(null);
    setIsAdmin(false);
    setIsBroker(false);
    setIsOnboarded(false);

    await queryClient.cancelQueries({ predicate: () => true });
    queryClient.clear();
  }, [router, queryClient]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      authFirebase,
      async (firebaseUser) => {
        try {
          if (firebaseUser) {
            await loadAndSetUserData(firebaseUser);
          } else {
            setUser(null);
            setRole(null);
            setIsAdmin(false);
            setIsBroker(false);
            setIsOnboarded(false);
          }
        } catch (error) {
          console.error("Error during auth state change:", error);
          // DO NOT call logOut() here.
          // Optionally keep firebaseUser and use a cached role, or default to 'Staff'.
          if (firebaseUser) {
            setUser(firebaseUser);
            setRole((r) => r ?? ("Staff" as Role));
          }
        } finally {
          setLoading(false);
        }
      }
    );
    return () => unsubscribe();
  }, [loadAndSetUserData]);

  // Check session validity periodically and refresh if needed
  useEffect(() => {
    if (!user || isLoggingIn) return; // Skip check if user is actively logging in

    const checkAndRefreshSession = async () => {
      try {
        // Get a fresh Firebase ID token (force refresh)
        const idToken = await user.getIdToken(true);

        // Verify the server-side session cookie is still valid
        const response = await fetch("/api/auth/verify-session");
        if (!response.ok) {
          await logOut();
          return;
        }

        // Refresh the session to extend expiration by another 6 hours
        await fetch("/api/auth/refresh-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idToken }),
        });
      } catch (error) {
        console.error("Session check/refresh error:", error);
        // Session is invalid, logout and redirect
        await logOut();
      }
    };

    // Delay initial check by 2 seconds to allow session cookie to be set
    const timeoutId = setTimeout(checkAndRefreshSession, 2000);

    // Then check and refresh every 30 minutes (halfway through 6-hour session)
    const intervalId = setInterval(checkAndRefreshSession, 30 * 60 * 1000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [user, logOut, isLoggingIn]);

  const signIn = useCallback(
    async (token: string | null, email: string, password: string) => {
      try {
        setIsLoggingIn(true); // Mark that login is in progress

        if (!token)
          throw new AppError("Failed to login. Please refresh the page.");

        const captchaData = await createEnterpriseAssessment(token, "login");

        if (!captchaData || captchaData.score < 0.5) {
          throw new AppError("Captcha verification failed. Please try again.");
        }

        // local cleanup only; don't revoke all sessions
        try {
          await authFirebase.signOut();
        } catch {}
        try {
          await deleteCookie(FIREBASE_TOKEN_NAME);
        } catch {}

        const { user: firebaseUser } = await signInWithEmailAndPassword(
          authFirebase,
          email,
          password
        );

        if (!firebaseUser?.emailVerified) {
          throw new AppError("Please verify your email before signing in.");
        }

        const userData = await getUserById(firebaseUser.uid);
        if (!userData) throw new AppError("Invalid email or password.");

        if (userData.activeStatus === "InActive") {
          throw new AppError(
            "Your account has been deactivated. Please contact contact@cegunited.com."
          );
        }

        const idToken = await firebaseUser.getIdToken(true);
        await createSession(idToken);

        await queryClient.cancelQueries({ predicate: () => true });
        queryClient.clear();

        // Single source of truth for user/role
        await loadAndSetUserData(firebaseUser);

        // Use the role you just set instead of refetching
        const nextRole = userData.role || "Client";

        // Small delay to ensure session cookie is fully set before navigation
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Route based on user role
        if (nextRole === "Admin") {
          router.push("/admin/home");
        } else if (nextRole === "Broker") {
          router.push("/broker/home");
        } else {
          router.push("/client/home");
        }
      } catch (error) {
        if (error instanceof AppError) throw error;
        try {
          await deleteCookie(FIREBASE_TOKEN_NAME);
        } catch {}
        throw new Error("Invalid email or password.");
      } finally {
        setIsLoggingIn(false); // Reset login flag
      }
    },
    [loadAndSetUserData, queryClient, router]
  );

  const resetPassword = useCallback(
    async (token: string | null, email: string) => {
      if (!token)
        throw new AppError("Failed to login. Please refresh the page.");

      const captchaData = await createEnterpriseAssessment(
        token,
        "forgot_password"
      );
      if (!captchaData || captchaData.score < 0.5) {
        throw new AppError("Captcha verification failed. Please try again.");
      }

      // Optional: where Firebase should redirect after the user finishes reset flow
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const actionCodeSettings = appUrl
        ? { url: `${appUrl}/login?reset=1`, handleCodeInApp: false }
        : undefined;

      try {
        await sendPasswordResetEmail(authFirebase, email, actionCodeSettings);
        // NOTE: Do not reveal whether the email exists.
      } catch (err: any) {
        // Avoid user enumeration; swallow 'user-not-found'
        if (err?.code === "auth/user-not-found") return;
        // Surface a generic message to the UI
        throw new Error("Unable to send reset link. Please try again.");
      }
    },
    []
  );

  const authContextValue = useMemo(
    () => ({
      user,
      role,
      isAdmin,
      isBroker,
      signIn,
      logOut,
      loading,
      isOnboarded,
      resetPassword,
    }),
    [
      user,
      role,
      isAdmin,
      isBroker,
      signIn,
      logOut,
      loading,
      isOnboarded,
      resetPassword,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
