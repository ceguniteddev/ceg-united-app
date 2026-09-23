/**
 * Lightweight client-side validators for authentication forms.
 */

export function validateEmail(email: string): string | null {
  if (!email) return "Email is required.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(email)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(
  pw: string,
  opts: { signup?: boolean } = {},
): string | null {
  if (!pw) return "Password is required.";
  if (opts.signup) {
    if (pw.length < 8) return "Use at least 8 characters.";
    if (!/[0-9\W]/.test(pw)) return "Include at least one number or symbol.";
  }
  return null;
}

export function validateName(name: string): string | null {
  if (!name || name.trim().length < 2) return "Please enter your full name.";
  return null;
}
