import { Button } from "@/components/ui/button";
import IconMenu from "@/components/icon-menu";
import { Loader2Icon, CheckCircle2, ArrowUpRight } from "lucide-react";

export const PaymentOptionCard = ({
  option,
  children,
}: {
  option: {
    recommended?: boolean;
    title: string;
    price: string;
    priceSubtext: string;
    subtitle: string;
    features: string[];
  };
  children: React.ReactNode;
}) => {
  return (
    <div
      className={`relative rounded-xl p-5 sm:p-6 flex flex-col h-full bg-[#f8f9fa] dark:bg-gray-900 border ${
        option.recommended
          ? "border-gray-300 dark:border-gray-600 shadow-md"
          : "border-transparent"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-2 mb-4">
        <h3 className="text-base font-bold sm:pr-2 leading-tight">
          {option.title}
        </h3>
        {option.recommended && (
          <span className="bg-[#1a202c] dark:bg-gray-700 text-white text-[8px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 self-start sm:self-auto shrink-0 leading-none h-6">
            Popular
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-3xl sm:text-4xl font-bold">{option.price}</span>
        {option.priceSubtext && (
          <span className="text-gray-600 dark:text-gray-400 text-sm">
            {option.priceSubtext}
          </span>
        )}
      </div>

      <div className="text-gray-700 dark:text-gray-300 text-sm mb-6 pb-6 border-b border-dashed border-gray-300 dark:border-gray-700">
        {option.subtitle}
      </div>

      <div className="mt-auto flex flex-col gap-3 mb-8 w-full">{children}</div>

      <div className="flex flex-col gap-3 flex-grow pt-4 border-t border-dashed border-gray-300 dark:border-gray-700">
        {option.features.map((feature, i) => (
          <div
            key={i}
            className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300"
          >
            <CheckCircle2 className="w-[18px] h-[18px] text-gray-400 mt-[2px] shrink-0" />
            <span className="leading-snug">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const DodoCheckoutButtonBase = ({
  buttonName,
  subText,
  className,
  isLoading,
  onClick,
}: {
  buttonName: string;
  subText?: string;
  className: string;
  isLoading: boolean;
  onClick: () => void;
}) => {
  return (
    <Button
      className={className}
      onClick={onClick}
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? (
        <IconMenu
          text="Processing..."
          icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
        />
      ) : (
        <div className="flex flex-col items-center justify-center">
          <span className="flex items-center justify-center gap-2">
            {buttonName} <ArrowUpRight className="w-4 h-4" />
          </span>
          {subText && (
            <span className="text-[10px] sm:text-[11px] opacity-70 font-normal mt-0.5 tracking-tight">
              {subText}
            </span>
          )}
        </div>
      )}
    </Button>
  );
};
