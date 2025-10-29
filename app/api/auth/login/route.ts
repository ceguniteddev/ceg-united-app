import { NextRequest, NextResponse } from "next/server";
import { signInWithEmailAndPassword } from "firebase/auth";
import { authFirebase } from "@/lib/firebase";
import { getUser, getUserById } from "@/service/user";
import { Role } from "@/schema";
import z from "zod";
import { badRequest, getMessage } from "@/app/api/helpers";

const querySchema = z
  .object({
    email: z.email({
      error: "Email is required",
    }),

    password: z.string({
      error: "Password is required",
    }),
  })
  .strict();

export async function POST(request: NextRequest) {
  const requestBody = await request.json();
  const result = querySchema.safeParse(requestBody);

  if (!result.success) {
    console.info("Validation failed");
    console.log(result.error);
    const message = getMessage(result.error);
    return badRequest({ errors: message });
  }

  try {
    const { email, password } = result.data;
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const userCredential = await signInWithEmailAndPassword(
      authFirebase,
      email,
      password
    );
    const firebaseUser = userCredential.user;

    if (!firebaseUser.emailVerified) {
      return NextResponse.json(
        { message: "Please verify your email before signing in." },
        { status: 403 }
      );
    }

    const userData = await getUserById(firebaseUser.uid);
    if (!userData) {
      return NextResponse.json({ message: "User not found" }, { status: 403 });
    }
    const nextRole = userData.role ?? "Client";

    const idToken = await firebaseUser.getIdToken();

    return NextResponse.json(
      {
        token: idToken,
        role: nextRole,
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        emailVerified: firebaseUser.emailVerified,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login API Error:", error);

    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "An internal server error occurred." },
      { status: 500 }
    );
  }
}
