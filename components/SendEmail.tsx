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
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

import React, { use, useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon, MailIcon } from "lucide-react";
import { useUserQuery } from "@/hooks/user";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { sendMail } from "@/lib/nodemailer";
import { toast } from "sonner";

type Props = {
  referenceNumber?: string;
  userId: string;
};

const SendEmail = ({ referenceNumber, userId }: Props) => {
  const { userData } = useUserQuery(userId);
  const [content, setContent] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subject, setSubject] = useState(referenceNumber ?? "");
  const [cc, setCc] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Validate subject and content
    if (!subject.trim()) {
      toast.error("Please enter a subject");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter email content");
      return;
    }

    setIsDeleteDialogOpen(true);
  };
  const sendEmailClick = useCallback(async () => {
    if (!userData?.email || !subject || !content) return;
    setIsSending(true);

    try {
      await sendMail({
        emailTo: userData.email,
        subject,
        bodyHTML: content,
        cc: cc.split(","),
      });
      toast.success("Email sent successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to send email", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  }, [subject, userData, content, cc]);
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject
            </Label>
            <Input
              placeholder="subject"
              defaultValue={referenceNumber ?? ""}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc" className="text-sm font-medium">
              CC{" "}
              <span className="text-xs text-muted-foreground">
                (comma separated)
              </span>
            </Label>
            <Input placeholder="cc" onChange={(e) => setCc(e.target.value)} />
          </div>
          <Button
            variant="outline"
            type="button"
            className="cursor-pointer bg-slate-100 hover:bg-slate-200 w-full sm:w-auto"
            onClick={(e) => handleOpenDeleteDialog(e)}
          >
            <MailIcon className="mr-2 h-4 w-4" color="red" /> Send Email
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-4 sm:p-6">
        <Editor content={content} onContentChange={setContent} />

        <AlertDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
        >
          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-base sm:text-lg">
                Confirmation?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This action will send an email to the recipient
                <span className="font-bold block mt-2 break-all text-xs sm:text-sm">
                  {userData?.email}
                </span>
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
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isSending ? "Sending..." : "Send Email"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default SendEmail;
