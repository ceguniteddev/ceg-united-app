"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";

export default function RecaptchaGate() {
  const pathname = usePathname();
  const shouldLoad = pathname === "/register" || pathname === "/";
  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      strategy="afterInteractive"
      src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
    />
  );
}
