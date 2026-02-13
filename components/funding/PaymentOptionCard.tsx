import { Button } from "@/components/ui/button";
import IconMenu from "@/components/icon-menu";
import { Loader2Icon, ShoppingCart } from "lucide-react";

export const PaymentOptionCard = ({
  option,
  children,
}: {
  option: {
    recommended?: boolean;
    badge?: string | null;
    name: string;
    price: string;
    description?: string;
    additionalCost?: string;
    features: string[];
  };
  children: React.ReactNode;
}) => {
  return (
    <div
      className={`relative rounded-lg border-2 p-4 sm:p-6 flex flex-col ${
        option.recommended
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      }`}
    >
      {option.badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
            {option.badge}
          </span>
        </div>
      )}
      <div className="text-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold mb-2">{option.name}</h3>
        <div className="flex flex-col items-center gap-1">
          <span className="text-3xl sm:text-4xl font-bold">{option.price}</span>
          {option.description && (
            <span className="text-gray-600 dark:text-gray-400 text-sm">
              {option.description}
            </span>
          )}
          {option.additionalCost && (
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium mt-1">
              {option.additionalCost}
            </span>
          )}
        </div>
      </div>
      <ul className="space-y-3 mb-6 flex-grow">
        {option.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      {children}
    </div>
  );
};

export const WhopCheckoutButtonBase = ({
  buttonName,
  className,
  isLoading,
  onClick,
}: {
  buttonName: string;
  className: string;
  isLoading: boolean;
  onClick: () => void;
}) => {
  return (
    <Button
      variant={"ghost"}
      className={className}
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <IconMenu
          text="Processing..."
          icon={<Loader2Icon className="h-4 w-4 animate-spin mr-2" />}
        />
      ) : (
        <IconMenu
          icon={<ShoppingCart className="h-4 w-4" />}
          text={buttonName}
        />
      )}
    </Button>
  );
};
