// components/ConfirmButton.tsx
import * as React from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

type ConfirmButtonProps = {
  label?: string; // optional when using custom trigger
  confirmLabel?: string;
  description: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  icon?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  onConfirm: () => Promise<void> | void;
  className?: string;
  classNameAction?: string;
  classNameCancel?: string;
  type?: "button" | "submit";
  trigger?: React.ReactElement; // optional custom trigger
  showTrigger?: boolean; // NEW: allow no trigger (controlled mode)
  open?: boolean; // NEW: controlled open
  onOpenChange?: (open: boolean) => void; // NEW: controlled open change
};

export const ConfirmButton = ({
  label = "Open",
  confirmLabel = "Confirm",
  description,
  variant = "outline",
  size = "lg",
  icon,
  isLoading = false,
  disabled = false,
  onConfirm,
  className,
  classNameAction,
  classNameCancel,
  type = "button",
  trigger,
  showTrigger = true,
  open,
  onOpenChange,
}: ConfirmButtonProps) => {
  const isBusy = isLoading || disabled;

  const triggerNode = React.isValidElement(trigger) ? (
    React.cloneElement(trigger)
  ) : (
    <Button
      type={type}
      variant={variant}
      size={size}
      disabled={isBusy}
      className={cn("cursor-pointer", className)}
    >
      {isLoading ? <Loader2Icon className="mr-2 h-4 w-4 animate-spin" /> : icon}
      {label}
    </Button>
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && <AlertDialogTrigger asChild>{triggerNode}</AlertDialogTrigger>}

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isBusy} className={cn("cursor-pointer", classNameCancel)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isBusy}
            className={cn("cursor-pointer", classNameAction)}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
