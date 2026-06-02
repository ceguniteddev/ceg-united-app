import type { Bureau } from "@/lib/credit-repair/credit-repair-types";

const SHORT: Record<Bureau, string> = {
  experian: "EX",
  equifax: "EQ",
  transunion: "TU",
};

const COLOR: Record<Bureau, { active: string; muted: string }> = {
  experian: {
    active: "bg-blue-600 text-white",
    muted: "bg-gray-100 text-gray-300",
  },
  equifax: {
    active: "bg-red-600 text-white",
    muted: "bg-gray-100 text-gray-300",
  },
  transunion: {
    active: "bg-emerald-600 text-white",
    muted: "bg-gray-100 text-gray-300",
  },
};

export function BureauBadges({
  reporting,
  size = "default",
}: {
  reporting: Bureau[];
  size?: "default" | "sm";
}) {
  const all: Bureau[] = ["experian", "equifax", "transunion"];
  const sz = size === "sm" ? "w-6 h-5 text-[9px]" : "w-7 h-6 text-[10px]";
  return (
    <div className="flex items-center gap-1">
      {all.map((b) => {
        const isOn = reporting.includes(b);
        const c = COLOR[b];
        return (
          <span
            key={b}
            title={
              isOn
                ? `Reported on ${b[0].toUpperCase() + b.slice(1)}`
                : `Not on ${b[0].toUpperCase() + b.slice(1)}`
            }
            className={`${sz} flex items-center justify-center rounded font-bold tracking-wide ${
              isOn ? c.active : c.muted
            }`}
          >
            {SHORT[b]}
          </span>
        );
      })}
    </div>
  );
}
