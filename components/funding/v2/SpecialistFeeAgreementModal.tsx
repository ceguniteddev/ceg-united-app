"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { FileSignature, Loader2, CheckCircle } from "lucide-react";
import { signSpecialistFeeAgreement } from "@/service/bank-products";
import { toast } from "sonner";

interface SpecialistFeeAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  referenceNumber: string;
  userId: string;
  bankName: string;
  onSignComplete: () => void;
  fundMappingApprovedId: string;
}

export function SpecialistFeeAgreementModal({
  isOpen,
  onClose,
  referenceNumber,
  userId,
  bankName,
  onSignComplete,
  fundMappingApprovedId,
}: SpecialistFeeAgreementModalProps) {
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"type" | "draw">("type");
  const [typedName, setTypedName] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setTermsAgreed(false);
      setSignatureMode("type");
      setTypedName("");
      setHasDrawn(false);
      setIsSubmitting(false);
      setIsSuccess(false);
      clearCanvas();
    }
  }, [isOpen]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
      }
    }
  };

  useEffect(() => {
    if (signatureMode === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;

      const resizeCanvas = () => {
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        if (width > 0 && height > 0) {
          const dpr = window.devicePixelRatio || 1;
          canvas.width = width * dpr;
          canvas.height = height * dpr;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#1d4ed8"; // blue-700
          }
        }
      };

      // Run with a minor timeout to make sure the Dialog animation is complete and settled
      const timer = setTimeout(() => {
        resizeCanvas();
      }, 250);

      window.addEventListener("resize", resizeCanvas);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [signatureMode]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!termsAgreed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const expectedWidth = rect.width * dpr;
    const expectedHeight = rect.height * dpr;

    // Check if the canvas size attributes match the expected size (with small threshold for subpixel scaling)
    if (
      Math.abs(canvas.width - expectedWidth) > 0.5 ||
      Math.abs(canvas.height - expectedHeight) > 0.5
    ) {
      canvas.width = expectedWidth;
      canvas.height = expectedHeight;
      ctx.scale(dpr, dpr);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#1d4ed8"; // blue-700
    }

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !termsAgreed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  const handleSign = async () => {
    if (!termsAgreed) return;

    let signatureValue = "";
    if (signatureMode === "type") {
      if (typedName.length < 2) return;
      signatureValue = typedName;
    } else {
      if (!hasDrawn || !canvasRef.current) return;
      signatureValue = canvasRef.current.toDataURL("image/png");
    }

    try {
      setIsSubmitting(true);
      const result = await signSpecialistFeeAgreement({
        referenceNumber,
        userId,
        signature: {
          type: signatureMode,
          value: signatureValue,
        },
        fundMappingApprovedId,
      });

      if (result.success) {
        setIsSuccess(true);
        toast.success("Agreement signed successfully!");
        setTimeout(() => {
          onSignComplete();
          onClose();
        }, 1500);
      } else {
        toast.error(result.message || "Failed to sign agreement");
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const isSignDisabled =
    !termsAgreed ||
    isSubmitting ||
    isSuccess ||
    (signatureMode === "type" ? typedName.trim().length < 2 : !hasDrawn);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
    >
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-white">
        {/* Header */}
        <div className="bg-blue-600 p-6 text-white flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-full shrink-0">
            <FileSignature className="w-6 h-6" />
          </div>
          <div>
            <DialogTitle className="text-xl font-bold tracking-wide">
              Sign Success Fee Agreement
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-sm mt-1">
              Please review and sign to proceed with your application.
            </DialogDescription>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Success State */}
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h3 className="text-xl font-bold text-gray-900">
                Agreement Signed
              </h3>
              <p className="text-gray-500">
                Thank you. Your signature has been securely recorded.
              </p>
            </div>
          ) : (
            <>
              {/* Terms Container */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 h-48 overflow-y-auto text-sm text-gray-600 space-y-4 shadow-inner">
                <p>
                  <strong className="text-gray-900 block mb-1">
                    1. FEE ACKNOWLEDGEMENT:
                  </strong>
                  Client agrees to pay a 15% performance success fee based on
                  any approved and accepted funding amount obtained through
                  CEG&apos;s lender connection with {bankName || "the lender"}.
                </p>
                <p>
                  <strong className="text-gray-900 block mb-1">
                    2. PAYMENT TERMS:
                  </strong>
                  Client agrees to pay this success fee immediately upon receipt
                  of funds.
                </p>
                <p>
                  <strong className="text-gray-900 block mb-1">
                    3. DISCLOSURE:
                  </strong>
                  CEG is a consulting firm, not a lender. Final terms are
                  subject to the lender&apos;s underwriting.
                </p>
                <p>
                  <strong className="text-gray-900 block mb-1">
                    4. AUTHORIZATION:
                  </strong>
                  By signing below, Client authorizes CEG to record this consent
                  and generate the formal fee agreement.
                </p>
              </div>

              {/* Checkbox */}
              <div className="flex items-start space-x-3 bg-blue-50/50 p-4 rounded-lg border border-blue-100 transition-colors hover:bg-blue-50">
                <Checkbox
                  id="terms"
                  checked={termsAgreed}
                  onCheckedChange={(c) => setTermsAgreed(c === true)}
                  className="mt-1 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-tight text-gray-700 cursor-pointer select-none"
                >
                  I have read and agree to the 15% Success Fee terms.
                </label>
              </div>

              {/* Signature Area */}
              <div
                className={`transition-opacity duration-300 ${
                  termsAgreed ? "opacity-100" : "opacity-50 pointer-events-none"
                }`}
              >
                <Tabs
                  value={signatureMode}
                  onValueChange={(v) => setSignatureMode(v as "type" | "draw")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-4 bg-gray-100/80">
                    <TabsTrigger
                      value="type"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
                    >
                      Type Signature
                    </TabsTrigger>
                    <TabsTrigger
                      value="draw"
                      className="data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
                    >
                      Draw Signature
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4 border rounded-xl overflow-hidden bg-gray-50/50 relative">
                    <TabsContent
                      value="type"
                      className="p-4 m-0 min-h-[160px] flex items-center justify-center"
                    >
                      <Input
                        type="text"
                        placeholder="Type your full name"
                        value={typedName}
                        onChange={(e) => setTypedName(e.target.value)}
                        className="text-center text-3xl font-serif italic border-none bg-transparent shadow-none focus-visible:ring-0 placeholder:not-italic placeholder:text-gray-300 placeholder:text-xl text-blue-900 h-16"
                        autoComplete="off"
                      />
                    </TabsContent>

                    <TabsContent
                      value="draw"
                      className="m-0 relative w-full h-[160px]"
                    >
                      <canvas
                        ref={canvasRef}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        className="w-full h-full cursor-crosshair touch-none"
                      />
                      {hasDrawn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearCanvas}
                          className="absolute bottom-2 right-2 h-8 text-xs text-gray-500 hover:text-gray-700 bg-white/80 backdrop-blur-sm"
                        >
                          Clear
                        </Button>
                      )}
                      {!hasDrawn && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-gray-300 select-none">
                          Draw your signature here
                        </div>
                      )}
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Action Button */}
              <Button
                onClick={handleSign}
                disabled={isSignDisabled}
                className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing Signature...
                  </>
                ) : (
                  "Sign & Continue"
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
