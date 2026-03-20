import dynamic from "next/dynamic";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResponsiveDialog } from "@/components/responsive-dialog";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

import React, { useCallback, useState, useMemo } from "react";
import { Button } from "./ui/button";
import {
  Loader2Icon,
  MailIcon,
  Paperclip,
  X,
  FileIcon,
  FileText,
} from "lucide-react";
import { useUserQuery } from "@/hooks/user";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useUserDocumentsQuery } from "@/hooks/document";
import { cn } from "@/lib/utils";
import { z } from "zod";

type Props = {
  referenceNumber?: string;
  userId: string;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SendEmail = ({ referenceNumber, userId, isOpen, setIsOpen }: Props) => {
  const { userData } = useUserQuery(userId);
  const { userDocuments, isLoading: isLoadingDocs } = useUserDocumentsQuery({
    userId,
  });
  const [content, setContent] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subject, setSubject] = useState(referenceNumber ?? "");
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<UserDoc[]>([]);
  const [isDocPickerOpen, setIsDocPickerOpen] = useState(false);

  // Helper: Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper: Truncate filename for mobile
  const truncateFilename = (fileName: string, maxLength = 25) => {
    if (fileName.length <= maxLength) return fileName;
    const lastDotIndex = fileName.lastIndexOf(".");
    if (lastDotIndex !== -1) {
      const extension = fileName.substring(lastDotIndex);
      const nameWithoutExt = fileName.substring(0, lastDotIndex);
      return `${nameWithoutExt.substring(0, maxLength - extension.length - 3)}...${extension}`;
    }
    return `${fileName.substring(0, maxLength - 3)}...`;
  };

  // Helper: Toggle document selection
  const toggleDocument = (doc: UserDoc) => {
    setSelectedDocuments((prev) => {
      const isSelected = prev.some((d) => d.path === doc.path);
      if (isSelected) {
        return prev.filter((d) => d.path !== doc.path);
      } else {
        // Check limit
        if (prev.length >= 10) {
          toast.error("Maximum 10 attachments allowed");
          return prev;
        }
        return [...prev, doc];
      }
    });
  };

  // Helper: Remove document
  const removeDocument = (doc: UserDoc) => {
    setSelectedDocuments((prev) => prev.filter((d) => d.path !== doc.path));
  };

  // Calculate total attachment size
  const totalAttachmentSize = useMemo(() => {
    return selectedDocuments.reduce((sum, doc) => sum + doc.size, 0);
  }, [selectedDocuments]);

  // Validate email addresses
  const validateEmail = (email: string): boolean => {
    try {
      z.string().email().parse(email.trim());
      return true;
    } catch {
      return false;
    }
  };

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Validate "To" field
    if (!to.trim()) {
      toast.error("Please enter recipient email address");
      return;
    }

    // Validate email format
    const toEmails = to
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    for (const email of toEmails) {
      if (!validateEmail(email)) {
        toast.error(`Invalid email format: ${email}`);
        return;
      }
    }

    // Validate subject and content
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter email content");
      return;
    }

    // Validate attachment size (25MB limit)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (totalAttachmentSize > maxSize) {
      toast.error(
        `Total attachment size exceeds 25MB limit (${formatFileSize(totalAttachmentSize)})`,
      );
      return;
    }

    setIsDeleteDialogOpen(true);
  };

  const sendEmailClick = useCallback(async () => {
    if (!to.trim() || !subject || !content) return;
    setIsSending(true);

    try {
      // Parse "To" emails
      const toEmails = to
        .split(",")
        .map((e) => e.trim())
        .filter(Boolean);

      // Parse CC emails
      const ccList = cc
        ? cc
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : undefined;

      // Send email via API route (handles attachments server-side)
      const response = await fetch("/api/send-email-with-attachments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: toEmails.length === 1 ? toEmails[0] : toEmails,
          cc: ccList && ccList.length > 0 ? ccList : undefined,
          subject,
          content,
          userId,
          documentPaths: selectedDocuments.map((doc) => doc.path),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to send email");
      }

      toast.success("Email sent successfully");
      setIsDeleteDialogOpen(false);

      // Reset form
      setTo("");
      setSubject(referenceNumber ?? "");
      setContent("");
      setSelectedDocuments([]);
      setCc("");

      // Close modal
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to send email", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send email",
      );
    } finally {
      setIsSending(false);
    }
  }, [
    subject,
    content,
    cc,
    to,
    selectedDocuments,
    referenceNumber,
    userId,
    setIsOpen,
  ]);

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      title="Send Email"
      description={`Send an email to the client regarding ${referenceNumber || "this application"}`}
      className="max-w-[95vw] sm:max-w-[700px] lg:max-w-[900px]"
    >
      <div className="flex flex-col gap-4">
        {/* To and CC Fields - Responsive Grid */}
        <div className="flex flex-col gap-4 sm:grid sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="to" className="text-sm font-medium">
              To{" "}
              <span className="text-xs text-muted-foreground">
                (comma separated for multiple)
              </span>
            </Label>
            <Input
              id="to"
              placeholder="recipient@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cc" className="text-sm font-medium">
              CC{" "}
              <span className="text-xs text-muted-foreground">
                (comma separated)
              </span>
            </Label>
            <Input
              id="cc"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Subject Field */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject" className="text-sm font-medium">
            Subject
          </Label>
          <Input
            id="subject"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Attachments Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Attachments</Label>
            <Sheet open={isDocPickerOpen} onOpenChange={setIsDocPickerOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="cursor-pointer"
                  disabled={isLoadingDocs}
                >
                  {isLoadingDocs ? (
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Paperclip className="mr-2 size-4" />
                  )}
                  Add Attachment
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85vh] sm:h-[80vh] flex flex-col p-0"
              >
                <SheetHeader className="px-4 py-4 sm:px-6 border-b">
                  <SheetTitle>Select Documents</SheetTitle>
                  <p className="text-sm text-muted-foreground">
                    Choose from client&apos;s uploaded documents
                  </p>
                </SheetHeader>
                <ScrollArea className="flex-1 px-4 py-2 sm:px-6">
                  <div className="flex flex-col gap-2">
                    {!userDocuments || userDocuments.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FileIcon className="size-12 text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground">
                          No documents available
                        </p>
                      </div>
                    ) : (
                      userDocuments.map((doc: UserDoc) => {
                        const isSelected = selectedDocuments.some(
                          (d) => d.path === doc.path,
                        );
                        return (
                          <div
                            key={doc.path}
                            className={cn(
                              "flex items-center gap-3 p-3 sm:p-4 rounded-lg border bg-card hover:bg-muted cursor-pointer transition-colors",
                              isSelected && "bg-muted border-primary",
                            )}
                            onClick={() => toggleDocument(doc)}
                          >
                            <Checkbox
                              checked={isSelected}
                              className="flex-shrink-0"
                            />
                            <FileText className="size-5 text-muted-foreground flex-shrink-0" />
                            <div className="flex flex-col gap-1 min-w-0 flex-1">
                              <span className="text-sm font-medium break-words">
                                {doc.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(doc.size)}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
                {selectedDocuments.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-t bg-muted/30">
                    <span className="text-sm font-medium">
                      {selectedDocuments.length} selected (
                      {formatFileSize(totalAttachmentSize)})
                    </span>
                    <Button size="sm" onClick={() => setIsDocPickerOpen(false)}>
                      Done
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>
          </div>

          {/* Selected Documents Display - Mobile: Vertical, Desktop: Horizontal */}
          {selectedDocuments.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              {selectedDocuments.map((doc) => (
                <Badge
                  key={doc.path}
                  variant="secondary"
                  className="flex items-center gap-2 pr-1 py-1.5 w-full sm:w-auto justify-between sm:justify-start"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileText className="size-3 flex-shrink-0" />
                    <span className="text-xs truncate sm:max-w-[150px]">
                      {truncateFilename(doc.name)}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({formatFileSize(doc.size)})
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-5 p-0 hover:bg-destructive/10 flex-shrink-0"
                    onClick={() => removeDocument(doc)}
                  >
                    <X className="size-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Email Editor */}
        <div className="flex flex-col gap-1.5">
          <Label className="text-sm font-medium">Email Body</Label>
          <Editor content={content} onContentChange={setContent} />
        </div>

        {/* Send Button */}
        <Button
          variant="default"
          type="button"
          className="cursor-pointer w-full sm:w-auto"
          onClick={(e) => handleOpenDeleteDialog(e)}
          disabled={isSending || isLoadingDocs}
        >
          <MailIcon className="mr-2 size-4" /> Send Email
        </Button>

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Confirm Send Email?
              </AlertDialogTitle>
              <AlertDialogDescription className="flex flex-col gap-2 text-sm">
                <span>This action will send an email to:</span>
                <span className="font-bold break-all text-xs sm:text-sm">
                  {to}
                </span>
                {cc && (
                  <span className="text-xs text-muted-foreground">
                    CC: {cc}
                  </span>
                )}
                {selectedDocuments.length > 0 && (
                  <span className="text-xs text-muted-foreground mt-1">
                    With {selectedDocuments.length} attachment
                    {selectedDocuments.length > 1 ? "s" : ""} (
                    {formatFileSize(totalAttachmentSize)})
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                disabled={isSending}
                className="cursor-pointer w-full sm:w-auto"
              >
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={sendEmailClick}
                disabled={isSending}
                className="cursor-pointer w-full sm:w-auto"
              >
                {isSending && (
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                )}
                {isSending ? "Sending..." : "Send Email"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ResponsiveDialog>
  );
};

export default SendEmail;
