"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Users,
  Clock,
  Globe,
  Award,
  CheckCircle2,
  PlayCircle,
  FileText,
  HelpCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Download,
  ShieldCheck,
  Smartphone,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MuxVideoPlayer } from "@/components/MuxVideoPlayer";
import Spinner from "@/components/Spinner";
import { useAuth } from "@/provider/AuthContext";
import {
  useGetCourseById,
  useCourseEnrollment,
  useCourseCheckout,
} from "@/hooks/educational-materials/course";
import { Chapter } from "@/schema/educational-materials/course";
import { stripHtml } from "@/lib/utils";

const CourseLandingPage = () => {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();
  const { user } = useAuth();

  const { course, isLoading } = useGetCourseById(courseId);
  const { isEnrolled, isLoading: isLoadingEnrollment } =
    useCourseEnrollment(courseId);
  const { createCheckout, isLoading: isCheckingOut } = useCourseCheckout();

  const [previewChapter, setPreviewChapter] = useState<Chapter | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    all: true,
  });

  const publishedChapters = useMemo(() => {
    return (
      course?.chapters
        ?.filter((c) => c.isPublished)
        .sort((a, b) => a.position - b.position) || []
    );
  }, [course?.chapters]);

  const previewableChapters = useMemo(() => {
    return publishedChapters.filter((c) => c.isFreePreview && c.videoUrl);
  }, [publishedChapters]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleEnrollOrCheckout = async () => {
    if (!user?.uid) {
      router.push(`/login?redirect=/client/courses/${courseId}`);
      return;
    }

    if (isEnrolled || course?.isFree) {
      router.push(`/client/my-learning/${courseId}`);
      return;
    }

    try {
      const { url } = await createCheckout({
        courseId,
        returnUrl: `${window.location.origin}/client/my-learning/${courseId}?purchased=true`,
      });
      if (url) {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Checkout launch error:", error);
    }
  };

  if (isLoading) {
    return <Spinner displayText="Loading course details..." />;
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-6">
        <h2 className="text-2xl font-bold text-gray-900">Course Not Found</h2>
        <p className="text-gray-500 mt-2">
          The requested course does not exist or has been removed.
        </p>
        <Link href="/client/my-learning" className="mt-4">
          <Button>Back to My Learning</Button>
        </Link>
      </div>
    );
  }

  const effectivePrice =
    course.discountPrice != null && course.discountPrice >= 0
      ? course.discountPrice
      : course.price;
  const hasDiscount =
    course.discountPrice != null && course.discountPrice < (course.price || 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 pb-20">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 uppercase tracking-wider">
              <span>{course.category}</span>
              <span>•</span>
              <span>{course.level || "All Levels"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {course.title}
            </h1>

            {course.subtitle && (
              <p className="text-lg text-slate-300 font-normal leading-relaxed">
                {course.subtitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm pt-2">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <span>{(course.averageRating || 5.0).toFixed(1)}</span>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="text-slate-400 font-normal">
                  ({course.totalRatingsCount || 0} ratings)
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{course.enrolledStudentsCount || 0} enrolled</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
              <span>
                Created by{" "}
                <span className="text-white font-medium">
                  {course.instructor?.name || "CEG United"}
                </span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {course.language || "English"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content & Sticky Purchase Sidebar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Course Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn card */}
            {course.learningObjectives &&
              course.learningObjectives.length > 0 && (
                <div className="border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    {`What you'll learn`}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {course.learningObjectives.map((obj, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-300">
                          {obj}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Course Content / Curriculum Breakdown */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Course Content
                </h2>
                <div className="text-xs text-gray-500 font-medium flex items-center gap-2">
                  <span>{publishedChapters.length} lectures</span>
                  <span>•</span>
                  <span>Full Lifetime Access</span>
                </div>
              </div>

              <div className="border rounded-xl bg-white dark:bg-slate-900 divide-y overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 font-semibold text-sm flex items-center justify-between">
                  <span>Curriculum Breakdown</span>
                  <span className="text-xs font-normal text-gray-500">
                    {previewableChapters.length > 0 &&
                      `${previewableChapters.length} free preview lecture(s)`}
                  </span>
                </div>

                <div className="divide-y">
                  {publishedChapters.map((chapter, index) => {
                    const isVideo = !chapter.type || chapter.type === "video";
                    const isArticle = chapter.type === "article";
                    const isQuiz = chapter.type === "quiz";

                    return (
                      <div
                        key={chapter.id || index}
                        className="p-3.5 sm:px-4 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isVideo && (
                            <PlayCircle className="w-4 h-4 text-blue-600 shrink-0" />
                          )}
                          {isArticle && (
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isQuiz && (
                            <HelpCircle className="w-4 h-4 text-purple-600 shrink-0" />
                          )}
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {index + 1}. {chapter.title}
                            </span>
                            {chapter.description && (
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {stripHtml(chapter.description)}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {chapter.isFreePreview &&
                          isVideo &&
                          chapter.videoUrl ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
                              onClick={() => setPreviewChapter(chapter)}
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> Preview
                            </Button>
                          ) : isEnrolled ? (
                            <span className="text-xs text-emerald-600 font-medium">
                              Unlocked
                            </span>
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Requirements & Target Audience */}
            {(course.requirements?.length || course.targetAudience?.length) && (
              <div className="space-y-6 pt-2">
                {course.requirements && course.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                      Requirements
                    </h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                      {course.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.targetAudience && course.targetAudience.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
                      Who this course is for:
                    </h3>
                    <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                      {course.targetAudience.map((aud, i) => (
                        <li key={i}>{aud}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Course Description */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Course Description
              </h3>
              {course.description && (
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: course.description,
                  }}
                />
              )}
            </div>

            {/* Instructor Profile Card */}
            <div className="border rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Your Instructor
              </h3>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center shrink-0">
                  {course.instructor?.name?.charAt(0) || "C"}
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base">
                    {course.instructor?.name || "CEG United Instructor"}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium">
                    {course.instructor?.title ||
                      "Senior Underwriting Specialist"}
                  </p>
                  {course.instructor?.bio && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 pt-2 leading-relaxed">
                      {course.instructor.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Purchase Card (Desktop & Mobile) */}
          <div className="lg:sticky lg:top-8 w-full">
            <div className="border rounded-2xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              {/* Media Thumbnail / Trailer Preview */}
              <div className="relative aspect-video w-full bg-slate-900 group">
                {course.imageUrl ? (
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                    <PlayCircle className="w-12 h-12" />
                  </div>
                )}
                {previewableChapters.length > 0 && (
                  <button
                    onClick={() => setPreviewChapter(previewableChapters[0])}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/50 transition-colors group-hover:scale-105"
                  >
                    <div className="w-14 h-14 rounded-full bg-white/90 text-blue-600 flex items-center justify-center shadow-lg">
                      <PlayCircle className="w-8 h-8 fill-blue-600 text-white" />
                    </div>
                  </button>
                )}
              </div>

              {/* Price & Checkout Section */}
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  {course.isFree ? (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-extrabold text-emerald-600">
                        Free
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                        $
                        {effectivePrice.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        USD
                      </span>
                      {hasDiscount && (
                        <>
                          <span className="text-base line-through text-gray-400">
                            $
                            {(course.price || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            SAVE{" "}
                            {Math.round(
                              (1 - course.discountPrice! / course.price) * 100,
                            )}
                            %
                          </span>
                        </>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    30-Day Money-Back Guarantee
                  </p>
                </div>

                <Button
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-base h-12 shadow-md gap-2"
                  onClick={handleEnrollOrCheckout}
                  disabled={isCheckingOut || isLoadingEnrollment}
                >
                  {isEnrolled ? (
                    <>
                      Go to Course <ArrowRight className="w-4 h-4" />
                    </>
                  ) : course.isFree ? (
                    <>
                      Enroll Now (Free) <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Buy Now ($
                      {effectivePrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      )
                    </>
                  )}
                </Button>

                {/* Features Checklist */}
                <div className="space-y-2.5 pt-2 border-t text-xs text-gray-600 dark:text-gray-400">
                  <span className="font-bold text-gray-900 dark:text-gray-100 block">
                    This course includes:
                  </span>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>
                      {publishedChapters.length} on-demand video & article
                      lessons
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Downloadable templates & credit resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Access on mobile, tablet, and desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gray-500 shrink-0" />
                    <span>Full lifetime access with future updates</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Preview Video Modal */}
      <Dialog
        open={!!previewChapter}
        onOpenChange={(open) => !open && setPreviewChapter(null)}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-slate-950 border-slate-800">
          <DialogHeader className="p-4 bg-slate-900 border-b border-slate-800 text-white">
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <PlayCircle className="w-4 h-4 text-blue-500" />
              Free Preview: {previewChapter?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {previewChapter?.muxData?.playbackId ? (
              <MuxVideoPlayer
                playbackId={previewChapter.muxData.playbackId}
                title={previewChapter.title}
              />
            ) : previewChapter?.videoUrl ? (
              <video
                src={previewChapter.videoUrl}
                controls
                autoPlay
                className="w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">
                No video preview available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseLandingPage;
