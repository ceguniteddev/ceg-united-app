import { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  Eraser,
  FileSignature,
  ScrollText,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { formatUSD } from "@/lib/underwriting";
import { PsfInvoice } from "@/schema/psf-invoice";

interface PsfAcceptanceViewProps {
  invoice: PsfInvoice;
  onAccept: (signature: {
    type: "type" | "draw";
    value: string;
    ipAddress?: string;
    macAddress?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function PsfAcceptanceView({
  invoice,
  onAccept,
  isSubmitting,
}: PsfAcceptanceViewProps) {
  const [agreed, setAgreed] = useState(false);
  const [mode, setMode] = useState<"type" | "draw">("type");
  const [typedSignature, setTypedSignature] = useState("");
  const [hasDrawn, setHasDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const hasSignature =
    mode === "type" ? typedSignature.trim().length >= 2 : hasDrawn;
  const canAccept = agreed && hasSignature;

  // -------- canvas signature pad --------
  useEffect(() => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e3a5f";
  }, [mode]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = getPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const onPointerUp = () => {
    drawing.current = false;
  };

  const clearSignature = () => {
    if (mode === "type") {
      setTypedSignature("");
      return;
    }
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d")!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const [isSuccess, setIsSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccept = async () => {
    setIsProcessing(true);
    let signatureValue = "";
    if (mode === "type") {
      signatureValue = typedSignature;
    } else {
      signatureValue = canvasRef.current?.toDataURL() || "";
    }

    let ipAddress = "Unknown";
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      if (response.ok) {
        const data = await response.json();
        ipAddress = data.ip;
      }
    } catch (e) {
      console.error("Failed to fetch IP address", e);
    }

    try {
      await onAccept({
        type: mode,
        value: signatureValue,
        ipAddress,
        macAddress: "Unavailable (Browser Security Restriction)",
      });
      setIsSuccess(true);
    } catch (e) {
      // Error handled by parent
    } finally {
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center animate-fade-in-up">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Successfully Signed
        </h2>
        <p className="text-gray-500 max-w-sm mb-8">
          Thank you for signing the agreement. You will now be redirected to
          complete your payment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ScrollText className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-900">
              Performance Success Fee Invoice
            </h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Bank</span>
              <span className="font-medium text-gray-900">
                {invoice.bankName}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Approved Amount</span>
              <span className="font-medium text-gray-900">
                {formatUSD(invoice.approvedAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">
                Success Fee ({invoice.successFeePercentage}%)
              </span>
              <span className="font-semibold text-blue-600">
                {formatUSD(invoice.successFeeAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileSignature className="w-4 h-4 text-blue-600" />
          CEG Performance Success Fee Agreement
        </h4>

        <div className="h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl p-5 text-sm text-gray-600 space-y-4 mb-6 shadow-sm">
          <p>
            <strong>Date:</strong> {today}
          </p>
          <p>
            This Performance Success Fee Agreement ("Agreement") is entered into
            by and between Credit Elevation Group LLC ("CEG") and the Client.
          </p>
          <p>
            1. <strong>FEE ACKNOWLEDGEMENT:</strong> Client acknowledges that
            CEG has successfully secured funding in the amount of{" "}
            {formatUSD(invoice.approvedAmount)} from {invoice.bankName}.
          </p>
          <p>
            2. <strong>PERFORMANCE FEE:</strong> Pursuant to the original terms
            of service, Client agrees to pay CEG a success fee of{" "}
            {invoice.successFeePercentage}%, which amounts to{" "}
            <strong>{formatUSD(invoice.successFeeAmount)}</strong>.
          </p>
          <p>
            3. <strong>PAYMENT TERMS:</strong> Client agrees to process this
            payment immediately upon signing this agreement via the secure
            payment portal. Failure to pay may result in collection actions or
            reporting to credit bureaus.
          </p>
          <p>
            4. <strong>AUTHORIZATION:</strong> By signing below, Client
            authorizes CEG to process this performance success fee and agrees to
            all terms outlined in this agreement and the general Terms of
            Service.
          </p>
        </div>

        <div className="flex items-start gap-3 mb-8">
          <input
            type="checkbox"
            id="psf-agree"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <label
            htmlFor="psf-agree"
            className="text-sm text-gray-700 cursor-pointer"
          >
            I have read and agree to the CEG Fee Agreement and Terms of Service.
            I authorize the success fee payment.
          </label>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-2">
            <div className="flex gap-1 bg-gray-200/50 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode("type");
                  clearSignature();
                }}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === "type"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Type
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("draw");
                  clearSignature();
                }}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  mode === "draw"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Draw
              </button>
            </div>
            <button
              type="button"
              onClick={clearSignature}
              className="text-xs font-medium text-gray-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors"
            >
              <Eraser className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>

          <div className="p-6">
            {mode === "type" ? (
              <div className="relative">
                <input
                  type="text"
                  value={typedSignature}
                  onChange={(e) => setTypedSignature(e.target.value)}
                  placeholder="Type your full legal name"
                  className="w-full text-center text-4xl border-0 border-b border-dashed border-gray-300 focus:ring-0 focus:border-blue-500 bg-transparent py-4 font-signature placeholder:font-sans placeholder:text-lg placeholder:text-gray-300 transition-colors"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                />
              </div>
            ) : (
              <div className="relative w-full h-32 bg-gray-50/50 rounded-lg border border-dashed border-gray-300">
                <canvas
                  ref={canvasRef}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  className="w-full h-full touch-none cursor-crosshair"
                  style={{ touchAction: "none" }}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-400 text-sm">
                      Draw your signature here
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={handleAccept}
          disabled={!canAccept || isSubmitting || isProcessing}
          className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
        >
          {isSubmitting || isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Signature...
            </>
          ) : (
            <>
              Sign & Proceed to Payment
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
