// ApplyFundingSuccessful.tsx
"use client";

import React from "react";
import dynamic from "next/dynamic";
import { CheckCircle2 } from "lucide-react";

// avoid SSR issues with the confetti package
const ConfettiExplosion = dynamic(() => import("react-confetti-explosion"), { ssr: false });

type ApplyFundingSuccessfulProps = {
  fire?: boolean; // re-burst whenever this toggles true
};

const ApplyFundingSuccessful: React.FC<ApplyFundingSuccessfulProps> = ({ fire = true }) => {
  const [isExploding, setIsExploding] = React.useState(false);

  React.useEffect(() => {
    if (fire) setIsExploding(true);
  }, [fire]);

  return (
    <div className="relative">
      {isExploding && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <ConfettiExplosion
            force={0.5}
            duration={4000}
            particleCount={220}
            width={1600}
            onComplete={() => setIsExploding(false)}
          />
        </div>
      )}

      <div className="mx-auto max-w-md text-center space-y-3 py-6">
        <div className="flex items-center justify-center">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>

        <h2 className="text-2xl font-semibold">Application submitted 🎉</h2>

        {/* Your requested message + the review note */}
        <p className="text-sm text-muted-foreground">
          Your funding application was submitted successfully. Our team will review your application
          and reach out with the next steps.
        </p>
      </div>
    </div>
  );
};

export default ApplyFundingSuccessful;
