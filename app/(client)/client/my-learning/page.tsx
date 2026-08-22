"use client";

import React, { useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import {
  useGetUserCoursesWithProgress,
  useGetCourses,
} from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Trophy,
  ArrowRight,
  GraduationCap,
  Search,
  SlidersHorizontal,
  BarChart3,
  FileText,
  Star,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import HeaderBox from "@/components/HeaderBox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

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
  const { user } = useAuth();
  const { coursesWithProgress, isLoading } = useGetUserCoursesWithProgress(
    user?.uid || "",
  );
  const { courses: allCourses, isLoading: isLoadingAll } = useGetCourses();

  const [activeTab, setActiveTab] = useState("my-courses");
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    <div className="transactions space-y-6">
      <HeaderBox
        title="Learning Center"
        subtext="Browse premium masterclasses, track your enrolled courses, and earn completion certificates."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            <TabsTrigger
              value="my-courses"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <BookOpen className="w-4 h-4" />
              <span>My Courses ({totalCourses})</span>
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Catalog ({publishedCatalog.length})</span>
            </TabsTrigger>
          </TabsList>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* TAB 1: Enrolled Courses */}
        <TabsContent value="my-courses" className="space-y-6 mt-4">
          {totalCourses > 0 && (
            <>
              {/* Progress Overview Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Enrolled Courses</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {totalCourses}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">In Progress</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {inProgressCourses}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Completed</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {completedCourses}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Completion</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {overallProgress}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className="rounded-full text-xs"
                >
                  All ({totalCourses})
                </Button>
                <Button
                  variant={filter === "in-progress" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("in-progress")}
                  className="rounded-full text-xs"
                >
                  In Progress ({inProgressCourses})
                </Button>
                <Button
                  variant={filter === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("completed")}
                  className="rounded-full text-xs"
                >
                  Completed ({completedCourses})
                </Button>
                <Button
                  variant={filter === "not-started" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("not-started")}
                  className="rounded-full text-xs"
                >
                  Not Started ({notStartedCourses})
                </Button>
              </div>
            </>
          )}

          {/* Enrolled Courses Grid */}
          {filteredEnrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEnrolledCourses.map((course, index) => {
                const progressPct = course.enrollment?.progressPercentage ?? 0;
                const gradient =
                  COURSE_GRADIENTS[index % COURSE_GRADIENTS.length];

                return (
                  <Link
                    key={course.id}
                    href={`/client/my-learning/${course.id}`}
                    className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div
                          className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
                        >
                          <BookOpen className="w-10 h-10 opacity-60" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                        {course.category}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                      <div className="space-y-1.5">
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {course.title}
                        </h3>
                        <p className="text-xs text-gray-500 line-clamp-2">
                          {course.subtitle || course.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {progressPct === 100
                              ? "Completed"
                              : `${progressPct}% complete`}
                          </span>
                          <span className="text-gray-400">
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
            <div className="bg-white dark:bg-slate-900 rounded-2xl border p-12 text-center space-y-4">
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
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <ShoppingBag className="w-4 h-4" /> Browse Course Catalog
              </Button>
            </div>
          )}
        </TabsContent>

        {/* TAB 2: Course Catalog */}
        <TabsContent value="catalog" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCatalog.map((course, index) => {
              const isEnrolled = enrolledCourseIds.has(course.id);
              const price = course.price ?? 0;
              const discountPrice = course.discountPrice;
              const effectivePrice =
                discountPrice != null ? discountPrice : price;
              const gradient =
                COURSE_GRADIENTS[index % COURSE_GRADIENTS.length];

              return (
                <div
                  key={course.id}
                  className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {course.imageUrl ? (
                      <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
                      >
                        <BookOpen className="w-10 h-10 opacity-60" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                      {course.category}
                    </div>

                    {isEnrolled && (
                      <div className="absolute top-3 right-3 bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-full font-semibold">
                        Enrolled
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
                    <div className="space-y-2">
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
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        {course.isFree ? (
                          <span className="font-bold text-base text-emerald-600">
                            Free
                          </span>
                        ) : (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-bold text-base text-gray-900 dark:text-gray-100">
                              $
                              {effectivePrice.toLocaleString("en-US", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                            {discountPrice != null && discountPrice < price && (
                              <span className="text-xs line-through text-gray-400">
                                $
                                {price.toLocaleString("en-US", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        href={
                          isEnrolled
                            ? `/client/my-learning/${course.id}`
                            : `/client/courses/${course.id}`
                        }
                      >
                        <Button
                          size="sm"
                          variant={isEnrolled ? "outline" : "default"}
                          className="gap-1 text-xs"
                        >
                          {isEnrolled ? "Continue" : "View Course"}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyLearningPage;
