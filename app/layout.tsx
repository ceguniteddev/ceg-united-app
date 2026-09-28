import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Serif, Caveat } from "next/font/google";
import "./globals.css";
import Providers from "@/provider/Providers";
import RecaptchaGate from "@/components/RecaptchaGate";
import { ConfettiProvider } from "@/provider/confetti-provider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ibmPlexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-ibm-plex-serif",
});
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
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
        className={`${inter.variable} ${ibmPlexSerif.variable} ${caveat.variable} antialiased h-full overflow-hidden pb-[env(safe-area-inset-bottom)]`}
      >
        <Providers>
          <ConfettiProvider />
          <div className="h-full w-full">{children}</div>
          <RecaptchaGate />
        </Providers>
      </body>
    </html>
  );
}
