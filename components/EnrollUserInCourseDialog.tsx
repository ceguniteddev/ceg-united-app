"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useGetCourses, useEnrollUserInCourse } from "@/hooks/educational-materials/course";
import { useGetUserCoursesWithProgress } from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Book, UserPlus, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface EnrollUserInCourseDialogProps {
  userId: string;
}

const EnrollUserInCourseDialog = ({ userId }: EnrollUserInCourseDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { courses, isLoading: isCoursesLoading } = useGetCourses();
  const { coursesWithProgress, isLoading: isEnrolledLoading } =
    useGetUserCoursesWithProgress(userId);
  const { enrollUser, isEnrolling } = useEnrollUserInCourse();

  // Get IDs of courses user is already enrolled in
  const enrolledCourseIds = new Set(coursesWithProgress?.map((course) => course.id) || []);

  // Filter out courses user is already enrolled in
  const availableCourses =
    courses?.filter((course) => course.isPublished && !enrolledCourseIds.has(course.id)) || [];

  const handleEnroll = async () => {
    if (!selectedCourseId) {
      toast.error("Please select a course");
      return;
    }

    try {
      await enrollUser({ userId, courseId: selectedCourseId });
      setOpen(false);
      setSelectedCourseId(null);
    } catch (error) {
      console.error("Enrollment failed:", error);
    }
  };

  const isLoading = isCoursesLoading || isEnrolledLoading;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="w-4 h-4" />
          Enroll in Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Enroll User in Course</DialogTitle>
          <DialogDescription>
            Select a course to enroll this user. Only published courses that the user is not already
            enrolled in are shown.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8">
            <Spinner displayText="Loading courses..." />
          </div>
        ) : availableCourses.length === 0 ? (
          <div className="py-8 text-center">
            <Book className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No available courses to enroll. User may already be enrolled in all published courses.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCourses.map((course) => {
                const isSelected = selectedCourseId === course.id;
                const publishedChapters = course.chapters?.filter((c) => c.isPublished).length || 0;

                return (
                  <Card
                    key={course.id}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "ring-2 ring-primary shadow-md" : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedCourseId(course.id!)}
                  >
                    <div className="relative w-full h-32 bg-gray-200">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title || "Course image"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                          <Book className="w-12 h-12 text-white" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-primary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        </div>
                      )}
                    </div>

                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
                      </div>

                      {course.category && (
                        <Badge variant="secondary" className="text-xs">
                          {course.category}
                        </Badge>
                      )}

                      {course.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {publishedChapters} {publishedChapters === 1 ? "chapter" : "chapters"}
                        </span>
                        {course.attachments && course.attachments.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{course.attachments.length} attachments</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedCourseId(null);
            }}
            disabled={isEnrolling}
          >
            Cancel
          </Button>
          <Button onClick={handleEnroll} disabled={!selectedCourseId || isEnrolling || isLoading}>
            {isEnrolling ? (
              <>
                <Spinner displayText="" />
                Enrolling...
              </>
            ) : (
              "Enroll User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollUserInCourseDialog;
