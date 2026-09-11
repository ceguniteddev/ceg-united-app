import React from "react";
import { Locale } from "@/lib/i18n/config";

export function FlagUS({
  className = "w-5 h-3.5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <g fillRule="evenodd">
        <path fill="#bd3d44" d="M0 0h640v480H0z" />
        <path
          stroke="#fff"
          strokeWidth="37"
          d="M0 55.4h640M0 129.2h640M0 203h640M0 277h640M0 350.8h640M0 424.6h640"
        />
        <path fill="#192f5d" d="M0 0h260v258.5H0z" />
        <g fill="#fff">
          {/* Row 1 (6 stars) */}
          <polygon points="21.7,18 24.3,26 17.5,21 31,21 24.2,26" />
          <polygon points="65,18 67.6,26 60.8,21 74.3,21 67.5,26" />
          <polygon points="108.3,18 110.9,26 104.1,21 117.6,21 110.8,26" />
          <polygon points="151.6,18 154.2,26 147.4,21 160.9,21 154.1,26" />
          <polygon points="195,18 197.6,26 190.8,21 204.3,21 197.5,26" />
          <polygon points="238.3,18 240.9,26 234.1,21 247.6,21 240.8,26" />

          {/* Row 2 (5 stars) */}
          <polygon points="43.3,44 45.9,52 39.1,47 52.6,47 45.8,52" />
          <polygon points="86.6,44 89.2,52 82.4,47 95.9,47 89.1,52" />
          <polygon points="130,44 132.6,52 125.8,47 139.3,47 132.5,52" />
          <polygon points="173.3,44 175.9,52 169.1,47 182.6,47 175.8,52" />
          <polygon points="216.6,44 219.2,52 212.4,47 225.9,47 219.1,52" />

          {/* Row 3 (6 stars) */}
          <polygon points="21.7,70 24.3,78 17.5,73 31,73 24.2,78" />
          <polygon points="65,70 67.6,78 60.8,73 74.3,73 67.5,78" />
          <polygon points="108.3,70 110.9,78 104.1,73 117.6,73 110.8,78" />
          <polygon points="151.6,70 154.2,78 147.4,73 160.9,73 154.1,78" />
          <polygon points="195,70 197.6,78 190.8,73 204.3,73 197.5,78" />
          <polygon points="238.3,70 240.9,78 234.1,73 247.6,73 240.8,78" />

          {/* Row 4 (5 stars) */}
          <polygon points="43.3,96 45.9,104 39.1,99 52.6,99 45.8,104" />
          <polygon points="86.6,96 89.2,104 82.4,99 95.9,99 89.1,104" />
          <polygon points="130,96 132.6,104 125.8,99 139.3,99 132.5,104" />
          <polygon points="173.3,96 175.9,104 169.1,99 182.6,99 175.8,104" />
          <polygon points="216.6,96 219.2,104 212.4,99 225.9,99 219.1,104" />

          {/* Row 5 (6 stars) */}
          <polygon points="21.7,122 24.3,130 17.5,125 31,125 24.2,130" />
          <polygon points="65,122 67.6,130 60.8,125 74.3,125 67.5,130" />
          <polygon points="108.3,122 110.9,130 104.1,125 117.6,125 110.8,130" />
          <polygon points="151.6,122 154.2,130 147.4,125 160.9,125 154.1,130" />
          <polygon points="195,122 197.6,130 190.8,125 204.3,125 197.5,130" />
          <polygon points="238.3,122 240.9,130 234.1,125 247.6,125 240.8,130" />

          {/* Row 6 (5 stars) */}
          <polygon points="43.3,148 45.9,156 39.1,151 52.6,151 45.8,156" />
          <polygon points="86.6,148 89.2,156 82.4,151 95.9,151 89.1,156" />
          <polygon points="130,148 132.6,156 125.8,151 139.3,151 132.5,156" />
          <polygon points="173.3,148 175.9,156 169.1,151 182.6,151 175.8,156" />
          <polygon points="216.6,148 219.2,156 212.4,151 225.9,151 219.1,156" />

          {/* Row 7 (6 stars) */}
          <polygon points="21.7,174 24.3,182 17.5,177 31,177 24.2,182" />
          <polygon points="65,174 67.6,182 60.8,177 74.3,177 67.5,182" />
          <polygon points="108.3,174 110.9,182 104.1,177 117.6,177 110.8,182" />
          <polygon points="151.6,174 154.2,182 147.4,177 160.9,177 154.1,182" />
          <polygon points="195,174 197.6,182 190.8,177 204.3,177 197.5,182" />
          <polygon points="238.3,174 240.9,182 234.1,177 247.6,177 240.8,182" />

          {/* Row 8 (5 stars) */}
          <polygon points="43.3,200 45.9,208 39.1,203 52.6,203 45.8,208" />
          <polygon points="86.6,200 89.2,208 82.4,203 95.9,203 89.1,208" />
          <polygon points="130,200 132.6,208 125.8,203 139.3,203 132.5,208" />
          <polygon points="173.3,200 175.9,208 169.1,203 182.6,203 175.8,208" />
          <polygon points="216.6,200 219.2,208 212.4,203 225.9,203 219.1,208" />

          {/* Row 9 (6 stars) */}
          <polygon points="21.7,226 24.3,234 17.5,229 31,229 24.2,234" />
          <polygon points="65,226 67.6,234 60.8,229 74.3,229 67.5,234" />
          <polygon points="108.3,226 110.9,234 104.1,229 117.6,229 110.8,234" />
          <polygon points="151.6,226 154.2,234 147.4,229 160.9,229 154.1,234" />
          <polygon points="195,226 197.6,234 190.8,229 204.3,229 197.5,234" />
          <polygon points="238.3,226 240.9,234 234.1,229 247.6,229 240.8,234" />
        </g>
      </g>
    </svg>
  );
}

export function FlagES({
  className = "w-5 h-3.5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 640 480"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path fill="#C60B1E" d="M0 0h640v480H0z" />
      <path fill="#FFC400" d="M0 120h640v240H0z" />
      {/* Coat of arms */}
      <g transform="translate(130 150) scale(0.65)">
        {/* Crown */}
        <path
          fill="#D4A017"
          d="M35 15 L45 35 L75 22 L105 35 L115 15 L100 45 L50 45 Z"
        />
        <circle cx="75" cy="14" r="6" fill="#D4A017" />
        <circle cx="35" cy="15" r="4" fill="#D4A017" />
        <circle cx="115" cy="15" r="4" fill="#D4A017" />
        <circle cx="75" cy="14" r="3" fill="#C60B1E" />
        {/* Crown base */}
        <rect x="42" y="42" width="66" height="8" rx="2" fill="#D4A017" />
        <circle cx="53" cy="46" r="2.5" fill="#C60B1E" />
        <circle cx="64" cy="46" r="2.5" fill="#3B82F6" />
        <circle cx="75" cy="46" r="2.5" fill="#10B981" />
        <circle cx="86" cy="46" r="2.5" fill="#3B82F6" />
        <circle cx="97" cy="46" r="2.5" fill="#C60B1E" />

        {/* Shield background */}
        <path
          d="M45 52 h60 v60 c0 20 -30 35 -30 35 c0 0 -30 -15 -30 -35 Z"
          fill="#FFF"
          stroke="#D4A017"
          strokeWidth="3"
        />
        {/* Shield quarters */}
        {/* Castile (top-left) - Red with gold castle */}
        <path d="M46 53 h29 v30 h-29 Z" fill="#C60B1E" />
        <path
          d="M52 75 h17 v-12 h-3 v-4 h-3 v4 h-5 v-4 h-3 v4 h-3 Z"
          fill="#FFC400"
        />
        {/* Leon (top-right) - White with purple lion */}
        <path d="M75 53 h29 v30 h-29 Z" fill="#FFF" />
        <path
          d="M84 62 c3 -4 9 0 7 5 c3 1 3 5 0 7 c2 3 -1 6 -4 5 c-3 -1 -5 -4 -4 -8 c-2 -1 -2 -5 1 -9 Z"
          fill="#8B1E41"
        />
        {/* Aragon (bottom-left) - Gold with 4 red stripes */}
        <path
          d="M46 83 h29 v25 c0 5 4 10 7 13 c-3 2 -7 0 -7 0 Z"
          fill="#FFC400"
        />
        <line
          x1="52"
          y1="83"
          x2="52"
          y2="114"
          stroke="#C60B1E"
          strokeWidth="2.5"
        />
        <line
          x1="58"
          y1="83"
          x2="58"
          y2="118"
          stroke="#C60B1E"
          strokeWidth="2.5"
        />
        <line
          x1="64"
          y1="83"
          x2="64"
          y2="120"
          stroke="#C60B1E"
          strokeWidth="2.5"
        />
        <line
          x1="70"
          y1="83"
          x2="70"
          y2="120"
          stroke="#C60B1E"
          strokeWidth="2.5"
        />
        {/* Navarre (bottom-right) - Red with gold chains */}
        <path
          d="M75 83 h29 v25 c0 5 -4 10 -7 13 c-8 8 -22 17 -22 17 s-3 -2 -6 -5 c6 -6 6 -15 6 -20 Z"
          fill="#C60B1E"
        />
        <circle
          cx="89"
          cy="98"
          r="7"
          fill="none"
          stroke="#FFC400"
          strokeWidth="2"
        />
        <path
          d="M78 86 L100 108 M100 86 L78 108"
          stroke="#FFC400"
          strokeWidth="1.5"
        />
        {/* Bourbon escutcheon (center) */}
        <ellipse
          cx="75"
          cy="83"
          rx="7"
          ry="9"
          fill="#0038A8"
          stroke="#C60B1E"
          strokeWidth="1.5"
        />
        <circle cx="75" cy="80" r="1.5" fill="#FFC400" />
        <circle cx="72.5" cy="84" r="1.2" fill="#FFC400" />
        <circle cx="77.5" cy="84" r="1.2" fill="#FFC400" />

        {/* Pillars of Hercules (Left and Right) */}
        {/* Left Pillar */}
        <rect x="22" y="55" width="8" height="85" fill="#D4A017" rx="1.5" />
        <path d="M18 55 h16 v-5 h-16 Z M18 140 h16 v5 h-16 Z" fill="#D4A017" />
        <path d="M16 85 c8 -4 18 4 20 0 c2 -4 -6 -10 -20 0 Z" fill="#C60B1E" />
        {/* Left Pillar Crown */}
        <path d="M19 46 L26 40 L33 46 Z" fill="#D4A017" />
        {/* Right Pillar */}
        <rect x="120" y="55" width="8" height="85" fill="#D4A017" rx="1.5" />
        <path
          d="M116 55 h16 v-5 h-16 Z M116 140 h16 v5 h-16 Z"
          fill="#D4A017"
        />
        <path d="M114 85 c8 -4 18 4 20 0 c2 -4 -6 -10 -20 0 Z" fill="#C60B1E" />
        {/* Right Pillar Crown */}
        <path d="M117 46 L124 40 L131 46 Z" fill="#D4A017" />
      </g>
    </svg>
  );
}

export interface LocaleFlagProps extends React.SVGProps<SVGSVGElement> {
  locale: Locale | string;
}

export function LocaleFlag({
  locale,
  className = "w-5 h-3.5",
  ...props
}: LocaleFlagProps) {
  switch (locale) {
    case "es":
      return <FlagES className={className} {...props} />;
    case "en":
    default:
      return <FlagUS className={className} {...props} />;
  }
}
