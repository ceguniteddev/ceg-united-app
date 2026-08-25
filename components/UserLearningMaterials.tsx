"use client";

import React, { useState } from "react";
import {
  useGetUserCoursesWithProgress,
  useUnenrollUserFromCourse,
} from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Book,
  FileText,
  CheckCircle2,
  Clock,
  Trophy,
  Trash2,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import EnrollUserInCourseDialog from "@/components/EnrollUserInCourseDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";

interface UserLearningMaterialsProps {
  userId: string;
  isAdminView?: boolean;
}

const UserLearningMaterials = ({
  userId,
  isAdminView = false,
}: UserLearningMaterialsProps) => {
  const { coursesWithProgress, isLoading } =
    useGetUserCoursesWithProgress(userId);
  const { unenrollUser, isUnenrolling } = useUnenrollUserFromCourse();
  const [courseToRemove, setCourseToRemove] = useState<{
    id: string;
    title: string;
  } | null>(null);

  if (isLoading) {
    return <Spinner displayText="Loading learning materials..." />;
  }

  if (!coursesWithProgress || coursesWithProgress.length === 0) {
    return (
      <div className="w-full space-y-6">
        <EmptyState
          title="No Learning Materials Enrolled"
          description={
            isAdminView
              ? "This client does not currently have any active course enrollments. You can manually enable published courses for them below."
              : "You do not have access to any courses yet. Browse our course catalog to start learning."
          }
        />
        {isAdminView && (
          <div className="flex justify-center">
            <EnrollUserInCourseDialog userId={userId} />
          </div>
        )}
      </div>
    );
  }

  // Calculate statistics
  const totalCourses = coursesWithProgress.length;
  const completedCourses = coursesWithProgress.filter(
    (course) => course.enrollment?.progressPercentage === 100,
  ).length;
  const inProgressCourses = coursesWithProgress.filter(
    (course) =>
      (course.enrollment?.progressPercentage ?? 0) > 0 &&
      course.enrollment?.progressPercentage !== 100,
  ).length;

  const handleRemoveCourse = async () => {
    if (!courseToRemove) return;

    try {
      await unenrollUser({ userId, courseId: courseToRemove.id });
      setCourseToRemove(null);
    } catch (error) {
      console.error("Failed to remove course:", error);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Enrolled</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
              <Book className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{inProgressCourses}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedCourses}</p>
              </div>
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Client Learning Materials
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCourses} {totalCourses === 1 ? "course" : "courses"} active
            for this client
          </p>
        </div>
        {isAdminView && <EnrollUserInCourseDialog userId={userId} />}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithProgress.map((course) => {
          const completedChapters = course.completedChapters || 0;
          const progressPercentage = course.enrollment?.progressPercentage || 0;
          const publishedChapters =
            course.chapters?.filter((c) => c.isPublished).length || 0;

          const isCompleted = progressPercentage === 100;
          const isInProgress = progressPercentage > 0 && !isCompleted;
          const isManual =
            course.enrollment?.enrollmentSource === "manual_admin";

          return (
            <Card
              key={course.id}
              className="overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between p-0 py-0 gap-0"
            >
              <div>
                <div className="relative w-full h-44 bg-slate-100 dark:bg-slate-800">
                  {course.imageUrl ? (
                    <Image
                      src={course.imageUrl}
                      alt={course.title || "Course image"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                      <Book className="w-14 h-14 text-white opacity-80" />
                    </div>
                  )}

                  {/* Badges on top */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                    {course.category && (
                      <Badge className="bg-black/75 backdrop-blur-sm text-white text-[10px]">
                        {course.category}
                      </Badge>
                    )}
                    {isManual && (
                      <Badge className="bg-blue-600 text-white text-[10px]">
                        Manual Access
                      </Badge>
                    )}
                  </div>

                  {/* Progress Badge */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    </div>
                  )}
                  {isInProgress && !isCompleted && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-orange-600 hover:bg-orange-700 text-white text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        In Progress
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base line-clamp-2">
                      {course.title}
                    </h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {course.isPublished ? (
                        <Badge
                          variant="default"
                          className="text-[10px] bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none"
                        >
                          Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">
                          Draft
                        </Badge>
                      )}
                      {isAdminView && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={() =>
                                setCourseToRemove({
                                  id: course.id!,
                                  title: course.title,
                                })
                              }
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Revoke Course Access
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 pt-0 space-y-3">
                  {course.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progressPercentage}%</span>
                    </div>

                    <Progress
                      value={progressPercentage}
                      className="bg-gray-100 h-1.5"
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>
                        {completedChapters} of {publishedChapters} lectures
                        completed
                      </span>
                      {course.enrollment?.enrolledAt && (
                        <span>
                          Enrolled:{" "}
                          {new Date(
                            course.enrollment.enrolledAt,
                          ).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>
                        {publishedChapters}{" "}
                        {publishedChapters === 1 ? "lecture" : "lectures"}
                      </span>
                    </div>
                    {completedChapters > 0 && (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>
                          {completedChapters}/{publishedChapters}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </div>

              <div className="p-4 pt-0">
                {isAdminView ? (
                  <Link
                    href={`/admin/educational-materials/courses/${course.id}`}
                    className="block w-full"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs"
                    >
                      View in Course Studio
                    </Button>
                  </Link>
                ) : (
                  <Link
                    href={`/client/my-learning/${course.id}`}
                    className="block w-full"
                  >
                    <Button size="sm" className="w-full text-xs">
                      {isCompleted
                        ? "Review Course"
                        : isInProgress
                          ? "Continue Learning"
                          : "Start Course"}
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Revoke Course Confirmation Dialog */}
      <AlertDialog
        open={!!courseToRemove}
        onOpenChange={(open) => !open && setCourseToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Course Access</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke access to{" "}
              <strong>{courseToRemove?.title}</strong> for this client? This
              will remove their enrollment and reset all progress data for this
              course.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnenrolling}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCourse}
              disabled={isUnenrolling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUnenrolling ? "Revoking..." : "Revoke Access"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserLearningMaterials;
