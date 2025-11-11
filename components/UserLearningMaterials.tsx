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
import { Book, FileText, CheckCircle2, Clock, Trophy, Trash2, MoreVertical } from "lucide-react";
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

const UserLearningMaterials = ({ userId, isAdminView = false }: UserLearningMaterialsProps) => {
  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(userId);
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
      <div className="w-full space-y-4">
        <EmptyState
          title="No Learning Materials Available"
          description="This user doesn't have access to any courses yet. Courses are available to users with active Denefits contracts."
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
    (course) => course.enrollment?.progressPercentage === 100
  ).length;
  const inProgressCourses = coursesWithProgress.filter(
    (course) =>
      (course.enrollment?.progressPercentage ?? 0) > 0 &&
      course.enrollment?.progressPercentage !== 100
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
                <p className="text-sm text-muted-foreground">Total Courses</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Learning Materials</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCourses} {totalCourses === 1 ? "course" : "courses"} enrolled
          </p>
        </div>
        {isAdminView && <EnrollUserInCourseDialog userId={userId} />}
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithProgress.map((course) => {
          const totalChapters = course.totalChapters || 0;
          const completedChapters = course.completedChapters || 0;
          const progressPercentage = course.enrollment?.progressPercentage || 0;
          const publishedChapters = course.chapters?.filter((c) => c.isPublished).length || 0;

          const isCompleted = progressPercentage === 100;
          const isInProgress = progressPercentage > 0 && !isCompleted;

          return (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative w-full h-48 bg-gray-200">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title || "Course image"}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <Book className="w-16 h-16 text-white" />
                  </div>
                )}

                {/* Progress Badge */}
                {isCompleted && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      <Trophy className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  </div>
                )}
                {isInProgress && !isCompleted && (
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-orange-600 hover:bg-orange-700">
                      <Clock className="w-3 h-3 mr-1" />
                      In Progress
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                  <div className="flex items-center gap-2">
                    {course.isPublished && (
                      <Badge variant="default" className="shrink-0">
                        Published
                      </Badge>
                    )}
                    {isAdminView && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                            Remove Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
                {course.category && (
                  <Badge variant="secondary" className="w-fit">
                    {course.category}
                  </Badge>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                {course.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
                )}

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {completedChapters} of {publishedChapters} chapters completed
                  </p>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    <span>
                      {publishedChapters} {publishedChapters === 1 ? "chapter" : "chapters"}
                    </span>
                  </div>
                  {completedChapters > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span>
                        {completedChapters}/{publishedChapters}
                      </span>
                    </div>
                  )}
                </div>

                {course.attachments && course.attachments.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">{course.attachments.length}</span> attachment
                    {course.attachments.length !== 1 ? "s" : ""}
                  </div>
                )}

                {/* Last Accessed */}
                {course.enrollment?.lastAccessedAt && (
                  <p className="text-xs text-muted-foreground">
                    Last accessed: {new Date(course.enrollment.lastAccessedAt).toLocaleDateString()}
                  </p>
                )}

                <Link
                  href={`/admin/educational-materials/courses/${course.id}`}
                  className="block w-full"
                >
                  <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                    {isCompleted
                      ? "Review Course"
                      : isInProgress
                      ? "Continue Learning"
                      : "Start Course"}
                  </button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Remove Course Confirmation Dialog */}
      <AlertDialog
        open={!!courseToRemove}
        onOpenChange={(open) => !open && setCourseToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{courseToRemove?.title}</strong> from this
              user? This will delete their enrollment and all progress data for this course. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUnenrolling}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveCourse}
              disabled={isUnenrolling}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isUnenrolling ? "Removing..." : "Remove Course"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserLearningMaterials;
