import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface MenuIconProps {
  readonly icon: ReactNode;
  readonly text: string;
  readonly className?: string;
}

export default function IconMenu({ className, icon, text }: MenuIconProps) {
  return (
    <div
      className={cn(
        "flex flex-row text-center items-center justify-center space-x-2",
        className
      )}
    >
      {icon}
      <span className="text-sm">{text}</span>
    </div>
  );
}
