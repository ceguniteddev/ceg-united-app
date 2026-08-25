"use client";

import React, { useState, useMemo } from "react";
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
import {
  useGetCourses,
  useGetUserCoursesWithProgress,
  useEnrollUserInCourse,
} from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Book,
  UserPlus,
  CheckCircle2,
  Search,
  Sparkles,
  FileText,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { COURSES_KEY } from "@/constant/react-query-keys";

interface EnrollUserInCourseDialogProps {
  userId: string;
  triggerButton?: React.ReactNode;
}

const EnrollUserInCourseDialog = ({
  userId,
  triggerButton,
}: EnrollUserInCourseDialogProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [isBatchEnrolling, setIsBatchEnrolling] = useState(false);

  const { courses, isLoading: isCoursesLoading } = useGetCourses();
  const { coursesWithProgress, isLoading: isEnrolledLoading } =
    useGetUserCoursesWithProgress(userId);
  const { enrollUser, isEnrolling } = useEnrollUserInCourse();

  // Get IDs of courses user is already enrolled in
  const enrolledCourseIds = useMemo(() => {
    return new Set(coursesWithProgress?.map((course) => course.id) || []);
  }, [coursesWithProgress]);

  // Filter published courses that the user is not already enrolled in
  const availableCourses = useMemo(() => {
    const list =
      courses?.filter(
        (course) => course.isPublished && !enrolledCourseIds.has(course.id),
      ) || [];

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (course) =>
        course.title?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.category?.toLowerCase().includes(q),
    );
  }, [courses, enrolledCourseIds, searchQuery]);

  const selectedCourses = useMemo(() => {
    const idSet = new Set(selectedCourseIds);
    return courses?.filter((c) => idSet.has(c.id!)) || [];
  }, [courses, selectedCourseIds]);

  const toggleCourse = (id: string) => {
    setSelectedCourseIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedCourseIds.length === availableCourses.length) {
      setSelectedCourseIds([]);
    } else {
      setSelectedCourseIds(availableCourses.map((c) => c.id!));
    }
  };

  const handleEnroll = async () => {
    if (selectedCourseIds.length === 0) {
      toast.error("Please select at least one course to enable");
      return;
    }

    try {
      setIsBatchEnrolling(true);
      await Promise.all(
        selectedCourseIds.map((courseId) =>
          enrollUser({
            userId,
            courseId,
            notes: adminNote.trim() || undefined,
          }),
        ),
      );
      await queryClient.refetchQueries({
        queryKey: [COURSES_KEY, "user", userId, "progress"],
      });
      setOpen(false);
      setSelectedCourseIds([]);
      setAdminNote("");
      setSearchQuery("");
    } catch (error) {
      console.error("Enrollment failed:", error);
    } finally {
      setIsBatchEnrolling(false);
    }
  };

  const isLoading = isCoursesLoading || isEnrolledLoading;
  const busy = isEnrolling || isBatchEnrolling;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <UserPlus className="w-4 h-4" />
            Enable Course Access
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="space-y-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Manually Enable Course Access
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Select one or more published courses to immediately enable for this
            client. This manual grant bypasses standard checkout and activates
            the courses directly in their Learning Center.
          </DialogDescription>
        </DialogHeader>

        {/* Search & Bulk Action Bar */}
        <div className="flex items-center gap-2 my-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search available published courses by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
          {availableCourses.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="shrink-0 text-xs h-9"
            >
              {selectedCourseIds.length === availableCourses.length
                ? "Deselect All"
                : "Select All"}
            </Button>
          )}
        </div>

        {/* Courses Content */}
        {isLoading ? (
          <div className="py-12 flex justify-center items-center">
            <Spinner displayText="Loading available courses..." />
          </div>
        ) : availableCourses.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <Book className="w-12 h-12 mx-auto text-muted-foreground/60" />
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {searchQuery
                ? "No matching courses found"
                : "No courses available for enrollment"}
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {searchQuery
                ? "Try searching with a different keyword."
                : "The client may already be enrolled in all published courses, or no courses are currently published."}
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[340px] pr-3 my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableCourses.map((course) => {
                const publishedChapters =
                  course.chapters?.filter((c) => c.isPublished).length || 0;
                const price = course.price ?? 0;
                const discountPrice = course.discountPrice;
                const effectivePrice =
                  discountPrice != null ? discountPrice : price;
                const isFree = course.isFree || effectivePrice === 0;
                const formattedPrice = effectivePrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                });

                const isChecked = selectedCourseIds.includes(course.id!);

                return (
                  <Card
                    key={course.id}
                    className={`cursor-pointer transition-all border overflow-hidden p-0 py-0 gap-0 ${
                      isChecked
                        ? "ring-2 ring-blue-600 border-blue-600 bg-blue-50/20 dark:bg-blue-950/20 shadow-md"
                        : "hover:border-slate-400 hover:shadow-sm"
                    }`}
                    onClick={() => toggleCourse(course.id!)}
                  >
                    <div className="relative w-full h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title || "Course image"}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                          <Book className="w-10 h-10 text-white opacity-80" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex items-center gap-1.5">
                        {course.category && (
                          <Badge
                            variant="secondary"
                            className="bg-black/75 backdrop-blur-sm text-white text-[10px] font-medium"
                          >
                            {course.category}
                          </Badge>
                        )}
                      </div>

                      <div className="absolute top-2 right-2">
                        {isChecked ? (
                          <Badge className="bg-blue-600 text-white text-xs gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Selected
                          </Badge>
                        ) : isFree ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            Free
                          </Badge>
                        ) : (
                          <Badge className="bg-slate-900/80 backdrop-blur-sm text-white text-[10px]">
                            ${formattedPrice}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardContent className="p-3.5 space-y-2">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm line-clamp-1 text-gray-900 dark:text-gray-100">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span>
                            {publishedChapters}{" "}
                            {publishedChapters === 1 ? "lecture" : "lectures"}
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-slate-500">
                          {isFree
                            ? "Free Course"
                            : `Paid Course ($${formattedPrice})`}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Selected Courses Confirmation Preview & Note */}
        {selectedCourses.length > 0 && (
          <div className="p-3 bg-blue-50 dark:bg-slate-900 border border-blue-200 dark:border-blue-900 rounded-lg space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                Selected ({selectedCourses.length}):
              </div>
              <span className="text-[11px] text-muted-foreground">
                Manual Admin Override
              </span>
            </div>

            {/* Chips of selected courses */}
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
              {selectedCourses.map((c) => (
                <Badge
                  key={c.id}
                  variant="outline"
                  className="bg-white dark:bg-slate-950 text-xs gap-1 pr-1.5 py-0.5"
                >
                  <span className="line-clamp-1 max-w-[200px]">{c.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCourse(c.id!);
                    }}
                    className="hover:text-red-500 font-bold ml-1"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>

            <Input
              placeholder="Optional admin note (e.g. Promotional package granted)"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="h-8 text-xs bg-white dark:bg-slate-950"
            />
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t flex items-center justify-between sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedCourseIds([]);
              setAdminNote("");
            }}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={selectedCourseIds.length === 0 || busy || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
          >
            {busy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                Enabling {selectedCourseIds.length} Course
                {selectedCourseIds.length > 1 ? "s" : ""}...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Enable{" "}
                {selectedCourseIds.length > 0
                  ? selectedCourseIds.length
                  : ""}{" "}
                Course{selectedCourseIds.length > 1 ? "s" : ""} for Client
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollUserInCourseDialog;
