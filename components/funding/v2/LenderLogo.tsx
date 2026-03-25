// ============================================
// LenderLogo — Circular logo with initials and brand colors
// ============================================
// Renders a styled circular logo for lenders using initials

interface LenderLogoProps {
  initial: string; // e.g., "C" for Chase, "B" for Bank of America
  bgClass?: string; // e.g., "bg-blue-100"
  colorClass?: string; // e.g., "text-blue-600"
  size?: "sm" | "md" | "lg";
}

export function LenderLogo({
  initial,
  bgClass = "bg-blue-600",
  colorClass = "text-white",
  size = "md",
}: LenderLogoProps) {
  const sizeClasses = {
    sm: "size-8 text-sm",
    md: "size-10 text-base",
    lg: "size-12 text-lg",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${bgClass} ${colorClass} rounded-full flex items-center justify-center font-bold flex-shrink-0`}
    >
      {initial}
    </div>
  );
}
