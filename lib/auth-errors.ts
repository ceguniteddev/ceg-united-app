/**
 * Human-readable messages for Firebase Auth error codes.
 */
export function humanizeAuthError(
  code?: string,
  fallbackMessage?: string,
): string {
  if (fallbackMessage && !code) {
    return fallbackMessage;
  }

  switch (code) {
    // Sign-in
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "That email and password don’t match. Try again or reset your password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/user-disabled":
      return "This account is disabled. Contact support at support@cegunited.com.";

    // Sign-up
    case "auth/email-already-in-use":
      return "An account with that email already exists. Try signing in instead.";
    case "auth/weak-password":
      return "Password is too weak. Use 8+ characters with a number or symbol.";
    case "auth/invalid-email":
      return "That email address doesn’t look right.";

    // Network
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";

    default:
      return (
        fallbackMessage ||
        "Something went wrong. Please try again — if it keeps happening, contact support."
      );
  }
}
