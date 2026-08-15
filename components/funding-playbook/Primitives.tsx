import type { ReactNode } from "react";
import { Info, Lock, PhoneCall, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function SectionCard({
  n,
  id,
  title,
  subtitle,
  icon: Icon,
  children,
  accent = "default",
  aside,
}: {
  n: number;
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  accent?: "default" | "success" | "warning" | "danger" | "brand";
  aside?: ReactNode;
}) {
  const accentRing: Record<string, string> = {
    default: "bg-gray-100 text-gray-500",
    brand: "bg-blue-50 text-blue-600",
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-red-50 text-red-600",
  };

  return (
    <section
      id={id}
      className="scroll-mt-[132px] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:break-inside-avoid print:shadow-none print:border-gray-300"
    >
      <div className="flex flex-wrap sm:flex-nowrap items-start gap-x-3 gap-y-2 px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
            accentRing[accent],
          )}
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[15px] sm:text-base font-bold text-gray-900 tracking-tight leading-snug">
              {title}
            </h2>
          </div>
          {subtitle && (
            <p className="text-[12.5px] text-gray-500 mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {aside && (
          <div className="flex-shrink-0 pt-0.5 basis-full sm:basis-auto">
            {aside}
          </div>
        )}
      </div>
      <div className="px-5 sm:px-6 py-5">{children}</div>
    </section>
  );
}

export function Chip({
  children,
  tone = "gray",
  icon: Icon,
  className,
}: {
  children: ReactNode;
  tone?: "gray" | "green" | "amber" | "red" | "blue" | "dark";
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  const tones: Record<string, string> = {
    gray: "bg-gray-100 text-gray-600 ring-gray-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-200",
    dark: "bg-gray-900 text-white ring-gray-900",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ring-1 ring-inset max-w-full sm:max-w-xs truncate",
        tones[tone],
        className,
      )}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {children}
    </span>
  );
}

export function RationaleBlock({
  label = "Why this method",
  children,
  tone = "brand",
}: {
  label?: string;
  children: ReactNode;
  tone?: "brand" | "amber" | "gray" | "green";
}) {
  const tones: Record<string, string> = {
    brand: "bg-blue-50/70 border-blue-100",
    amber: "bg-amber-50/70 border-amber-100",
    gray: "bg-gray-50 border-gray-100",
    green: "bg-emerald-50/70 border-emerald-100",
  };
  const labelTone: Record<string, string> = {
    brand: "text-blue-700",
    amber: "text-amber-700",
    gray: "text-gray-500",
    green: "text-emerald-700",
  };
  return (
    <div className={cn("rounded-xl border p-4", tones[tone])}>
      <div
        className={cn(
          "text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5",
          labelTone[tone],
        )}
      >
        {label}
      </div>
      <div className="text-[13px] text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  icon: Icon = Info,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-5 py-7 text-center">
      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <h4 className="text-sm font-semibold text-gray-800">{title}</h4>
      <p className="text-[12.5px] text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
        {body}
      </p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function ScriptBlock({
  lines,
  goal,
  label = "What to say",
}: {
  lines: string[];
  goal?: string;
  label?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200">
        <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-600">
          {label}
        </span>
        <span className="ml-auto font-mono text-[10px] text-gray-400">
          {lines.length} lines
        </span>
      </div>
      <ol className="divide-y divide-gray-200">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-3 px-4 py-3">
            <span className="font-mono text-[10px] font-semibold text-gray-400 pt-0.5 flex-shrink-0">
              {i + 1}
            </span>
            <p className="text-[13px] text-gray-700 leading-relaxed italic">
              “{line}”
            </p>
          </li>
        ))}
      </ol>
      {goal && (
        <div className="px-4 py-2.5 bg-white border-t border-gray-200 flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-[12px] text-gray-600 leading-snug">{goal}</p>
        </div>
      )}
    </div>
  );
}

export function ComplianceNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 border border-gray-200 px-4 py-3">
      <Lock className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
      <p className="text-[11.5px] text-gray-500 leading-relaxed">{children}</p>
    </div>
  );
}

export function StatRow({
  rows,
}: {
  rows: { label: string; value: string; emphasis?: boolean }[];
}) {
  return (
    <dl className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
      {rows.map((r) => (
        <div
          key={r.label}
          className={cn(
            "flex items-center justify-between gap-4 px-4 py-2.5",
            r.emphasis ? "bg-blue-50/60" : "bg-white",
          )}
        >
          <dt
            className={cn(
              "text-[12.5px]",
              r.emphasis ? "font-semibold text-blue-900" : "text-gray-600",
            )}
          >
            {r.label}
          </dt>
          <dd
            className={cn(
              "font-mono text-[13px] tabular-nums flex-shrink-0",
              r.emphasis
                ? "font-bold text-blue-700"
                : "font-medium text-gray-900",
            )}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ActionButton({
  children,
  href,
  onClick,
  variant = "primary",
  icon: Icon,
  size = "default",
  external,
  className,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "dark" | "success";
  icon?: React.ComponentType<{ className?: string }>;
  size?: "default" | "sm" | "lg";
  external?: boolean;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
    secondary:
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
    ghost: "text-blue-600 hover:bg-blue-50",
    dark: "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-[12px] rounded-lg gap-1.5",
    default: "h-10 px-4 text-[13px] rounded-xl gap-2",
    lg: "h-11 px-5 text-sm rounded-xl gap-2",
  };
  const classes = cn(
    "inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40",
    variants[variant],
    sizes[size],
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={classes}
      >
        {Icon && <Icon className="w-4 h-4" />}
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}
