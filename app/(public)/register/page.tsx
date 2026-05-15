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
          alt={(process.env.NEXT_PUBLIC_APP_NAME as string) || "CEG United"}
          width={80}
          height={80}
          className="sm:w-[80px] sm:h-[60px]"
        />
      </div>
      <Suspense fallback={<Spinner />}>
        <PublicRegistrationForm />
      </Suspense>
    </div>
  );
}
