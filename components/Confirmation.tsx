// components/ConfirmButton.tsx
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
import React from "react";

type ConfirmButtonProps = {
  label: string;
  confirmLabel?: string;
  description: string;
  variant?: "default" | "destructive" | "outline" | "secondary";
  size?: "sm" | "default" | "lg";
  icon?: React.ReactNode;
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
  className?: string;
  classNameAction?: string;
  classNameCancel?: string;
};

export const ConfirmButton = ({
  label,
  confirmLabel = "Confirm",
  description,
  variant = "default",
  size = "default",
  icon,
  isLoading = false,
  onConfirm,
  className,
  classNameAction,
  classNameCancel,
}: ConfirmButtonProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isLoading}
          className={cn(`gap-2 cursor-pointer`, className)}
        >
          {isLoading ? <Loader2Icon className="h-4 w-4 animate-spin" /> : icon}
          {label}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className={cn("cursor-pointer", classNameCancel)}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn("cursor-pointer", classNameAction)}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
