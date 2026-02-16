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
  readonly isModal?: boolean;
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
  isModal = true,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen} modal={isModal}>
      <DialogContent
        id={id}
        className={cn(
          "max-h-[calc(100vh-16px)] max-h-[calc(100dvh-16px)] overflow-hidden flex flex-col",
          "p-0",
          className,
        )}
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
          onEscapeAttempt?.();
        }}
      >
        <DialogHeader className="flex-shrink-0 px-4 pt-4 pb-3 border-b bg-background md:px-6 md:pt-6">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={cn(descriptionClassName)}>
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
