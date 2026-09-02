"use client";

import React, { useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { useMembership } from "@/hooks/membership";
import { hasPaidMembershipAccess } from "@/lib/membership-entitlement";
import {
  useGetUserCoursesWithProgress,
  useGetCourses,
  useEnrollUserInCourse,
  useCourseCheckout,
} from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";
import { PricingPlans } from "@/components/pricing-plans/PricingPlans";
import { MembershipCheckoutView } from "@/components/pricing-plans/MembershipCheckoutView";
import { createMembershipCheckoutConfig } from "@/service/dodo";
import { toast } from "sonner";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Trophy,
  ArrowRight,
  Search,
  Star,
  ShoppingBag,
  ExternalLink,
  ListFilter,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HeaderBox from "@/components/HeaderBox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { getCoursePricing } from "@/lib/course-pricing";

ChartJS.register(ArcElement, Tooltip, Legend);

const COURSE_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-purple-700",
  "from-emerald-500 to-teal-700",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-700",
  "from-cyan-500 to-sky-700",
];

type FilterStatus = "all" | "in-progress" | "not-started" | "completed";

const MyLearningPage = () => {
  const { user, userData } = useAuth();
  const router = useRouter();
  const { data: membership, isLoading: isLoadingMembership } = useMembership(
    userData?.id || user?.uid,
  );
  const hasMembership = hasPaidMembershipAccess(membership ?? null);

  const [membershipCheckout, setMembershipCheckout] = useState<{
    id: string;
    url: string;
    amount: number;
  } | null>(null);
  const [isStartingMembershipCheckout, setIsStartingMembershipCheckout] =
    useState(false);

  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(
    hasMembership ? user?.uid || "" : "",
  );
  const { courses: allCourses, isLoading: isLoadingAll } = useGetCourses();
  const { enrollUser, isEnrolling } = useEnrollUserInCourse();
  const { createCheckout } = useCourseCheckout();

  const [checkingOutCourseId, setCheckingOutCourseId] = useState<string | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState("my-courses");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const startMembershipCheckout = async (_planId: string, amount: number) => {
    if (!userData?.id) return;
    setIsStartingMembershipCheckout(true);
    try {
      const result = await createMembershipCheckoutConfig({
        userId: userData.id,
        planId: "platform_access",
        returnUrl: `${window.location.origin}/client/my-learning?membershipCheckout=1`,
      });
      setMembershipCheckout({ id: result.checkoutId, url: result.url, amount });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to start checkout.",
      );
    } finally {
      setIsStartingMembershipCheckout(false);
    }
  };

  const handleBuyCourse = async (course: any) => {
    if (!user?.uid || !course.id) return;
    if (course.luminoCheckoutUrl) {
      window.open(course.luminoCheckoutUrl, "_blank", "noopener,noreferrer");
      return;
    }
    try {
      setCheckingOutCourseId(course.id);
      const returnUrl = `${window.location.origin}/client/my-learning/${course.id}`;
      const res = await createCheckout({
        courseId: course.id,
        returnUrl,
      });
      if (res?.url) {
        window.location.href = res.url;
      }
    } finally {
      setCheckingOutCourseId(null);
    }
  };

  if (isLoadingMembership) {
    return <Spinner displayText="Loading..." />;
  }

  if (membershipCheckout && userData?.id) {
    return (
      <MembershipCheckoutView
        checkoutId={membershipCheckout.id}
        checkoutUrl={membershipCheckout.url}
        userId={userData.id}
        tierId="platform_access"
        amount={membershipCheckout.amount}
        membershipAmount={membershipCheckout.amount}
        onPaymentCompleteAction={() =>
          window.location.assign(
            "/client/my-learning?membershipCheckout=processing",
          )
        }
      />
    );
  }

  if (!hasMembership) {
    return (
      <main className="min-h-screen bg-white pb-16">
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <p className="font-semibold">This feature is currently locked</p>
            <p className="mt-1 text-sm leading-6">
              Platform Access is required to access the Learning Center and
              courses.
            </p>
          </div>
        </div>
        <PricingPlans
          onSelectPlan={startMembershipCheckout}
          isLoading={isStartingMembershipCheckout}
        />
      </main>
    );
  }

  if (isLoading || isLoadingAll) {
    return <Spinner displayText="Loading courses..." />;
  }

  // Calculate enrolled statistics
  const enrolledCourses = coursesWithProgress || [];
  const totalCourses = enrolledCourses.length;
  const completedCourses = enrolledCourses.filter(
    (course) => course.enrollment?.progressPercentage === 100,
  ).length;
  const inProgressCourses = enrolledCourses.filter(
    (course) =>
      (course.enrollment?.progressPercentage ?? 0) > 0 &&
      course.enrollment?.progressPercentage !== 100,
  ).length;
  const notStartedCourses = totalCourses - completedCourses - inProgressCourses;
  const overallProgress =
    totalCourses > 0
      ? Math.round(
          enrolledCourses.reduce(
            (sum, c) => sum + (c.enrollment?.progressPercentage ?? 0),
            0,
          ) / totalCourses,
        )
      : 0;

  // Filter enrolled courses
  const filteredEnrolledCourses = enrolledCourses.filter((course) => {
    const pct = course.enrollment?.progressPercentage ?? 0;
    const status =
      pct === 100 ? "completed" : pct > 0 ? "in-progress" : "not-started";
    if (filter !== "all" && status !== filter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        course.title?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filter catalog courses
  const publishedCatalog = (allCourses || []).filter((c) => c.isPublished);
  const filteredCatalog = publishedCatalog.filter((course) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        course.title?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const enrolledCourseIds = new Set(enrolledCourses.map((c) => c.id));

  return (
    <main className="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden bg-gray-25 py-3 sm:gap-6 sm:py-6">
      <div className="min-w-0 max-w-3xl [&_.header-box-subtext]:text-pretty">
        <HeaderBox
          title="Learning Center"
          subtext="Browse premium masterclasses, track your enrolled courses, and earn completion certificates."
        />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full min-w-0 max-w-full"
      >
        <div className="flex w-full min-w-0 max-w-full flex-col gap-3 pb-2 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
          <TabsList className="grid h-auto w-full min-w-0 grid-cols-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-900 lg:w-auto">
            <TabsTrigger
              value="my-courses"
              className="h-11 min-w-0 gap-1.5 overflow-hidden px-1.5 text-[11px] sm:h-9 sm:gap-2 sm:px-3 sm:text-sm"
            >
              <BookOpen className="size-3.5 shrink-0 sm:size-4" />
              <span className="truncate">My Courses ({totalCourses})</span>
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="h-11 min-w-0 gap-1.5 overflow-hidden px-1.5 text-[11px] sm:h-9 sm:gap-2 sm:px-3 sm:text-sm"
            >
              <ShoppingBag className="size-3.5 shrink-0 sm:size-4" />
              <span className="truncate">
                Explore Catalog ({publishedCatalog.length})
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Search Input */}
          <div className="relative w-full min-w-0 lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full min-w-0 rounded-lg border bg-white py-2 pl-9 pr-4 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 sm:h-9 sm:text-sm"
            />
          </div>
        </div>

        {/* TAB 1: Enrolled Courses */}
        <TabsContent
          value="my-courses"
          className="mt-3 w-full min-w-0 max-w-full space-y-4 sm:mt-4 sm:space-y-6"
        >
          {totalCourses > 0 && (
            <>
              {/* Progress Overview Stats */}
              <div className="grid w-full min-w-0 grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-white p-3 dark:bg-slate-900 sm:gap-3 sm:p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 sm:size-10">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-gray-600 sm:text-xs">
                      Enrolled Courses
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {totalCourses}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-white p-3 dark:bg-slate-900 sm:gap-3 sm:p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600 sm:size-10">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-gray-600 sm:text-xs">
                      In Progress
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {inProgressCourses}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-white p-3 dark:bg-slate-900 sm:gap-3 sm:p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 sm:size-10">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-gray-600 sm:text-xs">
                      Completed
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {completedCourses}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-2 rounded-xl border bg-white p-3 dark:bg-slate-900 sm:gap-3 sm:p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 sm:size-10">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] text-gray-600 sm:text-xs">
                      Avg Completion
                    </p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {overallProgress}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full min-w-0 sm:max-w-xs">
                <label
                  htmlFor="course-status-filter"
                  className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Course status
                </label>
                <div className="relative">
                  <ListFilter
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
                    aria-hidden="true"
                  />
                  <select
                    id="course-status-filter"
                    value={filter}
                    onChange={(event) =>
                      setFilter(event.target.value as FilterStatus)
                    }
                    className="h-11 w-full min-w-0 appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-10 text-base font-medium text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 sm:text-sm"
                  >
                    <option value="all">All courses ({totalCourses})</option>
                    <option value="in-progress">
                      In progress ({inProgressCourses})
                    </option>
                    <option value="completed">
                      Completed ({completedCourses})
                    </option>
                    <option value="not-started">
                      Not started ({notStartedCourses})
                    </option>
                  </select>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.22 7.72a.75.75 0 0 1 1.06 0L10 11.44l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.78a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* Enrolled Courses Grid */}
          {filteredEnrolledCourses.length > 0 ? (
            <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {filteredEnrolledCourses.map((course, index) => {
                const progressPct = course.enrollment?.progressPercentage ?? 0;
                const gradient =
                  COURSE_GRADIENTS[index % COURSE_GRADIENTS.length];

                return (
                  <Link
                    key={course.id}
                    href={`/client/my-learning/${course.id}`}
                    className="group flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border bg-white transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none dark:bg-slate-900"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full min-w-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
                        >
                          <BookOpen className="w-10 h-10 opacity-60" />
                        </div>
                      )}
                      <div className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {course.category || "Course"}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-between space-y-4 p-4 sm:p-5">
                      <div className="min-w-0 space-y-1.5">
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {course.subtitle || course.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex min-w-0 flex-col items-start gap-1 text-xs min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between min-[400px]:gap-2">
                          <span className="min-w-0 font-medium text-gray-700 dark:text-gray-300">
                            {progressPct === 100
                              ? "Completed"
                              : `${progressPct}% complete`}
                          </span>
                          <span className="text-gray-500 min-[400px]:shrink-0">
                            {course.completedChapters || 0} /{" "}
                            {course.totalChapters || 0} lectures
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              progressPct === 100
                                ? "bg-emerald-500"
                                : "bg-blue-600"
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 rounded-2xl border bg-white p-6 text-center dark:bg-slate-900 sm:p-12">
              <div className="w-14 h-14 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-blue-600">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  No courses found in your library
                </h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mt-1">
                  Explore our catalog of paid and free educational materials to
                  start learning today.
                </p>
              </div>
              <Button
                onClick={() => setActiveTab("catalog")}
                className="h-11 w-full gap-2 bg-blue-600 hover:bg-blue-700 sm:w-auto"
              >
                <ShoppingBag className="w-4 h-4" /> Browse Course Catalog
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Course Catalog */}
        <TabsContent
          value="catalog"
          className="mt-3 w-full min-w-0 max-w-full space-y-4 sm:mt-4 sm:space-y-6"
        >
          <div className="grid w-full min-w-0 max-w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {filteredCatalog.map((course, index) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const pricing = getCoursePricing(course);
              const gradient =
                COURSE_GRADIENTS[index % COURSE_GRADIENTS.length];

              return (
                <div
                  key={course.id}
                  className="group flex w-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border bg-white transition-shadow duration-200 hover:shadow-md motion-reduce:transition-none dark:bg-slate-900"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full min-w-0 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {course.imageUrl ? (
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
                      >
                        <BookOpen className="w-10 h-10 opacity-60" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 max-w-[calc(100%-6.5rem)] truncate rounded-full bg-black/70 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                      {course.category || "Course"}
                    </div>

                    {isEnrolled ? (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Enrolled
                      </div>
                    ) : pricing.isFree ? (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Free
                      </div>
                    ) : null}
                  </div>

                  {/* Body */}
                  <div className="flex min-w-0 flex-1 flex-col justify-between space-y-4 p-4 sm:p-5">
                    <div className="min-w-0 space-y-2">
                      <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {course.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {course.subtitle || course.description}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-amber-500 font-bold pt-1">
                        <span>{(course.averageRating || 5.0).toFixed(1)}</span>
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-gray-400 font-normal">
                          ({course.totalRatingsCount || 0})
                        </span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        {pricing.isFree ? (
                          <span className="font-bold text-base text-emerald-600">
                            Free
                          </span>
                        ) : (
                          <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                            <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                              ${pricing.formattedEffectivePrice}
                            </span>
                            {pricing.hasDiscount && (
                              <span className="text-xs line-through text-gray-400">
                                ${pricing.formattedBasePrice}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {isEnrolled ? (
                        <Link
                          href={`/client/my-learning/${course.id}`}
                          className="w-full sm:w-auto"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-11 w-full gap-1 text-xs sm:h-9 sm:w-auto"
                          >
                            Continue
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                      ) : pricing.isFree ? (
                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:items-center">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-11 min-w-0 gap-1 px-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 sm:h-9 sm:px-3"
                            disabled={isEnrolling}
                            onClick={async () => {
                              if (!user?.uid || !course.id) return;
                              await enrollUser({
                                userId: user.uid,
                                courseId: course.id,
                              });
                              router.push(`/client/my-learning/${course.id}`);
                            }}
                          >
                            Enroll Free
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                          <Link
                            href={`/client/courses/${course.id}`}
                            className="block min-w-0"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-11 w-full gap-1 text-xs sm:h-9"
                            >
                              Details
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:flex sm:items-center">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-11 min-w-0 gap-1 px-2 text-xs text-white bg-blue-600 hover:bg-blue-700 sm:h-9 sm:px-3"
                            disabled={checkingOutCourseId === course.id}
                            onClick={() => handleBuyCourse(course)}
                          >
                            {checkingOutCourseId === course.id
                              ? "Processing..."
                              : "Buy Now"}
                            {course.luminoCheckoutUrl ? (
                              <ExternalLink className="w-3 h-3" />
                            ) : (
                              <ArrowRight className="w-3.5 h-3.5" />
                            )}
                          </Button>
                          <Link
                            href={`/client/courses/${course.id}`}
                            className="block min-w-0"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-11 w-full gap-1 text-xs sm:h-9"
                            >
                              Details
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
};

export default MyLearningPage;
