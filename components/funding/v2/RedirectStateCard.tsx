// ============================================
// RedirectStateCard — Overlay modal before external redirect
// ============================================
// Shows confirmation before redirecting to lender's website

import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RedirectStateCardProps {
  lenderName: string;
  applicationUrl?: string;
  onBack: () => void;
}

export function RedirectStateCard({
  lenderName,
  applicationUrl,
  onBack,
}: RedirectStateCardProps) {
  const handleRedirect = () => {
    if (applicationUrl) {
      window.open(applicationUrl, "_blank");
    }
    // Close overlay after opening link
    setTimeout(() => {
      onBack();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fade-in-up">
        {/* Icon */}
        <div className="size-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="size-8 text-blue-600" />
        </div>

        {/* Content */}
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Ready to Apply
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          You&apos;ll be redirected to <strong>{lenderName}</strong>&apos;s
          secure application portal. Please complete the application there.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-gray-700 leading-relaxed">
            <strong>Note:</strong> Keep your documents ready (ID, bank
            statements, tax returns) to complete the application smoothly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="group flex-1 border-gray-300 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft className="size-4 mr-2 transition-all group-hover:stroke-[2.5]" />
            Back
          </Button>
          <Button
            onClick={handleRedirect}
            className="group flex-1 bg-blue-600 hover:bg-blue-700 text-white transition-all"
          >
            Continue
            <ExternalLink className="size-4 ml-2 transition-all group-hover:fill-white group-hover:stroke-[1.5]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
