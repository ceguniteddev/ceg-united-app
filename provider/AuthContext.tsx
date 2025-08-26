"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { authFirebase } from "@/lib/firebase";
import { createSession, deleteCookie, logoutSession } from "@/lib/session";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";
import { getUser } from "@/service/user";
import { Role } from "@/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useSelectedInstitutionStoreStore } from "@/store/plaid";

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
    const userRole = userData?.role ?? "Staff";

    setUser(firebaseUser);
    setRole(userRole);
    setIsAdmin(userRole === "Admin" || userRole === "IT");
  }, []);

  const logOut = useCallback(async () => {
    // 1. Revoke server session and delete cookie
    await logoutSession();
    // 2. Sign out from Firebase client
    await signOut(authFirebase);
    // 3. Clear local state
    setUser(null);
    setRole(null);
    setIsAdmin(false);
    queryClient.clear();
    reset();
    // 4. Redirect to home
    router.push("/");
  }, [router, queryClient, reset]);

  // useEffect now only syncs client state with Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(authFirebase, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // User is signed in on the client. Load their role and update state.
          await loadAndSetUserData(firebaseUser);
        } else {
          // User is signed out. Clear all local state.
          setUser(null);
          setRole(null);
          setIsAdmin(false);
        }
      } catch (error) {
        // If loading user data fails, treat it as a logout
        console.error("Error during auth state change:", error);
        await logOut();
      } finally {
        // We are done with the initial auth check
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [loadAndSetUserData, logOut]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        // 1. Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(authFirebase, email, password);
        const firebaseUser = userCredential.user;

        // 2. Get the ID token from the signed-in user
        const idToken = await firebaseUser.getIdToken(true);

        // 3. Create the server-side session cookie (THIS IS THE KEY CHANGE)
        await createSession(idToken);

        // 4. Load the user's role and set the local state
        await loadAndSetUserData(firebaseUser);

        // 5. Redirect to the desired page
        router.push("/overview");
      } catch (error) {
        console.error("Error signing in:", error);
        // Ensure no stale cookie if sign-in fails
        deleteCookie(FIREBASE_TOKEN_NAME);
        throw new Error("Invalid email or password.");
      }
    },
    [router, loadAndSetUserData]
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
