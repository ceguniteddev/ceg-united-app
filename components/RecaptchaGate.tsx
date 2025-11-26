"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

export default function RecaptchaGate() {
  const pathname = usePathname();
  const [scriptKey, setScriptKey] = useState(0);
  const shouldLoad = pathname === "/register" || pathname === "/";

  useEffect(() => {
    if (shouldLoad) {
      // Force script reload when navigating to these routes
      setScriptKey((prev) => prev + 1);
    }
  }, [shouldLoad, pathname]);

  if (!shouldLoad) {
    return null;
  }

  return (
    <Script
      key={scriptKey}
      strategy="afterInteractive"
      src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
      onLoad={() => {
        console.log("reCAPTCHA loaded successfully");
      }}
    />
  );
}
