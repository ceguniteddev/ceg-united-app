"use client";

import React from "react";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserCoursesWithProgress } from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Book, FileText, CheckCircle2, Clock, Trophy, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import HeaderBox from "@/components/HeaderBox";

const MyLearningPage = () => {
  const { user } = useAuth();
  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(user?.uid || "");

  if (isLoading) {
    return <Spinner displayText="Loading your courses..." />;
  }

  if (!coursesWithProgress || coursesWithProgress.length === 0) {
    return (
      <div className="transactions">
        <HeaderBox
          title="My Learning"
          subtext="Access your enrolled courses and track your progress"
        />
        <EmptyState
          title="No Courses Available"
          description="You don't have access to any courses yet. Courses become available when you have an active Denefits contract."
        />
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

  return (
    <div className="transactions">
      <HeaderBox
        title="My Learning"
        subtext="Access your enrolled courses and track your progress"
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesWithProgress.map((course) => {
          const progressPercentage = course.enrollment?.progressPercentage || 0;
          const publishedChapters = course.chapters?.filter((c) => c.isPublished).length || 0;
          const completedChapters = course.completedChapters || 0;

          const isCompleted = progressPercentage === 100;
          const isInProgress = progressPercentage > 0 && !isCompleted;

          return (
            <Link key={course.id} href={`/my-learning/${course.id}`}>
              <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer h-full">
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
                  </div>
                  {course.category && (
                    <Badge variant="secondary" className="w-fit">
                      {course.category}
                    </Badge>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {course.description}
                    </p>
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

                  {/* Last Accessed */}
                  {course.enrollment?.lastAccessedAt && (
                    <p className="text-xs text-muted-foreground">
                      Last accessed:{" "}
                      {new Date(course.enrollment.lastAccessedAt).toLocaleDateString()}
                    </p>
                  )}

                  <div className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2">
                    {isCompleted
                      ? "Review Course"
                      : isInProgress
                      ? "Continue Learning"
                      : "Start Course"}
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MyLearningPage;
