"use client";

import { useMemo } from "react";
import { Star, MessageSquare, RefreshCw } from "lucide-react";
import { IconBadge } from "@/components/icon-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCourseReviews } from "@/hooks/educational-materials/course";
import { Course, CourseReview } from "@/schema/educational-materials/course";

interface ReviewsPanelProps {
  courseId: string;
  initialData?: Course;
}

function getInitials(name: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatReviewDate(date?: Date | string | null): string {
  if (!date) return "Recently";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Recently";
  }
}

function StarRatingDisplay({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300 dark:text-gray-600"
          }`}
        />
      ))}
    </div>
  );
}

export const ReviewsPanel = ({ courseId, initialData }: ReviewsPanelProps) => {
  const { reviews, isLoading, refetch } = useCourseReviews(courseId);

  const { totalCount, averageRating, distribution } = useMemo(() => {
    const total = reviews.length;
    if (total === 0) {
      return {
        totalCount: initialData?.totalRatingsCount ?? 0,
        averageRating: initialData?.averageRating ?? 0,
        distribution: [5, 4, 3, 2, 1].map((stars) => ({
          stars,
          count: 0,
          percentage: 0,
        })),
      };
    }

    const sum = reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0);
    const avg = sum / total;

    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((rev) => {
      const rounded = Math.min(5, Math.max(1, Math.round(rev.rating || 5)));
      counts[rounded] = (counts[rounded] || 0) + 1;
    });

    const dist = [5, 4, 3, 2, 1].map((stars) => {
      const count = counts[stars] || 0;
      const percentage = Math.round((count / total) * 100);
      return { stars, count, percentage };
    });

    return {
      totalCount: total,
      averageRating: avg,
      distribution: dist,
    };
  }, [reviews, initialData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-x-2 mb-1">
            <IconBadge icon={Star} />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Student Reviews & Ratings
            </h2>
          </div>
          <p className="text-xs text-gray-500">
            Read feedback and ratings submitted by enrolled clients for this
            course.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="self-start sm:self-auto gap-1.5 text-xs text-gray-600 dark:text-gray-300"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
          />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 flex flex-col items-center justify-center">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="md:col-span-2 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        </div>
      )}

      {/* Content when loaded */}
      {!isLoading && (
        <>
          {/* Rating Summary Card */}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              {/* Left Column: Big Average Score */}
              <div className="flex flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <span className="text-4xl font-extrabold text-amber-500 tracking-tight">
                  {totalCount > 0 ? averageRating.toFixed(1) : "0.0"}
                </span>
                <div className="my-2">
                  <StarRatingDisplay rating={averageRating} />
                </div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Course Rating
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {totalCount} {totalCount === 1 ? "review" : "reviews"} total
                </p>
              </div>

              {/* Right Column: 5-to-1 Star Distribution */}
              <div className="md:col-span-2 space-y-2.5">
                {distribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <div className="flex items-center gap-1 w-14 text-gray-600 dark:text-gray-400 font-medium">
                      <span>{stars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <div className="w-16 text-right text-gray-500 font-mono text-[11px]">
                      <span>{percentage}%</span>
                      <span className="text-gray-400 ml-1">({count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Individual Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>All Reviews ({reviews.length})</span>
              </h3>

              <div className="space-y-3">
                {reviews.map((rev: CourseReview, index: number) => {
                  const reviewKey =
                    rev.id || `review-${index}-${rev.userId || "anon"}`;
                  return (
                    <div
                      key={reviewKey}
                      className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-white dark:bg-slate-900 shadow-sm hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        {/* Reviewer Info */}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-gray-200 dark:border-gray-700">
                            {rev.userAvatar && (
                              <AvatarImage
                                src={rev.userAvatar}
                                alt={rev.userName || "Student"}
                              />
                            )}
                            <AvatarFallback className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 font-medium text-xs">
                              {getInitials(rev.userName || "Student")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {rev.userName || "Anonymous Student"}
                            </h4>
                            <p className="text-[11px] text-gray-400">
                              {formatReviewDate(rev.createdAt)}
                            </p>
                          </div>
                        </div>

                        {/* Star Rating Badge */}
                        <div className="flex flex-col items-end gap-1">
                          <StarRatingDisplay rating={rev.rating || 5} />
                          <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                            {(rev.rating || 5).toFixed(1)} / 5.0
                          </span>
                        </div>
                      </div>

                      {/* Comment */}
                      <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line break-words">
                          {rev.comment}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 dark:border-gray-800 rounded-xl p-10 text-center bg-gray-50/50 dark:bg-slate-900/50">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                No reviews yet
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                Enrolled students will be able to submit star ratings and
                written reviews once they start this course.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
