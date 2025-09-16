import dynamic from "next/dynamic";
import {
  AlertDialog,
  AlertDialogAction,
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
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
const Editor = dynamic(() => import("@/components/Editor"), { ssr: false });

import React, { use, useCallback, useState } from "react";
import { Button } from "./ui/button";
import { Loader2Icon, MailIcon } from "lucide-react";
import { ApplyFunding } from "@/schema/apply-funding";
import { useUserQuery } from "@/hooks/user";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { sendMail } from "@/lib/nodemailer";
import { toast } from "sonner";

const SendEmail = ({ formData }: { formData: ApplyFunding }) => {
  const { users } = useUserQuery(formData.userId);
  const [content, setContent] = React.useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [cc, setCc] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleOpenDeleteDialog = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteDialogOpen(true);
  };
  const sendEmailClick = useCallback(async () => {
    if (!users?.email || !subject || !content) return;
    setIsSending(true);

    try {
      await sendMail({ emailTo: users.email, subject, bodyHTML: content, cc: cc.split(",") });
      toast.success("Email sent successfully");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to send email", error);
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  }, [subject, users, content, cc]);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="space-y-2">
          <div className="grid grid-cols-7 gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              placeholder="subject"
              className="col-span-6"
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-7 gap-2">
            <Label htmlFor="cc">
              CC <span className="text-xs text-muted-foreground">(comma separated)</span>
            </Label>
            <Input
              placeholder="cc"
              className="col-span-6"
              onChange={(e) => setCc(e.target.value)}
            />
          </div>
        </CardTitle>
        <CardAction>
          <Button
            variant="outline"
            type="button"
            className="cursor-pointer bg-slate-100 hover:bg-slate-200"
            onClick={(e) => handleOpenDeleteDialog(e)}
          >
            <MailIcon className="mr-2 h-4 w-4" color="red" /> Send Email
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-2">
        <Editor content={content} onContentChange={setContent} />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmation?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will send an email to the recipient
                <span className="font-bold block mt-2 break-all">{users?.email}</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSending} className="cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={sendEmailClick}
                disabled={isSending}
                className="cursor-pointer"
              >
                {isSending && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
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
