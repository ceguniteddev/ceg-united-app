"use server";
import { cookies } from "next/headers";
import { authenticationAdmin } from "./fireabase-admin";
import { FIREBASE_TOKEN_NAME } from "@/constant/common";

export const createSession = async (idToken: string) => {
  if (!idToken) return null;

  try {
    const decodedToken = await authenticationAdmin().verifyIdToken(idToken);
    if (!decodedToken) {
      throw new Error("Invalid ID token.");
    }

    const expiresIn = 1 * 60 * 60 * 1000;
    const sessionCookie = await authenticationAdmin().createSessionCookie(idToken, {
      expiresIn,
    });

    await setCookie(FIREBASE_TOKEN_NAME, sessionCookie, {
      maxAge: expiresIn / 1000,
    });
  } catch (error: any) {
    console.error("Error creating session:", error.message);
    throw new Error("Error creating session.");
  }
};

export const setCookie = async (key: string, value: string, options = {}) => {
  const cookieStore = await cookies();
  cookieStore.set({
    name: key,
    value: value,
    httpOnly: true,
    secure: process.env.ENVIRONMENT === "production",
    sameSite: "strict",
    path: "/",
    ...options,
  });
};

export const getCookie = async (key: string) => {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(key);
  return cookie ? cookie.value : null;
};

export const deleteCookie = async (key: string) => {
  console.log("deleteCookie", key);
  const cookieStore = await cookies();
  cookieStore.delete(key);
};
export const logoutSession = async () => {
  try {
    const sessionCookie = await getCookie(FIREBASE_TOKEN_NAME);
    console.log("sessionCookie", sessionCookie);
    if (sessionCookie) {
      console.log("revokeAllSessions", sessionCookie);
      await revokeAllSessions(sessionCookie);

      await deleteCookie(FIREBASE_TOKEN_NAME);
    }
  } catch (error: any) {
    console.error("Error during logout:", error.message);
    await deleteCookie(FIREBASE_TOKEN_NAME);
  }
};

export const revokeAllSessions = async (sessionCookie: string) => {
  const auth = authenticationAdmin();
  const decodedIdToken = await auth.verifySessionCookie(sessionCookie);
  await auth.revokeRefreshTokens(decodedIdToken.sub);
};

export const verifySession = async (sessionCookie: string) => {
  try {
    const decodedClaims = await authenticationAdmin().verifySessionCookie(sessionCookie, true);
    return decodedClaims;
  } catch (error) {
    console.error("Error verifying session:", error);
    return null;
  }
};
