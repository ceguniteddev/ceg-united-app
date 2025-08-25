import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/provider/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { AuthProvider } from "@/provider/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CEG United LLC",
  description: "CEG United LLC",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <QueryProvider>
        <TooltipProvider>
          <html lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
              <div className="root-layout">{children}</div>
              <Toaster richColors closeButton position="top-right" />
            </body>
          </html>
        </TooltipProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
