"use client";

import { Suspense } from "react";
import Image from "next/image";
import Spinner from "@/components/Spinner";
import { PublicRegistrationForm } from "@/components/new-registration/PublicRegistrationForm";

export default function NewRegistrationPage() {
  return (
    <div className="p-3 sm:p-4 md:p-6 min-h-screen">
      <div className="flex justify-center items-center mb-6 sm:mb-8">
        <Image
          src="/icon.png"
          alt="Logo"
          width={548}
          height={455}
          className="h-20 w-auto object-contain"
        />
      </div>
      <Suspense fallback={<Spinner />}>
        <PublicRegistrationForm />
      </Suspense>
    </div>
  );
}
