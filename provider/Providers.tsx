"use client";

import { QueryProvider } from "@/provider/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { AuthProvider } from "@/provider/AuthContext";
import { I18nProvider } from "@/lib/i18n";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <I18nProvider>
        <AuthProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </TooltipProvider>
        </AuthProvider>
      </I18nProvider>
    </QueryProvider>
  );
}
