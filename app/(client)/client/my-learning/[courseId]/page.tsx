"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserCoursesWithProgress } from "@/hooks/educational-materials/course";
import { useChapterProgress } from "@/hooks/educational-materials/chapter";
import Spinner from "@/components/Spinner";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  GraduationCap,
  Download,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MuxVideoPlayer } from "@/components/MuxVideoPlayer";
import dynamic from "next/dynamic";
const EditorQuill = dynamic(() => import("@/components/editor/EditorQuill"), {
  ssr: false,
});
const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params.courseId as string;
  const { user } = useAuth();
  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(
    user?.uid || "",
  );
  const { updateProgress } = useChapterProgress();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null,
  );

  const course = coursesWithProgress?.find((c) => c.id === courseId);

  // Get published chapters sorted by position
  const publishedChapters = useMemo(() => {
    return (
      course?.chapters
        ?.filter((c) => c.isPublished)
        .sort((a, b) => a.position - b.position) || []
    );
  }, [course?.chapters]);

  // Auto-select first incomplete chapter or first chapter
  useEffect(() => {
    if (publishedChapters.length > 0 && !selectedChapterId) {
      const firstIncompleteChapter = publishedChapters.find((chapter) => {
        const progress = course?.userProgress?.find(
          (p) => p.chapterId === chapter.id,
        );
        return !progress?.isCompleted;
      });

      const chapterId =
        firstIncompleteChapter?.id ?? publishedChapters[0]?.id ?? null;
      setSelectedChapterId(chapterId);
    }
  }, [publishedChapters, selectedChapterId, course?.userProgress]);

  const selectedChapter = publishedChapters.find(
    (c) => c.id === selectedChapterId,
  );

  const handleMarkComplete = async () => {
    if (!selectedChapter || !user?.uid) return;

    const currentProgress = course?.userProgress?.find(
      (p) => p.chapterId === selectedChapter.id,
    );
    const newCompletionStatus = !currentProgress?.isCompleted;

    await updateProgress({
      userId: user.uid,
      chapterId: selectedChapter.id!,
      courseId: courseId,
      isCompleted: newCompletionStatus,
    });
  };

  const handleVideoComplete = async () => {
    if (!selectedChapter || !user?.uid) return;

    const currentProgress = course?.userProgress?.find(
      (p) => p.chapterId === selectedChapter.id,
    );

    // Only mark as complete if not already completed
    if (!currentProgress?.isCompleted) {
      await updateProgress({
        userId: user.uid,
        chapterId: selectedChapter.id!,
        courseId: courseId,
        isCompleted: true,
      });
    }
  };

  const handleNextChapter = () => {
    if (!selectedChapter) return;

    const currentIndex = publishedChapters.findIndex(
      (c) => c.id === selectedChapter.id,
    );
    if (currentIndex < publishedChapters.length - 1) {
      const nextChapterId = publishedChapters[currentIndex + 1]?.id;
      if (nextChapterId) {
        setSelectedChapterId(nextChapterId);
      }
    }
  };

  const handlePreviousChapter = () => {
    if (!selectedChapter) return;

    const currentIndex = publishedChapters.findIndex(
      (c) => c.id === selectedChapter.id,
    );
    if (currentIndex > 0) {
      const prevChapterId = publishedChapters[currentIndex - 1]?.id;
      if (prevChapterId) {
        setSelectedChapterId(prevChapterId);
      }
    }
  };

  if (isLoading) {
    return <Spinner displayText="Loading course..." />;
  }

  if (!course) {
    return (
      <div className="transactions">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-700 mb-1">
            Course Not Found
          </p>
          <p className="text-xs text-gray-400 mb-6">
            You don&apos;t have access to this course or it doesn&apos;t exist.
          </p>
          <Link href="/client/my-learning">
            <Button size="sm">
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              Back to My Learning
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const progressPercentage = course.enrollment?.progressPercentage || 0;
  const completedChapters = course.completedChapters || 0;
  const isChapterCompleted = course?.userProgress?.find(
    (p) => p.chapterId === selectedChapter?.id,
  )?.isCompleted;

  const currentChapterIndex = publishedChapters.findIndex(
    (c) => c.id === selectedChapterId,
  );

  // Course progress ring
  const ringSize = 64;
  const strokeWidth = 5;
  const ringRadius = (ringSize - strokeWidth) / 2;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (progressPercentage / 100) * ringCircumference;

  return (
    <div className="transactions">
      {/* Back Link */}
      <Link
        href="/client/my-learning"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to My Learning
      </Link>

      {/* Course Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        {/* Gradient Banner */}
        <div className="relative h-32 sm:h-40 bg-gradient-to-r from-blue-500 to-blue-700 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-8 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
          {course.category && (
            <div className="absolute top-3 left-4">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
                {course.category}
              </span>
            </div>
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Course Info */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-sm text-gray-500 mt-1">
                  {course.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <BookOpen className="w-3.5 h-3.5" />
                  {publishedChapters.length}{" "}
                  {publishedChapters.length === 1 ? "chapter" : "chapters"}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {completedChapters}/{publishedChapters.length} completed
                </span>
              </div>
            </div>

            {/* Progress Ring */}
            <div className="flex items-center gap-3 sm:flex-col sm:items-center flex-shrink-0">
              <div className="relative">
                <svg width={ringSize} height={ringSize} className="-rotate-90">
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth={strokeWidth}
                  />
                  <circle
                    cx={ringSize / 2}
                    cy={ringSize / 2}
                    r={ringRadius}
                    fill="none"
                    stroke={progressPercentage === 100 ? "#10b981" : "#3b82f6"}
                    strokeWidth={strokeWidth}
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-base font-bold text-gray-900 leading-none">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
              <div className="sm:-mt-2 flex flex-col items-center">
                <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wide">
                  {progressPercentage === 100 ? "Complete" : "Progress"}
                </span>
              </div>
            </div>
          </div>

          {/* Full progress bar */}
          <div className="mt-4 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                progressPercentage === 100 ? "bg-emerald-500" : "bg-blue-500"
              }`}
              style={{
                width: `${Math.max(progressPercentage, progressPercentage > 0 ? 2 : 0)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Two-column layout: chapter list + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Chapter List — horizontal scroll on mobile, sidebar on desktop */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
              Chapters
            </h3>
            {/* Mobile: horizontal scroll; Desktop: vertical list */}
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0">
              {publishedChapters.map((chapter, index) => {
                const isCompleted = course?.userProgress?.find(
                  (p) => p.chapterId === chapter.id,
                )?.isCompleted;
                const isActive = chapter.id === selectedChapterId;

                return (
                  <button
                    key={chapter.id}
                    onClick={() => {
                      if (chapter.id) setSelectedChapterId(chapter.id);
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all w-full flex-shrink-0 lg:flex-shrink min-h-[52px]",
                      isActive
                        ? "bg-blue-50 border border-blue-100"
                        : "hover:bg-gray-50 border border-transparent",
                    )}
                  >
                    {/* Status icon */}
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : isActive ? (
                      <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug line-clamp-2",
                          isActive ? "text-blue-700" : "text-gray-700",
                        )}
                      >
                        {chapter.title}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Chapter {index + 1}
                      </p>
                    </div>
                    {isActive && (
                      <ChevronRight className="w-4 h-4 text-blue-400 flex-shrink-0 hidden lg:block" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Course Resources */}
          {course.attachments && course.attachments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Resources
              </h3>
              <div className="space-y-2">
                {course.attachments.map((attachment) => {
                  const ext =
                    attachment.name?.split(".").pop()?.toLowerCase() || "";
                  const fileStyle =
                    ext === "pdf"
                      ? { bg: "bg-red-50", color: "text-red-600" }
                      : ext === "xlsx" || ext === "xls"
                        ? { bg: "bg-emerald-50", color: "text-emerald-600" }
                        : { bg: "bg-blue-50", color: "text-blue-600" };

                  return (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors group"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${fileStyle.bg} flex items-center justify-center flex-shrink-0`}
                      >
                        <FileText
                          className={`w-4.5 h-4.5 ${fileStyle.color}`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {attachment.name}
                        </p>
                        {ext && (
                          <p className="text-[10px] text-gray-400 uppercase mt-0.5">
                            {ext}
                          </p>
                        )}
                      </div>
                      <Download className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors flex-shrink-0" />
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Chapter Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {selectedChapter ? (
            <div>
              {/* Video Player */}
              {selectedChapter.videoUrl &&
              selectedChapter.muxData?.playbackId ? (
                <MuxVideoPlayer
                  playbackId={selectedChapter.muxData.playbackId}
                  title={selectedChapter.title}
                  onComplete={handleVideoComplete}
                />
              ) : (
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
                  <div className="absolute bottom-0 left-8 w-24 h-24 bg-white/10 rounded-full translate-y-1/2" />
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <PlayCircle className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-sm text-white/80">
                      No video for this chapter
                    </p>
                  </div>
                </div>
              )}

              {/* Chapter Info */}
              <div className="p-4 sm:p-6">
                {/* Chapter header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Chapter {currentChapterIndex + 1} of{" "}
                        {publishedChapters.length}
                      </span>
                      {isChapterCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                      {selectedChapter.title}
                    </h2>
                  </div>
                </div>

                {/* Chapter description */}
                {selectedChapter.description && (
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Lesson Content
                      </h4>
                    </div>
                    <EditorQuill
                      value={selectedChapter.description}
                      readOnly
                      placeholder=""
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4 border-t border-gray-100">
                  {/* Mark complete */}
                  <button
                    onClick={handleMarkComplete}
                    className={cn(
                      "flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium rounded-xl transition-all active:scale-[0.98] shadow-sm min-h-[44px]",
                      isChapterCompleted
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-blue-600 hover:bg-blue-700 text-white",
                    )}
                  >
                    {isChapterCompleted ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Incomplete
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4" />
                        Mark as Complete
                      </>
                    )}
                  </button>

                  {/* Navigation */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePreviousChapter}
                      disabled={currentChapterIndex === 0}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium rounded-xl transition-all border min-h-[44px]",
                        currentChapterIndex > 0
                          ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
                          : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed",
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Prev
                    </button>
                    <button
                      onClick={handleNextChapter}
                      disabled={
                        currentChapterIndex === publishedChapters.length - 1
                      }
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium rounded-xl transition-all border min-h-[44px]",
                        currentChapterIndex < publishedChapters.length - 1
                          ? "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
                          : "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed",
                      )}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Select a chapter to start learning
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
