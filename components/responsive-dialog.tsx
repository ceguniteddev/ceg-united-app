import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { cn } from "@/lib/utils";

interface Props {
  readonly children: React.ReactNode;
  readonly isOpen: boolean;
  readonly setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  readonly title: string;
  readonly description?: string | React.ReactNode;
  readonly className?: string;
  readonly id?: string;
  readonly onEscapeAttempt?: () => void;
  readonly descriptionClassName?: string;
}

export function ResponsiveDialog({
  children,
  isOpen,
  setIsOpen,
  title,
  description,
  className = "w-6/12",
  id = "dialog-form",
  onEscapeAttempt,
  descriptionClassName,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal>
      <DialogContent
        id={id}
        className={cn("max-h-[80vh] overflow-y-auto", className)}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onEscapeAttempt?.();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={cn(descriptionClassName)}>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
