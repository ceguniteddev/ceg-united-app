"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
  onIdTokenChanged,
} from "firebase/auth";
import { authFirebase } from "@/lib/firebase";
import { createSession, deleteCookie, logoutSession, refreshSession } from "@/lib/session";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { getUser } from "@/service/user";
import { Role } from "@/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useSelectedInstitutionStoreStore } from "@/store/plaid";
import { verifyCaptchaToken } from "@/lib/captcha/captcha";
import AppError from "@/error/AppError";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  role: Role | null;
  loading: boolean;
  signIn: (token: string | null, email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Still true to prevent flicker on load
  const router = useRouter();
  const queryClient = useQueryClient();
  const { reset } = useSelectedInstitutionStoreStore();

  // Helper function to load user role and set state
  const loadAndSetUserData = useCallback(async (firebaseUser: User) => {
    // No need to create a session here, just get user data
    const userData = await getUser(firebaseUser.email || "");
    if (!userData) {
      throw new AppError("User not found.");
    }
    const userRole = userData?.role ?? ("Admin" as Role);

    setUser(firebaseUser);
    setRole(userRole as Role);
    setIsAdmin(userRole === "Admin" || userRole === "IT");
  }, []);

  const logOut = useCallback(async () => {
    await Promise.all([await logoutSession(), await authFirebase.signOut()]);

    await queryClient.cancelQueries({ predicate: () => true });
    queryClient.clear();
    reset();
    setUser(null);
    setRole(null);
    setIsAdmin(false);

    router.push("/");
  }, [router, queryClient, reset]);

  useEffect(() => {
    if (!authFirebase) return;
    let lastRefresh = 0;

    const unsub = onIdTokenChanged(authFirebase, async (u) => {
      if (!u) return;
      // throttle to ~30 mins to avoid spamming server actions
      const now = Date.now();
      if (now - lastRefresh < 30 * 60 * 1000) return;
      lastRefresh = now;

      const token = await u.getIdToken(/* forceRefresh? false */);
      try {
        await refreshSession(token); // server action
      } catch (e) {
        console.error("refreshSession failed", e);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authFirebase, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await loadAndSetUserData(firebaseUser);
        } else {
          setUser(null);
          setRole(null);
          setIsAdmin(false);
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
    });
    return () => unsubscribe();
  }, [loadAndSetUserData]);

  const signIn = useCallback(
    async (token: string | null, email: string, password: string) => {
      try {
        if (!token) throw new AppError("Captcha token is missing. Please try again.");

        const captchaData = await verifyCaptchaToken(token);
        if (!captchaData?.success || captchaData.score < 0.5 || captchaData.action !== "login") {
          throw new AppError("Captcha verification failed. Please try again.");
        }

        const userRole = await getUser(email || "");
        if (!userRole) throw new AppError("Invalid email or password.");

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
        if (!firebaseUser?.emailVerified)
          throw new AppError("Please verify your email before signing in.");

        const idToken = await firebaseUser.getIdToken(true);
        await createSession(idToken);

        await queryClient.cancelQueries({ predicate: () => true });
        queryClient.clear();
        reset();

        // Single source of truth for user/role
        await loadAndSetUserData(firebaseUser);

        // Use the role you just set instead of refetching
        const nextRole = userRole.role ?? ("Admin" as Role);
        router.push(nextRole === "Client" ? "/overview" : "/admin");
      } catch (error) {
        if (error instanceof AppError) throw error;
        try {
          await deleteCookie(FIREBASE_TOKEN_NAME);
        } catch {}
        throw new Error("Invalid email or password.");
      }
    },
    [loadAndSetUserData, queryClient, reset, router]
  );

  const authContextValue = useMemo(
    () => ({ user, role, isAdmin, signIn, logOut, loading }),
    [user, role, isAdmin, signIn, logOut, loading]
  );

  return <AuthContext.Provider value={authContextValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
