"use client";

import { UploadIcon } from "lucide-react";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { DropEvent, DropzoneOptions, FileRejection } from "react-dropzone";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";

type DropzoneContextType = {
  src?: File[];
  accept?: DropzoneOptions["accept"];
  maxSize?: DropzoneOptions["maxSize"];
  minSize?: DropzoneOptions["minSize"];
  maxFiles?: DropzoneOptions["maxFiles"];
};

const renderBytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)}${units[unitIndex]}`;
};

const DropzoneContext = createContext<DropzoneContextType | undefined>(
  undefined,
);

export type DropzoneProps = Omit<DropzoneOptions, "onDrop"> & {
  src?: File[];
  className?: string;
  onDrop?: (
    acceptedFiles: File[],
    fileRejections: FileRejection[],
    event: DropEvent,
  ) => void;
  children?: ReactNode;
};

export const Dropzone = ({
  accept,
  maxFiles,
  maxSize,
  minSize,
  onDrop,
  onError,
  disabled,
  src,
  className,
  children,
  ...props
}: DropzoneProps) => {
  const { t } = useTranslation();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    ...(maxFiles !== undefined ? { maxFiles } : {}),
    maxSize,
    minSize,
    onError,
    disabled,
    onDrop: (acceptedFiles, fileRejections, event) => {
      if (fileRejections.length > 0) {
        fileRejections.forEach((file) => {
          file.errors.forEach((err) => {
            if (err.code === "file-too-large") {
              toast.warning(
                maxSize
                  ? t("dropzone.fileTooLarge", { size: renderBytes(maxSize) })
                  : err.message,
              );
              return;
            }

            if (err.code === "file-invalid-type") {
              toast.warning(err.message);
              return;
            }

            if (err.code === "too-many-files") {
              toast.warning(
                t("dropzone.tooManyFiles", { count: maxFiles ?? 0 }),
              );
              return;
            }

            toast.warning(err.message);
          });
        });
        return;
      }

      onDrop?.(acceptedFiles, fileRejections, event);
    },
    ...props,
  });

  return (
    <DropzoneContext.Provider
      key={JSON.stringify(src)}
      value={{ src, accept, maxSize, minSize, maxFiles }}
    >
      <Button
        className={cn(
          "relative h-auto w-full flex-col overflow-hidden min-h-[100px] sm:min-h-[120px]",
          isDragActive && "outline-none ring-1 ring-ring",
          className,
        )}
        disabled={disabled}
        type="button"
        variant="outline"
        {...getRootProps()}
      >
        <input {...getInputProps()} disabled={disabled} />
        {children}
      </Button>
    </DropzoneContext.Provider>
  );
};

const useDropzoneContext = () => {
  const context = useContext(DropzoneContext);

  if (!context) {
    throw new Error("useDropzoneContext must be used within a Dropzone");
  }

  return context;
};

export type DropzoneContentProps = {
  children?: ReactNode;
  className?: string;
};

const maxLabelItems = 3;

export const DropzoneContent = ({
  children,
  className,
}: DropzoneContentProps) => {
  const { t, locale } = useTranslation();
  const { src } = useDropzoneContext();

  if (!src) {
    return null;
  }

  if (children) {
    return children;
  }

  const listLocale = locale === "es" ? "es" : "en";

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-10 sm:size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={20} className="sm:w-6 sm:h-6" />
      </div>
      <p className="my-2 w-full truncate font-medium text-xs sm:text-sm">
        {src.length > maxLabelItems
          ? `${new Intl.ListFormat(listLocale).format(
              src.slice(0, maxLabelItems).map((file) => file.name),
            )} ${t("dropzone.andMore", { count: src.length - maxLabelItems })}`
          : new Intl.ListFormat(listLocale).format(
              src.map((file) => file.name),
            )}
      </p>
      <p className="w-full text-wrap text-muted-foreground text-[10px] sm:text-xs">
        {t("dropzone.dragAndDropReplace")}
      </p>
    </div>
  );
};

export type DropzoneEmptyStateProps = {
  children?: ReactNode;
  className?: string;
};

export const DropzoneEmptyState = ({
  children,
  className,
}: DropzoneEmptyStateProps) => {
  const { t, locale } = useTranslation();
  const { src, accept, maxSize, minSize, maxFiles } = useDropzoneContext();

  if (src) {
    return null;
  }

  if (children) {
    return children;
  }

  let caption = "";
  const listLocale = locale === "es" ? "es" : "en";

  if (accept) {
    caption += `${t("dropzone.accepts")} `;
    caption += new Intl.ListFormat(listLocale).format(Object.keys(accept));
  }

  if (minSize && maxSize) {
    caption += ` between ${renderBytes(minSize)} and ${renderBytes(maxSize)}`;
  } else if (minSize) {
    caption += ` at least ${renderBytes(minSize)}`;
  } else if (maxSize) {
    caption += ` less than ${renderBytes(maxSize)}`;
  }

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="flex size-10 sm:size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <UploadIcon size={20} className="sm:w-6 sm:h-6" />
      </div>
      <p className="my-2 w-full truncate text-wrap font-medium text-xs sm:text-sm">
        {maxFiles === 1 ? t("dropzone.uploadAFile") : t("dropzone.uploadFiles")}
      </p>
      <p className="w-full truncate text-wrap text-muted-foreground text-[10px] sm:text-xs">
        {t("dropzone.dragAndDropUpload")}
      </p>
      {caption && (
        <p className="text-wrap text-muted-foreground text-[10px] sm:text-xs">
          {caption}.
        </p>
      )}
    </div>
  );
};
