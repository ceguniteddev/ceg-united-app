import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, IBM_Plex_Serif } from "next/font/google";
import "./globals.css";
import Providers from "@/provider/Providers";
// import Script from "next/script";
import RecaptchaGate from "@/components/RecaptchaGate";
import { ConfettiProvider } from "@/provider/confetti-provider";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ibm-plex-serif",
});

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
  icons: {
    icon: "/icon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${ibmPlexSerif.variable} antialiased h-full overflow-hidden pb-[env(safe-area-inset-bottom)]`}
      >
        <Providers>
          <ConfettiProvider />
          <div className="h-full w-full">{children}</div>
          {/* <Script
            strategy="afterInteractive"
            src={`https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`}
          /> */}
          <RecaptchaGate />
        </Providers>
      </body>
    </html>
  );
}
