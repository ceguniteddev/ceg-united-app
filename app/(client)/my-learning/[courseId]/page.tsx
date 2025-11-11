"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserCoursesWithProgress } from "@/hooks/educational-materials/course";
import { useChapterProgress } from "@/hooks/educational-materials/chapter";
import Spinner from "@/components/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Book, CheckCircle2, Lock, PlayCircle, ChevronLeft, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import HeaderBox from "@/components/HeaderBox";
import { MuxVideoPlayer } from "@/components/MuxVideoPlayer";
import dynamic from "next/dynamic";
const EditorQuill = dynamic(() => import("@/components/editor/EditorQuill"), {
  ssr: false,
});
const CourseDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { user } = useAuth();
  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(user?.uid || "");
  const { updateProgress } = useChapterProgress();

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);

  const course = coursesWithProgress?.find((c) => c.id === courseId);

  // Get published chapters sorted by position
  const publishedChapters = useMemo(() => {
    return (
      course?.chapters?.filter((c) => c.isPublished).sort((a, b) => a.position - b.position) || []
    );
  }, [course?.chapters]);

  // Auto-select first incomplete chapter or first chapter
  useEffect(() => {
    if (publishedChapters.length > 0 && !selectedChapterId) {
      const firstIncompleteChapter = publishedChapters.find((chapter) => {
        const progress = course?.userProgress?.find((p) => p.chapterId === chapter.id);
        return !progress?.isCompleted;
      });

      const chapterId = firstIncompleteChapter?.id ?? publishedChapters[0]?.id ?? null;
      setSelectedChapterId(chapterId);
    }
  }, [publishedChapters, selectedChapterId, course?.userProgress]);

  const selectedChapter = publishedChapters.find((c) => c.id === selectedChapterId);

  const handleMarkComplete = async () => {
    if (!selectedChapter || !user?.uid) return;

    const currentProgress = course?.userProgress?.find((p) => p.chapterId === selectedChapter.id);
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

    const currentProgress = course?.userProgress?.find((p) => p.chapterId === selectedChapter.id);

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

    const currentIndex = publishedChapters.findIndex((c) => c.id === selectedChapter.id);
    if (currentIndex < publishedChapters.length - 1) {
      const nextChapterId = publishedChapters[currentIndex + 1]?.id;
      if (nextChapterId) {
        setSelectedChapterId(nextChapterId);
      }
    }
  };

  const handlePreviousChapter = () => {
    if (!selectedChapter) return;

    const currentIndex = publishedChapters.findIndex((c) => c.id === selectedChapter.id);
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
        <HeaderBox title="Course Not Found" subtext="This course is not available" />
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">
            You don&apos;t have access to this course or it doesn&apos;t exist.
          </p>
          <Link href="/my-learning">
            <Button>
              <ChevronLeft className="w-4 h-4 mr-2" />
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
    (p) => p.chapterId === selectedChapter?.id
  )?.isCompleted;

  const currentChapterIndex = publishedChapters.findIndex((c) => c.id === selectedChapterId);

  return (
    <div className="transactions">
      {/* Header */}
      <div className="mb-6">
        <Link href="/my-learning">
          <Button variant="ghost" className="mb-4">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to My Learning
          </Button>
        </Link>
        <HeaderBox title={course.title} subtext={course.description || ""} />
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Course Progress</span>
              <span className="font-bold">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {completedChapters} of {publishedChapters.length} chapters completed
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Video Player */}
        <div className="lg:col-span-2">
          {selectedChapter ? (
            <Card>
              <CardContent className="p-0">
                {/* Video Player */}
                {selectedChapter.videoUrl && selectedChapter.muxData?.playbackId ? (
                  <MuxVideoPlayer
                    playbackId={selectedChapter.muxData.playbackId}
                    title={selectedChapter.title}
                    onComplete={handleVideoComplete}
                  />
                ) : (
                  <div className="aspect-video bg-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <PlayCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <p className="text-muted-foreground">No video available for this chapter</p>
                    </div>
                  </div>
                )}

                {/* Chapter Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{selectedChapter.title}</h2>
                      {selectedChapter.description && (
                        <EditorQuill value={selectedChapter.description} readOnly placeholder="" />
                      )}
                    </div>
                    {isChapterCompleted && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Completed
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t">
                    <Button
                      onClick={handleMarkComplete}
                      variant={isChapterCompleted ? "outline" : "default"}
                      className="flex-1"
                    >
                      {isChapterCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Incomplete
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Complete
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Button
                      onClick={handlePreviousChapter}
                      variant="outline"
                      disabled={currentChapterIndex === 0}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Chapter {currentChapterIndex + 1} of {publishedChapters.length}
                    </span>
                    <Button
                      onClick={handleNextChapter}
                      disabled={currentChapterIndex === publishedChapters.length - 1}
                    >
                      Next
                      <ChevronLeft className="w-4 h-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Book className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-muted-foreground">Select a chapter to start learning</p>
              </CardContent>
            </Card>
          )}

          {/* Course Attachments */}
          {course.attachments && course.attachments.length > 0 && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Course Resources
                </h3>
                <div className="space-y-2">
                  {course.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 rounded-md border hover:bg-accent transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{attachment.name}</span>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Chapter List */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Course Content</h3>
                <p className="text-sm text-muted-foreground">{publishedChapters.length} chapters</p>
              </div>
              <div className="max-h-[600px] overflow-y-auto">
                {publishedChapters.map((chapter, index) => {
                  const isCompleted = course?.userProgress?.find(
                    (p) => p.chapterId === chapter.id
                  )?.isCompleted;
                  const isActive = chapter.id === selectedChapterId;

                  return (
                    <button
                      key={chapter.id}
                      onClick={() => {
                        if (chapter.id) {
                          setSelectedChapterId(chapter.id);
                        }
                      }}
                      className={cn(
                        "w-full p-4 text-left border-b hover:bg-accent transition-colors",
                        isActive && "bg-accent"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : chapter.videoUrl ? (
                            <PlayCircle className="w-5 h-5 text-blue-600" />
                          ) : (
                            <Lock className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{chapter.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">Chapter {index + 1}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
