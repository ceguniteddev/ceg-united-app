"use client";

import React, { use } from "react";
import { useAuth } from "@/provider/AuthContext";
import {
  useGetCourseById,
  useCourseEnrollment,
  useEnrollUserInCourse,
  useCourseCheckout,
} from "@/hooks/educational-materials/course";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Star,
  Users,
  Award,
  Globe,
  BarChart,
  PlayCircle,
  FileText,
  HelpCircle,
  ExternalLink,
  ChevronLeft,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { MuxVideoPlayer } from "@/components/MuxVideoPlayer";

interface CourseDetailsPageProps {
  params: Promise<{ courseId: string }>;
}

export default function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { courseId } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const { course, isLoading: isLoadingCourse } = useGetCourseById(courseId);
  const { isEnrolled, isLoading: isLoadingEnrollment } =
    useCourseEnrollment(courseId);
  const { enrollUser, isEnrolling } = useEnrollUserInCourse();
  const { createCheckout, isLoading: isCheckingOut } = useCourseCheckout();

  if (isLoadingCourse || isLoadingEnrollment) {
    return <Spinner displayText="Loading course details..." />;
  }

  if (!course) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Course Not Found
        </h2>
        <p className="text-gray-500 max-w-md">
          The course you are looking for does not exist or may have been
          unpublished.
        </p>
        <Link href="/client/my-learning">
          <Button variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Learning Center
          </Button>
        </Link>
      </div>
    );
  }

  const price = course.price ?? 0;
  const discountPrice = course.discountPrice;
  const effectivePrice = discountPrice != null ? discountPrice : price;
  const sections = course.sections || [];
  const publishedChapters = (course.chapters || []).filter(
    (ch) => ch.isPublished,
  );

  const handleEnrollFree = async () => {
    if (!user?.uid || !course.id) return;
    await enrollUser({ userId: user.uid, courseId: course.id });
    router.push(`/client/my-learning/${course.id}`);
  };

  const handlePurchase = async () => {
    if (!user?.uid || !course.id) return;
    if (course.luminoCheckoutUrl) {
      window.open(course.luminoCheckoutUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const returnUrl = `${window.location.origin}/client/my-learning/${course.id}`;
    const res = await createCheckout({
      courseId: course.id,
      returnUrl,
    });
    if (res?.url) {
      window.location.href = res.url;
    }
  };

  return (
    <div className="min-h-screen pb-16 space-y-8">
      {/* Back button */}
      <div>
        <Link
          href="/client/my-learning"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back to Courses
        </Link>
      </div>

      {/* Hero Header Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                {course.category}
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs bg-slate-800 text-slate-300"
              >
                <BarChart className="w-3 h-3 mr-1" />
                {course.level || "All Levels"}
              </Badge>
              <Badge
                variant="secondary"
                className="text-xs bg-slate-800 text-slate-300"
              >
                <Globe className="w-3 h-3 mr-1" />
                {course.language || "English"}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
              {course.title}
            </h1>

            {course.subtitle && (
              <p className="text-sm sm:text-base text-slate-300">
                {course.subtitle}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-300 pt-2">
              <div className="flex items-center gap-1 text-amber-400 font-bold">
                <span>{(course.averageRating || 5.0).toFixed(1)}</span>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-slate-400 font-normal">
                  ({course.totalRatingsCount || 0} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <Users className="w-4 h-4" />
                <span>{course.enrolledStudentsCount || 0} enrolled</span>
              </div>
              {course.instructor?.name && (
                <div className="text-slate-400">
                  Created by{" "}
                  <span className="text-slate-200 font-medium">
                    {course.instructor.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Desktop/Tablet Card Media Preview */}
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
            {course.promoVideoPlaybackId ? (
              <MuxVideoPlayer
                playbackId={course.promoVideoPlaybackId}
                title={course.title}
              />
            ) : course.imageUrl ? (
              <Image
                src={course.imageUrl}
                alt={course.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                <BookOpen className="w-12 h-12 opacity-50" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Details, Objectives, Curriculum */}
        <div className="lg:col-span-2 space-y-8">
          {/* What you'll learn */}
          {course.learningObjectives &&
            course.learningObjectives.length > 0 && (
              <div className="border rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  What you'll learn
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {course.learningObjectives.map((obj, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {obj}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Course Description */}
          <div className="border rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              Description
            </h3>
            <div
              className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300 space-y-2"
              dangerouslySetInnerHTML={{ __html: course.description }}
            />
          </div>

          {/* Curriculum Accordion */}
          {sections.length > 0 && (
            <div className="border rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  Course Content
                </h3>
                <span className="text-xs text-gray-500">
                  {sections.length} sections • {publishedChapters.length}{" "}
                  lectures
                </span>
              </div>

              <Accordion type="multiple" className="w-full">
                {sections.map((section, idx) => {
                  const sectionChapters = (section.chapters || []).filter(
                    (c) => c.isPublished,
                  );
                  return (
                    <AccordionItem key={section.id || idx} value={`sec-${idx}`}>
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                        <div className="flex items-center gap-2 text-left">
                          <span>{section.title}</span>
                          <span className="text-xs text-gray-400 font-normal">
                            ({sectionChapters.length} lectures)
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 pt-1 pb-3">
                        {sectionChapters.map((ch, cIdx) => (
                          <div
                            key={ch.id || cIdx}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-xs text-gray-600 dark:text-gray-300"
                          >
                            <div className="flex items-center gap-2">
                              {ch.type === "article" ? (
                                <FileText className="w-3.5 h-3.5 text-blue-500" />
                              ) : ch.type === "quiz" ? (
                                <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                              ) : (
                                <PlayCircle className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                              <span>{ch.title}</span>
                            </div>
                            {ch.isFreePreview && (
                              <Badge
                                variant="outline"
                                className="text-[10px] text-blue-600 border-blue-200 dark:border-blue-800"
                              >
                                Free Preview
                              </Badge>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}

          {/* Requirements & Target Audience */}
          {course.requirements?.length || course.targetAudience?.length ? (
            <div className="border rounded-2xl p-6 bg-white dark:bg-slate-900 space-y-6">
              {course.requirements && course.requirements.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Requirements
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {course.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {course.targetAudience && course.targetAudience.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Who this course is for
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    {course.targetAudience.map((aud, i) => (
                      <li key={i}>{aud}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Right Column (1 Col): Pricing Card & CTA */}
        <div className="space-y-6">
          <div className="border rounded-3xl p-6 bg-white dark:bg-slate-900 shadow-lg sticky top-6 space-y-6">
            {/* Price Header */}
            <div>
              <span className="text-xs text-gray-400 font-medium block">
                Course Enrollment
              </span>
              <div className="mt-1 flex items-baseline gap-2">
                {course.isFree ? (
                  <span className="text-3xl font-extrabold text-emerald-600">
                    Free
                  </span>
                ) : (
                  <>
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                      $
                      {effectivePrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                    {discountPrice != null && discountPrice < price && (
                      <span className="text-base line-through text-gray-400">
                        $
                        {price.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isEnrolled ? (
                <Link
                  href={`/client/my-learning/${course.id}`}
                  className="w-full block"
                >
                  <Button className="w-full h-12 text-sm font-semibold gap-2">
                    Continue Learning
                  </Button>
                </Link>
              ) : course.isFree ? (
                <Button
                  onClick={handleEnrollFree}
                  disabled={isEnrolling}
                  className="w-full h-12 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  Enroll Now (Free)
                </Button>
              ) : (
                <Button
                  onClick={handlePurchase}
                  disabled={isCheckingOut}
                  className="w-full h-12 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md"
                >
                  {isCheckingOut ? (
                    "Processing Checkout..."
                  ) : (
                    <>
                      Buy Now ( $
                      {effectivePrice.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                      )
                      {course.luminoCheckoutUrl && (
                        <ExternalLink className="w-4 h-4" />
                      )}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Guarantees and Feature List */}
            <div className="pt-4 border-t space-y-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Full Lifetime Access</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Certificate of Completion</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Self-paced on-demand learning</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
