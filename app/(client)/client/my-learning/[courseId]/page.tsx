"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/provider/AuthContext";
import {
  useGetUserCoursesWithProgress,
  useCourseReviews,
  useAddCourseReview,
  useCourseNotes,
  useSaveCourseNote,
  useDeleteCourseNote,
} from "@/hooks/educational-materials/course";
import { useChapterProgress } from "@/hooks/educational-materials/chapter";
import Spinner from "@/components/Spinner";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  HelpCircle,
  Award,
  Download,
  BookOpen,
  MessageSquare,
  StickyNote,
  Star,
  Trophy,
  Menu,
  X,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { MuxVideoPlayer } from "@/components/MuxVideoPlayer";
import { toast } from "sonner";

const CourseDetailPage = () => {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { user } = useAuth();

  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(
    user?.uid || "",
  );
  const { updateProgress } = useChapterProgress();

  // Reviews hooks
  const { reviews } = useCourseReviews(courseId);
  const { addReview, isSubmitting: isSubmittingReview } =
    useAddCourseReview(courseId);

  // Notes hooks
  const { notes } = useCourseNotes(courseId);
  const { saveNote, isSaving: isSavingNote } = useSaveCourseNote(courseId);
  const { deleteNote } = useDeleteCourseNote(courseId);

  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null,
  );
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showCertificate, setShowCertificate] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  const course = coursesWithProgress?.find((c) => c.id === courseId);

  // Published chapters sorted by position
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
      const firstIncomplete = publishedChapters.find((chapter) => {
        const progress = course?.userProgress?.find(
          (p) => p.chapterId === chapter.id,
        );
        return !progress?.isCompleted;
      });

      const chapterId = firstIncomplete?.id ?? publishedChapters[0]?.id ?? null;
      setSelectedChapterId(chapterId);
    }
  }, [publishedChapters, selectedChapterId, course?.userProgress]);

  // Reset quiz state on chapter change
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(null);
  }, [selectedChapterId]);

  const selectedChapter = publishedChapters.find(
    (c) => c.id === selectedChapterId,
  );

  const currentChapterProgress = course?.userProgress?.find(
    (p) => p.chapterId === selectedChapter?.id,
  );

  const handleMarkComplete = async () => {
    if (!selectedChapter || !user?.uid) return;

    const newCompletionStatus = !currentChapterProgress?.isCompleted;

    await updateProgress({
      userId: user.uid,
      chapterId: selectedChapter.id!,
      courseId: courseId,
      isCompleted: newCompletionStatus,
    });
  };

  const handleVideoComplete = async () => {
    if (!selectedChapter || !user?.uid) return;

    if (!currentChapterProgress?.isCompleted) {
      await updateProgress({
        userId: user.uid,
        chapterId: selectedChapter.id!,
        courseId: courseId,
        isCompleted: true,
      });
    }

    // Auto-advance to next chapter if available
    handleNextChapter();
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

  const handleSaveNote = async () => {
    if (!newNoteContent.trim() || !selectedChapter || !user?.uid) return;
    try {
      await saveNote({
        chapterId: selectedChapter.id!,
        timestampSeconds: 0,
        content: newNoteContent.trim(),
      });
      setNewNoteContent("");
    } catch {
      toast.error("Failed to save note");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast.error("Please enter a review comment");
      return;
    }
    try {
      await addReview({
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewComment("");
    } catch {
      toast.error("Failed to submit review");
    }
  };

  // Quiz submission & grading
  const handleQuizSubmit = async () => {
    if (!selectedChapter?.quiz?.questions?.length) return;

    const questions = selectedChapter.quiz.questions;
    let correctCount = 0;
    questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctAnswerIndex) {
        correctCount++;
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    setQuizScore(scorePct);
    setQuizSubmitted(true);

    const passingPct = selectedChapter.quiz.passingScorePercentage ?? 70;
    if (scorePct >= passingPct && user?.uid) {
      toast.success(`Passed quiz with ${scorePct}%!`);
      if (!currentChapterProgress?.isCompleted) {
        await updateProgress({
          userId: user.uid,
          chapterId: selectedChapter.id!,
          courseId: courseId,
          isCompleted: true,
        });
      }
    } else {
      toast.error(`Score: ${scorePct}%. Passing is ${passingPct}%. Try again!`);
    }
  };

  if (isLoading) {
    return <Spinner displayText="Loading learning player..." />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Course Not Enrolled
        </h2>
        <p className="text-gray-500 mt-2">
          You are not enrolled in this course or it doesn't exist.
        </p>
        <Link href={`/client/courses/${courseId}`} className="mt-4">
          <Button>View Course Catalog Page</Button>
        </Link>
      </div>
    );
  }

  const progressPct = course.enrollment?.progressPercentage ?? 0;
  const completedCount = course.completedChapters ?? 0;
  const totalCount = publishedChapters.length;

  const isVideo = !selectedChapter?.type || selectedChapter.type === "video";
  const isArticle = selectedChapter?.type === "article";
  const isQuiz = selectedChapter?.type === "quiz";

  const currentIndex = publishedChapters.findIndex(
    (c) => c.id === selectedChapterId,
  );
  const hasNext = currentIndex < publishedChapters.length - 1;
  const hasPrevious = currentIndex > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar / Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link
            href="/client/my-learning"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="border-l border-slate-800 pl-3">
            <h1 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 max-w-[220px] sm:max-w-md">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <div className="w-24 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  progressPct === 100 ? "bg-emerald-500" : "bg-blue-500"
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="font-semibold text-white">{progressPct}%</span>
          </div>

          {progressPct === 100 && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowCertificate(true)}
              className="text-xs h-8 border-amber-500 text-amber-400 hover:bg-amber-950/40 gap-1.5"
            >
              <Award className="w-3.5 h-3.5" />
              Certificate
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-300 hover:text-white"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left/Main Column: Player + Tabs */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {/* Media Player Viewport */}
          <div className="bg-black w-full flex items-center justify-center relative min-h-[300px] sm:min-h-[460px] lg:min-h-[520px]">
            {isVideo && (
              <div className="w-full h-full max-w-5xl aspect-video mx-auto">
                {selectedChapter?.muxData?.playbackId ? (
                  <MuxVideoPlayer
                    playbackId={selectedChapter.muxData.playbackId}
                    onComplete={handleVideoComplete}
                    title={selectedChapter.title}
                  />
                ) : selectedChapter?.videoUrl ? (
                  <video
                    src={selectedChapter.videoUrl}
                    controls
                    onEnded={handleVideoComplete}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <PlayCircle className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm">
                      No video content for this lecture.
                    </p>
                  </div>
                )}
              </div>
            )}

            {isArticle && (
              <div className="w-full max-w-4xl mx-auto p-6 sm:p-10 bg-slate-900 rounded-xl my-8 border border-slate-800 text-slate-200">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <FileText className="w-4 h-4" /> Reading Lesson
                </div>
                <h2 className="text-2xl font-bold text-white mb-6">
                  {selectedChapter?.title}
                </h2>
                <div
                  className="prose dark:prose-invert max-w-none text-slate-300 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedChapter?.articleContentHtml ||
                      selectedChapter?.description ||
                      "<p>No reading content provided.</p>",
                  }}
                />
              </div>
            )}

            {isQuiz && (
              <div className="w-full max-w-3xl mx-auto p-6 sm:p-10 bg-slate-900 rounded-xl my-8 border border-slate-800 text-slate-200 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4" /> Knowledge Check
                  </div>
                  <span className="text-xs text-slate-400">
                    Passing Grade:{" "}
                    {selectedChapter?.quiz?.passingScorePercentage || 70}%
                  </span>
                </div>

                <h2 className="text-xl font-bold text-white">
                  {selectedChapter?.title}
                </h2>

                <div className="space-y-6">
                  {selectedChapter?.quiz?.questions?.map((q, qIndex) => (
                    <div
                      key={q.id || qIndex}
                      className="p-5 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3"
                    >
                      <p className="font-semibold text-sm text-slate-100">
                        {qIndex + 1}. {q.question}
                      </p>

                      <div className="space-y-2">
                        {q.options.map((opt, optIndex) => {
                          const isSelected = quizAnswers[q.id] === optIndex;
                          const isCorrect = optIndex === q.correctAnswerIndex;
                          const showFeedback = quizSubmitted;

                          let btnClasses =
                            "w-full text-left p-3 rounded-lg text-xs font-medium border transition-all flex items-center justify-between ";

                          if (showFeedback) {
                            if (isCorrect) {
                              btnClasses +=
                                "bg-emerald-950/60 border-emerald-500 text-emerald-300";
                            } else if (isSelected && !isCorrect) {
                              btnClasses +=
                                "bg-red-950/60 border-red-500 text-red-300";
                            } else {
                              btnClasses +=
                                "bg-slate-900 border-slate-800 text-slate-400";
                            }
                          } else {
                            if (isSelected) {
                              btnClasses +=
                                "bg-blue-950 border-blue-500 text-blue-200";
                            } else {
                              btnClasses +=
                                "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800";
                            }
                          }

                          return (
                            <button
                              key={optIndex}
                              disabled={quizSubmitted}
                              onClick={() =>
                                setQuizAnswers((prev) => ({
                                  ...prev,
                                  [q.id]: optIndex,
                                }))
                              }
                              className={btnClasses}
                            >
                              <span>{opt}</span>
                              {showFeedback && isCorrect && (
                                <Check className="w-4 h-4 text-emerald-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <p className="text-xs text-slate-400 italic pt-1">
                          💡 {q.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Quiz Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  {quizSubmitted ? (
                    <Button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                        setQuizScore(null);
                      }}
                      variant="outline"
                      className="gap-1.5 text-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                    </Button>
                  ) : (
                    <Button
                      onClick={handleQuizSubmit}
                      disabled={
                        Object.keys(quizAnswers).length <
                        (selectedChapter?.quiz?.questions?.length || 0)
                      }
                      className="bg-purple-600 hover:bg-purple-700 text-xs font-semibold"
                    >
                      Submit Quiz Answers
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls Bar below Player */}
          <div className="h-12 bg-slate-900 border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between">
            <Button
              size="sm"
              variant="ghost"
              disabled={!hasPrevious}
              onClick={handlePreviousChapter}
              className="text-xs text-slate-400 hover:text-white gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </Button>

            <Button
              size="sm"
              variant={
                currentChapterProgress?.isCompleted ? "outline" : "default"
              }
              onClick={handleMarkComplete}
              className={cn(
                "text-xs gap-1.5 font-medium",
                currentChapterProgress?.isCompleted
                  ? "border-emerald-500 text-emerald-400 hover:bg-emerald-950/30"
                  : "bg-blue-600 hover:bg-blue-700 text-white",
              )}
            >
              {currentChapterProgress?.isCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Completed
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  Mark as Complete
                </>
              )}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              disabled={!hasNext}
              onClick={handleNextChapter}
              className="text-xs text-slate-400 hover:text-white gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Bottom Tabs Workspace */}
          <div className="p-4 sm:p-8 max-w-5xl w-full mx-auto space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-lg">
                <TabsTrigger
                  value="overview"
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <BookOpen className="w-3.5 h-3.5" /> Overview
                </TabsTrigger>
                <TabsTrigger
                  value="notes"
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <StickyNote className="w-3.5 h-3.5" /> Notes ({notes.length})
                </TabsTrigger>
                <TabsTrigger
                  value="resources"
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Resources (
                  {(course.attachments?.length || 0) +
                    (selectedChapter?.attachments?.length || 0)}
                  )
                </TabsTrigger>
                <TabsTrigger
                  value="reviews"
                  className="flex items-center gap-1.5 text-xs sm:text-sm"
                >
                  <Star className="w-3.5 h-3.5" /> Reviews ({reviews.length})
                </TabsTrigger>
              </TabsList>

              {/* TAB: Overview */}
              <TabsContent value="overview" className="mt-6 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {selectedChapter?.title}
                  </h2>
                  <div
                    className="text-sm text-slate-400 mt-2 leading-relaxed prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html:
                        selectedChapter?.description ||
                        course.description ||
                        "<p>No additional lecture notes.</p>",
                    }}
                  />
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {course.instructor?.name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white text-sm">
                      {course.instructor?.name || "CEG United"}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {course.instructor?.title || "Senior Instructor"}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* TAB: Personal Notes */}
              <TabsContent value="notes" className="mt-6 space-y-6">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Add Note for {selectedChapter?.title}
                  </label>
                  <Textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Type your notes or insights here..."
                    rows={3}
                    className="bg-slate-950 border-slate-800 text-slate-200 text-sm"
                  />
                  <Button
                    onClick={handleSaveNote}
                    disabled={isSavingNote || !newNoteContent.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    Save Note
                  </Button>
                </div>

                <div className="space-y-3">
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex items-start justify-between gap-4"
                      >
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">
                          {note.content}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNote(note.id!)}
                          className="text-xs text-slate-500 hover:text-red-400"
                        >
                          Delete
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No personal notes yet. Use notes to remember key concepts.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Resources & Attachments */}
              <TabsContent value="resources" className="mt-6 space-y-4">
                <div className="space-y-2">
                  {course.attachments && course.attachments.length > 0 ? (
                    course.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-4 h-4 text-blue-400" />
                          <span className="text-xs font-medium text-slate-200">
                            {att.name}
                          </span>
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 gap-1"
                          >
                            <Download className="w-3 h-3" /> Download
                          </Button>
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No downloadable resources attached to this course.
                    </p>
                  )}
                </div>
              </TabsContent>

              {/* TAB: Reviews */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                {/* Leave a Review Box */}
                <form
                  onSubmit={handleReviewSubmit}
                  className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4"
                >
                  <h3 className="text-sm font-bold text-white">
                    Leave Course Feedback
                  </h3>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-600"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs text-slate-400 ml-2">
                      {reviewRating} out of 5 stars
                    </span>
                  </div>
                  <Textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Write your honest review and feedback..."
                    rows={3}
                    className="bg-slate-950 border-slate-800 text-slate-200 text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmittingReview || !reviewComment.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-xs"
                  >
                    Submit Review
                  </Button>
                </form>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">
                            {rev.userName}
                          </span>
                          <div className="flex text-amber-400">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star
                                key={i}
                                className="w-3.5 h-3.5 fill-amber-400 text-amber-400"
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No reviews yet. Be the first to share your experience!
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column: Course Curriculum Drawer (Udemy-Style) */}
        {sidebarOpen && (
          <aside className="w-80 lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Course Content</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {completedCount} / {totalCount} completed ({progressPct}%)
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
              {publishedChapters.map((chapter, index) => {
                const isSelected = chapter.id === selectedChapterId;
                const isCompleted = course.userProgress?.some(
                  (p) => p.chapterId === chapter.id && p.isCompleted,
                );
                const isVideoType = !chapter.type || chapter.type === "video";
                const isArticleType = chapter.type === "article";
                const isQuizType = chapter.type === "quiz";

                return (
                  <button
                    key={chapter.id || index}
                    onClick={() => setSelectedChapterId(chapter.id!)}
                    className={cn(
                      "w-full p-3.5 text-left transition-colors flex items-start gap-3",
                      isSelected
                        ? "bg-slate-800/90 text-white font-medium"
                        : "text-slate-300 hover:bg-slate-850 hover:text-white",
                    )}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : isSelected ? (
                        <PlayCircle className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-600" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2">
                        {index + 1}. {chapter.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                        {isVideoType && <span>Video Lesson</span>}
                        {isArticleType && <span>Reading Lesson</span>}
                        {isQuizType && <span>Quiz</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* Certificate Modal */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-2xl bg-slate-900 border-amber-500/50 text-white text-center p-8">
          <DialogHeader>
            <DialogTitle className="text-2xl font-extrabold text-amber-400 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" /> Certificate of
              Completion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-6 border-y border-slate-800 my-4">
            <p className="text-xs text-slate-400 uppercase tracking-widest">
              This is to certify that
            </p>
            <h3 className="text-2xl font-bold text-white">
              {user?.displayName || user?.email || "Student"}
            </h3>
            <p className="text-xs text-slate-400">
              has successfully completed all requirements for
            </p>
            <h4 className="text-lg font-bold text-blue-400">{course.title}</h4>
            <p className="text-xs text-slate-500">
              Verified by CEG United Educational Standards
            </p>
          </div>
          <Button
            onClick={() => setShowCertificate(false)}
            className="bg-amber-600 hover:bg-amber-700 text-black font-bold mx-auto"
          >
            Close Certificate
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseDetailPage;
