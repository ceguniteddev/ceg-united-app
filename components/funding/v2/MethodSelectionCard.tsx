// ============================================
// MethodSelectionCard — "Talk to a Specialist" / "Apply Online"
// ============================================
// Radio-style selection card for choosing application method

import { Headphones, Globe } from "lucide-react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";
import type { ClientApplicationMethod } from "@/schema/bank-products";

// Re-export for convenience
export type ApplicationMethod = ClientApplicationMethod;

interface MethodSelectionCardProps {
  method: "specialist" | "online";
  selected: ApplicationMethod;
}

const config = {
  specialist: {
    icon: Headphones,
    title: "Talk to a Specialist",
    description:
      "Speak directly with a bank specialist to discuss your funding options and get personalized advice.",
    radioLabel: "Have a banker contact me",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  online: {
    icon: Globe,
    title: "Apply Online",
    description:
      "Fill in the online application form through the bank website to proceed quickly with your request.",
    radioLabel: "Submit a digital application online",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
};

export function MethodSelectionCard({
  method,
  selected,
}: MethodSelectionCardProps) {
  const c = config[method];
  const isSelected = selected === method;
  const Icon = c.icon;

  return (
    <RadioGroupPrimitive.Item value={method} asChild>
      <label
        className={cn(
          "flex flex-col text-left rounded-xl border-2 p-5 transition-all duration-200 cursor-pointer",
          isSelected
            ? "border-brand-500 bg-white shadow-md ring-1 ring-brand-500/20"
            : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm",
        )}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`size-9 rounded-lg ${c.iconBg} flex items-center justify-center`}
          >
            <Icon className={`size-4.5 ${c.iconColor}`} />
          </div>
          <h4 className="text-sm font-bold text-gray-900">{c.title}</h4>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">
          {c.description}
        </p>

        {/* Radio */}
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "size-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0",
              isSelected
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 bg-white",
            )}
          >
            {isSelected && (
              <div className="size-2.5 rounded-full bg-blue-600" />
            )}
          </div>
          <span
            className={cn(
              "text-xs transition-colors",
              isSelected ? "text-gray-900 font-medium" : "text-gray-600",
            )}
          >
            {c.radioLabel}
          </span>
        </div>
      </label>
    </RadioGroupPrimitive.Item>
  );
}
