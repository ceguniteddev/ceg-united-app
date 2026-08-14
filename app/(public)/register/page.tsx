"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogIn } from "lucide-react";
import Spinner from "@/components/Spinner";
import { PublicRegistrationForm } from "@/components/new-registration/PublicRegistrationForm";
import { Button } from "@/components/ui/button";

export default function NewRegistrationPage() {
  return (
    <div className="p-3 sm:p-4 md:p-6 min-h-screen">
      <div className="w-full max-w-[95vw] sm:max-w-[900px] lg:max-w-[1000px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8 pb-4 border-b border-gray-100">
        <Image
          src="/icon.png"
          alt="Logo"
          width={548}
          height={455}
          className="h-16 sm:h-20 w-auto object-contain"
        />
        <div className="flex items-center gap-3 bg-blue-50/60 px-4 py-2 rounded-full border border-blue-100">
          <span className="text-sm font-medium text-slate-700 whitespace-nowrap">
            Already have an account?
          </span>
          <Button
            asChild
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full px-4 shadow-sm"
          >
            <Link href="/" className="flex items-center gap-1.5">
              <LogIn className="h-4 w-4" />
              <span>Log in</span>
            </Link>
          </Button>
        </div>
      </div>
      <Suspense fallback={<Spinner />}>
        <PublicRegistrationForm />
      </Suspense>
    </div>
  );
}
