"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cancelUserMembership } from "@/service/membership";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function CancelMembershipButton({
  userId,
  membershipId,
}: {
  userId: string;
  membershipId: string;
}) {
  const [isCanceling, setIsCanceling] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleCancel = async () => {
    setIsCanceling(true);
    try {
      await cancelUserMembership(userId, membershipId);
      queryClient.invalidateQueries({ queryKey: ["membership", userId] });
      queryClient.invalidateQueries({ queryKey: ["all-memberships"] });
      toast.success("Membership successfully canceled.");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel membership");
    } finally {
      setIsCanceling(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          disabled={isCanceling}
          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          {isCanceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Cancel Membership
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel your membership? You will lose
            access to premium features.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Membership</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            Yes, Cancel Membership
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
