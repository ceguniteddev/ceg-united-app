"use client";

import { useState } from "react";
import { ChevronDown, ListOrdered } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export const SECTIONS = [
  { n: 1, id: "best-method", label: "Best Application Method" },
  { n: 2, id: "bureau", label: "Bureau & Inquiries" },
  { n: 3, id: "income", label: "Income Structuring" },
  { n: 4, id: "housing", label: "Housing & DTI Math" },
  { n: 5, id: "approval", label: "Approval Estimate" },
  { n: 6, id: "double-dip", label: "Double-Dip Strategy" },
  { n: 7, id: "ceg-lift", label: "CEG Product Lift" },
  { n: 8, id: "branches", label: "Nearest Branches" },
  { n: 9, id: "booking", label: "Reservation & Booking" },
  { n: 10, id: "denied", label: "Denial Mitigation" },
  { n: 11, id: "improve-odds", label: "Improve Your Odds" },
  { n: 12, id: "need-help", label: "Need Support Now" },
];

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SectionRail({ active }: { active: string }) {
  const activeIndex = SECTIONS.findIndex((s) => s.id === active);
  const pct = ((activeIndex + 1) / SECTIONS.length) * 100;

  return (
    <nav
      aria-label="Playbook sections"
      className="hidden lg:block w-[228px] flex-shrink-0 print:hidden"
    >
      <div className="sticky top-4">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
            Your playbook
          </span>
        </div>

        <div className="h-[3px] rounded-full bg-gray-200 mb-3 mx-2 overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full"
            style={{
              width: `${pct}%`,
              transition: "width 400ms cubic-bezier(0.16,1,0.3,1)",
            }}
          />
        </div>

        <ul className="space-y-0.5">
          {SECTIONS.map((s) => {
            const isActive = s.id === active;
            SECTIONS.findIndex((x) => x.id === s.id) < activeIndex;
            return (
              <li key={s.id}>
                <button
                  onClick={() => scrollToSection(s.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "group w-full flex items-center gap-2.5 pl-2 pr-2.5 py-[7px] rounded-lg text-left transition-all duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-800",
                  )}
                >
                  <span
                    className={cn(
                      "text-[12.5px] leading-snug truncate",
                      isActive ? "font-semibold" : "font-medium",
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}

export function SectionAccordionNav({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const activeSection = SECTIONS.find((s) => s.id === active) ?? SECTIONS[0];

  return (
    <nav
      aria-label="Playbook sections (mobile)"
      className="sticky top-0 z-20 -mx-3 border-b border-gray-100 bg-white/95 px-3 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden print:hidden"
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 w-full items-center gap-2.5 rounded-xl border border-gray-200 bg-gray-50 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
        aria-expanded={open}
      >
        <ListOrdered className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <span className="text-[13px] font-semibold text-gray-800 truncate flex-1">
          {activeSection.label}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul className="mt-1.5 max-h-[52vh] overflow-y-auto custom-scrollbar rounded-xl border border-gray-200 bg-white shadow-lg divide-y divide-gray-50">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => {
                  setOpen(false);
                  window.setTimeout(() => scrollToSection(s.id), 60);
                }}
                className={cn(
                  "flex min-h-11 w-full items-center gap-2.5 px-3.5 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600",
                  s.id === active
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600",
                )}
              >
                <span className="text-[13px] font-medium truncate">
                  {s.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
