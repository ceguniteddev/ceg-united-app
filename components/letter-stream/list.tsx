"use client";

import { useState } from "react";
import {
  useGetDisputeLetters,
  useDeleteDisputeLetter,
} from "@/hooks/dispute-letter";
import { DisputeLetter } from "@/schema/dispute-letter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Eye,
  Trash2,
  FileText,
  Clock,
  CheckCircle,
  Send,
  Loader,
} from "lucide-react";
import { format } from "date-fns";
import Spinner from "../Spinner";
import EmptyState from "../EmptyState";
import DisputeLetterPreviewModal from "./DisputeLetterPreviewModal";

interface LetterListProps {
  onViewLetter?: (letter: DisputeLetter) => void;
  onCreateNew?: () => void;
}

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  "pending-review": {
    label: "Pending Review",
    color: "bg-amber-500",
    icon: Clock,
  },
  approved: { label: "Approved", color: "bg-green-500", icon: CheckCircle },
  sent: { label: "Sent", color: "bg-blue-500", icon: Send },
  delivered: { label: "Delivered", color: "bg-blue-700", icon: CheckCircle },
  responded: { label: "Responded", color: "bg-purple-500", icon: FileText },
  resolved: { label: "Resolved", color: "bg-green-700", icon: CheckCircle },
  escalated: { label: "Escalated", color: "bg-red-500", icon: FileText },
};

const disputeTypeLabels: Record<string, string> = {
  "reinserted-account": "Reinserted Account",
  "inaccurate-information": "Inaccurate Information",
  "identity-theft": "Identity Theft",
  "duplicate-account": "Duplicate Account",
  "outdated-information": "Outdated Information",
  "incorrect-balance": "Incorrect Balance",
  "incorrect-payment-history": "Incorrect Payment History",
  "unauthorized-inquiry": "Unauthorized Inquiry",
  "mixed-file": "Mixed File",
  other: "Other",
};

export default function LetterList({
  onViewLetter,
  onCreateNew,
}: LetterListProps) {
  const { data: letters, isLoading } = useGetDisputeLetters();
  const { mutateAsync: deleteLetter, isPending: isDeleting } =
    useDeleteDisputeLetter();
  const [letterToDelete, setLetterToDelete] = useState<string | null>(null);
  const [viewLetter, setViewLetter] = useState<DisputeLetter | null>(null);

  const handleDelete = async () => {
    if (letterToDelete) {
      try {
        await deleteLetter(letterToDelete);
        setLetterToDelete(null);
      } catch (error) {
        console.error("Failed to delete letter", error);
      }
    }
  };

  if (isLoading) {
    return <Spinner displayText="Loading letters..." />;
  }

  if (!letters || letters.length === 0) {
    return (
      <EmptyState
        title="No Letters Yet"
        description="You haven't created any dispute letters. Get started by creating your first letter."
        actionLabel="Create New Letter"
        onAction={onCreateNew}
      />
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Your Dispute Letters</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                {/* <TableHead>Status</TableHead> */}
                {/* <TableHead>Recipients</TableHead> */}
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {letters.map((letter) => {
                const statusInfo = statusConfig[letter.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <TableRow key={letter.id}>
                    <TableCell className="font-medium">
                      {letter.letterTitle}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {disputeTypeLabels[letter.disputeType] ||
                          letter.disputeType}
                      </span>
                    </TableCell>
                    {/* <TableCell>
                      <Badge className={`${statusInfo.color} text-white`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo.label}
                      </Badge>
                    </TableCell> */}
                    {/* <TableCell>
                      <span className="text-sm text-gray-600">
                        {letter.recipients?.length || 0} recipient(s)
                      </span>
                    </TableCell> */}
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {letter.createdAt
                          ? format(new Date(letter.createdAt), "MMM dd, yyyy")
                          : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setViewLetter(letter);
                            onViewLetter?.(letter);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(letter.status === "draft" ||
                          letter.status === "pending-review") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLetterToDelete(letter.id!)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!letterToDelete}
        onOpenChange={(open) => !open && setLetterToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Letter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this letter? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DisputeLetterPreviewModal
        letter={viewLetter}
        isOpen={!!viewLetter}
        onClose={() => setViewLetter(null)}
      />
    </>
  );
}
