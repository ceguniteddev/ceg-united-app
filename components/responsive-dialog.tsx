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
  readonly title: string | React.ReactNode;
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
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={false}>
      {isOpen && (
        <div className="animate-in fade-in-0 fixed inset-0 z-50 bg-black/50" />
      )}
      <DialogContent
        id={id}
        className={cn("max-h-screen overflow-y-auto p-4 md:p-6", className)}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onEscapeAttempt?.();
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={cn(descriptionClassName)}>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
