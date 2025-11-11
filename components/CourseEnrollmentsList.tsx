"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, UserMinus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
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

interface CourseEnrollment {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  enrolledAt: Date;
  lastAccessedAt?: Date;
  progressPercentage: number;
  completedAt?: Date;
}

interface CourseEnrollmentsListProps {
  courseId: string;
  enrollments?: CourseEnrollment[];
  onRefresh?: () => void;
}

const CourseEnrollmentsList = ({
  courseId,
  enrollments = [],
  onRefresh,
}: CourseEnrollmentsListProps) => {
  const [unenrollingUserId, setUnenrollingUserId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const handleUnenroll = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/${userId}/courses/${courseId}/unenroll`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to unenroll user");
      }

      toast.success("User unenrolled successfully");
      onRefresh?.();
      setSelectedUserId(null);
    } catch (error) {
      toast.error("Failed to unenroll user");
      console.error(error);
    } finally {
      setUnenrollingUserId(null);
    }
  };

  if (enrollments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Course Enrollments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No users enrolled in this course yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Course Enrollments ({enrollments.length})
            </CardTitle>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{enrollment.userName || "Unknown User"}</p>
                    {enrollment.progressPercentage === 100 && (
                      <Badge className="bg-green-600">Completed</Badge>
                    )}
                    {enrollment.progressPercentage > 0 && enrollment.progressPercentage < 100 && (
                      <Badge className="bg-orange-600">In Progress</Badge>
                    )}
                  </div>
                  {enrollment.userEmail && (
                    <p className="text-sm text-muted-foreground">{enrollment.userEmail}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Progress: {enrollment.progressPercentage}%</span>
                    <span>Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</span>
                    {enrollment.lastAccessedAt && (
                      <span>
                        Last accessed: {new Date(enrollment.lastAccessedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setSelectedUserId(enrollment.userId)}
                  disabled={unenrollingUserId === enrollment.userId}
                >
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unenroll
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!selectedUserId}
        onOpenChange={(open) => !open && setSelectedUserId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unenroll User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unenroll this user from the course? This action will remove
              their enrollment and progress data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUserId) {
                  setUnenrollingUserId(selectedUserId);
                  handleUnenroll(selectedUserId);
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Unenroll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CourseEnrollmentsList;
