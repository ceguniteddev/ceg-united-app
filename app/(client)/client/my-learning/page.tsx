"use client";

import React, { useState } from "react";
import { useAuth } from "@/provider/AuthContext";
import { useGetUserCoursesWithProgress } from "@/hooks/educational-materials/course";
import { useMembership } from "@/hooks/membership";
import { useAddons } from "@/hooks/addons";
// import { useGetDenefitsContractsByUserId } from "@/hooks/denefits";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import HeaderBox from "@/components/HeaderBox";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

// Deterministic gradient per course index
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
  // const { denefitsContract, isLoading: isLoadingContract } =
  //   useGetDenefitsContractsByUserId(user?.uid || "");

  const { data: userMembership } = useMembership(user?.uid);
  const { data: addons = [] } = useAddons();

  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return <Spinner displayText="Loading your courses..." />;
  }

  // Check if user has a paid membership or active add-on
  const hasPaidContract =
    userMembership?.status === "active" ||
    addons.some((addon) => addon.status === "active");

  if (!hasPaidContract) {
    return (
      <div className="transactions">
        <HeaderBox
          title="My Learning"
          subtext="Access your enrolled courses and track your progress"
        />
        <EmptyState
          title="Membership or Add-on Required"
          description="You need an active membership or add-on to access learning materials. Please upgrade or subscribe to unlock courses."
        />
      </div>
    );
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
          description="You don't have access to any courses yet. Courses become available when you have an active membership or add-on."
        />
      </div>
    );
  }

  // Calculate statistics
  const totalCourses = coursesWithProgress.length;
  const completedCourses = coursesWithProgress.filter(
    (course) => course.enrollment?.progressPercentage === 100,
  ).length;
  const inProgressCourses = coursesWithProgress.filter(
    (course) =>
      (course.enrollment?.progressPercentage ?? 0) > 0 &&
      course.enrollment?.progressPercentage !== 100,
  ).length;
  const notStartedCourses = totalCourses - completedCourses - inProgressCourses;
  const overallProgress =
    totalCourses > 0
      ? Math.round(
          coursesWithProgress.reduce(
            (sum, c) => sum + (c.enrollment?.progressPercentage ?? 0),
            0,
          ) / totalCourses,
        )
      : 0;

  // Filter + search
  const filteredCourses = coursesWithProgress.filter((course) => {
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

  const filterOptions: { value: FilterStatus; label: string; count: number }[] =
    [
      { value: "all", label: "All", count: totalCourses },
      { value: "in-progress", label: "In Progress", count: inProgressCourses },
      { value: "not-started", label: "Not Started", count: notStartedCourses },
      { value: "completed", label: "Completed", count: completedCourses },
    ];

  // Doughnut chart data
  const doughnutData = {
    labels: ["Completed", "In Progress", "Not Started"],
    datasets: [
      {
        data: [completedCourses, inProgressCourses, notStartedCourses],
        backgroundColor: ["#10b981", "#3b82f6", "#e5e7eb"],
        borderColor: ["#059669", "#2563eb", "#d1d5db"],
        borderWidth: 1.5,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { label: string; raw: unknown }) =>
            ` ${ctx.label}: ${ctx.raw} course${Number(ctx.raw) !== 1 ? "s" : ""}`,
        },
      },
    },
  };

  return (
    <div className="transactions">
      <HeaderBox
        title="My Learning"
        subtext="Access your enrolled courses and track your progress"
      />

      {/* Stats + Chart */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3 flex-1">
          <StatCard
            icon={BookOpen}
            label="Total Courses"
            value={String(totalCourses)}
            color="text-blue-600"
            bg="bg-blue-50"
          />
          <StatCard
            icon={Clock}
            label="In Progress"
            value={String(inProgressCourses)}
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard
            icon={Trophy}
            label="Completed"
            value={String(completedCourses)}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard
            icon={GraduationCap}
            label="Overall Progress"
            value={`${overallProgress}%`}
            color="text-violet-600"
            bg="bg-violet-50"
          />
        </div>

        {/* Doughnut Chart Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-5 lg:w-64 xl:w-72">
          <div className="relative w-24 h-24 flex-shrink-0">
            <Doughnut data={doughnutData} options={doughnutOptions} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-gray-900 leading-none">
                {overallProgress}%
              </span>
              <span className="text-[9px] text-gray-400 uppercase font-semibold tracking-wide mt-0.5">
                Done
              </span>
            </div>
          </div>
          <div className="space-y-2 min-w-0">
            <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Progress
            </p>
            <ChartLegendItem
              color="bg-emerald-500"
              label="Completed"
              count={completedCourses}
            />
            <ChartLegendItem
              color="bg-blue-500"
              label="In Progress"
              count={inProgressCourses}
            />
            <ChartLegendItem
              color="bg-gray-200"
              label="Not Started"
              count={notStartedCourses}
            />
          </div>
        </div>
      </div>

      {/* Search + Filter Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-4 rounded-xl bg-white border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5">
          <SlidersHorizontal className="hidden sm:block w-3.5 h-3.5 text-gray-400 flex-shrink-0 mr-0.5" />
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap min-h-[36px] sm:min-h-[32px] ${
                filter === opt.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 active:scale-95"
              }`}
            >
              {opt.label}
              <span
                className={`text-[10px] ${
                  filter === opt.value ? "text-white/70" : "text-gray-400"
                }`}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No courses found</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your search or filter
          </p>
          <button
            onClick={() => {
              setFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 text-xs text-blue-600 font-medium hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filteredCourses.map((course, index) => {
            const progressPercentage =
              course.enrollment?.progressPercentage || 0;
            const publishedChapters =
              course.chapters?.filter((c) => c.isPublished).length || 0;
            const completedChapters = course.completedChapters || 0;
            const isCompleted = progressPercentage === 100;
            const isInProgress = progressPercentage > 0 && !isCompleted;
            const gradient = COURSE_GRADIENTS[index % COURSE_GRADIENTS.length];

            // SVG progress ring
            const ringSize = 52;
            const strokeWidth = 4;
            const radius = (ringSize - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const offset =
              circumference - (progressPercentage / 100) * circumference;

            return (
              <Link
                key={course.id}
                href={`/client/my-learning/${course.id}`}
                className="group"
              >
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden h-full flex flex-col">
                  {/* Gradient Banner */}
                  <div
                    className={`relative h-28 sm:h-32 bg-gradient-to-r ${gradient} overflow-hidden`}
                  >
                    {/* Decorative shapes */}
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
                    <div className="absolute bottom-0 left-8 w-20 h-20 bg-white/10 rounded-full translate-y-1/2" />

                    {/* Category badge */}
                    {course.category && (
                      <div className="absolute top-3 left-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-sm">
                          {course.category}
                        </span>
                      </div>
                    )}

                    {/* Status badge */}
                    {isCompleted && (
                      <div className="absolute top-3 right-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/80 text-white backdrop-blur-sm">
                          <CheckCircle2 className="w-3 h-3" />
                          Done
                        </span>
                      </div>
                    )}
                    {isInProgress && (
                      <div className="absolute top-3 right-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/80 text-white backdrop-blur-sm">
                          <Clock className="w-3 h-3" />
                          Active
                        </span>
                      </div>
                    )}

                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      {course.imageUrl ? (
                        <Image
                          src={course.imageUrl}
                          alt={course.title || "Course image"}
                          fill
                          className="object-cover opacity-30"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <BookOpen className="w-7 h-7 text-white" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col">
                    <div className="flex items-start gap-3 mb-3">
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-blue-700 transition-colors">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                        {/* Meta */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                          <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                            <FileText className="w-3 h-3" />
                            {publishedChapters}{" "}
                            {publishedChapters === 1 ? "chapter" : "chapters"}
                          </span>
                          {completedChapters > 0 && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gray-400">
                              <BarChart3 className="w-3 h-3" />
                              {completedChapters}/{publishedChapters} done
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Ring */}
                      <div className="flex-shrink-0 relative flex items-center justify-center">
                        <svg
                          width={ringSize}
                          height={ringSize}
                          className="-rotate-90"
                        >
                          <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={radius}
                            fill="none"
                            stroke="#f1f5f9"
                            strokeWidth={strokeWidth}
                          />
                          <circle
                            cx={ringSize / 2}
                            cy={ringSize / 2}
                            r={radius}
                            fill="none"
                            stroke={isCompleted ? "#10b981" : "#3b82f6"}
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            className="transition-all duration-700"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs font-bold text-gray-900 leading-none">
                            {progressPercentage}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-auto">
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isCompleted ? "bg-emerald-500" : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.max(progressPercentage, progressPercentage > 0 ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                      {course.enrollment?.lastAccessedAt && (
                        <p className="text-[10px] text-gray-400 mt-1.5">
                          Last accessed:{" "}
                          {new Date(
                            course.enrollment.lastAccessedAt,
                          ).toLocaleDateString()}
                        </p>
                      )}

                      {/* CTA */}
                      <div className="mt-3 w-full px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-xs font-semibold flex items-center justify-center gap-2 min-h-[44px]">
                        {isCompleted
                          ? "Review Course"
                          : isInProgress
                            ? "Continue Learning"
                            : "Start Course"}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
  bg: string;
}

function StatCard({ icon: Icon, label, value, color, bg }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3.5 sm:p-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className={`w-4.5 h-4.5 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-lg font-bold text-gray-900 leading-none">
            {value}
          </p>
          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5 truncate">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Chart Legend Item ─────────────────────────────────────────
function ChartLegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${color} flex-shrink-0`} />
      <span className="text-xs text-gray-600 truncate">{label}</span>
      <span className="ml-auto text-xs font-semibold text-gray-900 pl-2">
        {count}
      </span>
    </div>
  );
}

export default MyLearningPage;
