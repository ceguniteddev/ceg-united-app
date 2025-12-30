import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MenuIconProps {
  readonly icon: ReactNode;
  readonly text: string;
  readonly className?: string;
  readonly iconLocation?: "left" | "right";
}

export default function IconMenu({
  className,
  icon,
  text,
  iconLocation = "left",
}: MenuIconProps) {
  return (
    <div
      className={cn(
        "flex flex-row text-center items-center justify-center space-x-2",
        className
      )}
    >
      {iconLocation === "left" && icon}
      <span className="text-sm">{text}</span>
      {iconLocation === "right" && icon}
    </div>
  );
}
