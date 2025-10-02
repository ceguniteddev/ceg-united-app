import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // optional if you have a cn helper
import { FilePlus, SearchX } from "lucide-react";
import React from "react";

type EmptyStateProps = {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title = "No documents found",
  description = "You don’t have any documents yet. Upload one to get started.",
  icon = <SearchX className="h-10 w-10" aria-hidden="true" />,
  className,
  actionLabel = "Upload Document",
  onAction,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto my-8 max-w-xl rounded-xl border bg-background p-8 text-center shadow-sm",
        "transition hover:shadow-md",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      {onAction && (
        <div className="mt-6">
          <Button onClick={onAction} className="gap-2">
            <FilePlus className="h-4 w-4" />
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
