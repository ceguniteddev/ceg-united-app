import React from "react";

export function LenderMark({
  lenderId,
  color = "#2563eb",
  size = 34,
}: {
  lenderId: string;
  color?: string;
  size?: number;
}) {
  const glyph: Record<string, React.ReactElement> = {
    chase: (
      <>
        <rect
          x="8"
          y="8"
          width="8"
          height="8"
          rx="1.5"
          fill="white"
          opacity="0.95"
        />
        <rect
          x="20"
          y="8"
          width="8"
          height="8"
          rx="1.5"
          fill="white"
          opacity="0.55"
        />
        <rect
          x="8"
          y="20"
          width="8"
          height="8"
          rx="1.5"
          fill="white"
          opacity="0.55"
        />
        <rect
          x="20"
          y="20"
          width="8"
          height="8"
          rx="1.5"
          fill="white"
          opacity="0.95"
        />
      </>
    ),
    "american-express": (
      <>
        <path
          d="M10 24L18 11L26 24"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M13.5 20H22.5"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </>
    ),
    "navy-federal": (
      <>
        <path
          d="M18 9L25 12.5V19C25 23 21.8 25.8 18 27C14.2 25.8 11 23 11 19V12.5L18 9Z"
          stroke="white"
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M15 18.2L17.4 20.6L21.6 16"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="flex-shrink-0 rounded-[10px]"
    >
      <rect width="36" height="36" rx="10" fill={color} />
      {glyph[lenderId] ?? (
        <circle
          cx="18"
          cy="18"
          r="6"
          stroke="white"
          strokeWidth="2.4"
          fill="none"
        />
      )}
    </svg>
  );
}
