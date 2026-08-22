"use client";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  LayoutDashboard,
  Video,
  FileText,
  HelpCircle,
} from "lucide-react";

import { IconBadge } from "@/components/icon-badge";
import { Banner } from "@/components/banner";
import { ChapterActions } from "./_components/chapter-actions";
import { ChapterTitleForm } from "./_components/chapter-title-form";
import { ChapterDescriptionForm } from "./_components/chapter-description-form";
import { ChapterVideoForm } from "./_components/chapter-video-form";
import { ChapterTypeForm } from "./_components/chapter-type-form";
import { ChapterArticleForm } from "./_components/chapter-article-form";
import { ChapterQuizForm } from "./_components/chapter-quiz-form";
import { useGetChapterById } from "@/hooks/educational-materials/chapter";
import Spinner from "@/components/Spinner";
import { useEffect } from "react";

const ChapterIdPage = () => {
  const { courseId, chapterId } = useParams();
  const router = useRouter();

  const { chapter, isLoading, isError, error } = useGetChapterById({
    courseId: courseId as string,
    chapterId: chapterId as string,
  });

  useEffect(() => {
    if (!isLoading && isError) {
      const status = (error as any)?.status;
      if (status === 404) {
        router.push("/admin/educational-materials");
      }
    }
  }, [isLoading, isError, error, router]);

  if (isLoading) {
    return <Spinner displayText="Loading chapter..." />;
  }

  if (!chapter) {
    return null;
  }

  const isVideo = !chapter.type || chapter.type === "video";
  const isArticle = chapter.type === "article";
  const isQuiz = chapter.type === "quiz";

  const requiredFields = [
    chapter.title,
    isVideo
      ? chapter.videoUrl
      : isArticle
        ? chapter.articleContentHtml
        : chapter.quiz?.questions?.length,
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!chapter.isPublished && (
        <Banner
          variant="warning"
          label="This lecture is unpublished. It will not be visible in the course."
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Link
              href={`/admin/educational-materials/courses/${courseId}`}
              className="flex items-center text-sm hover:opacity-75 transition mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to course studio
            </Link>
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-y-2">
                <h1 className="text-2xl font-medium">
                  Lecture Setup - {chapter.title}
                </h1>
                <span className="text-sm text-slate-700">
                  Complete all fields {completionText}
                </span>
              </div>
              <ChapterActions
                disabled={!isComplete}
                courseId={courseId as string}
                chapterId={chapterId as string}
                isPublished={chapter.isPublished}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={LayoutDashboard} />
                <h2 className="text-xl">Lecture Settings</h2>
              </div>
              <ChapterTitleForm
                initialData={chapter}
                courseId={courseId as string}
                chapterId={chapterId as string}
              />
              <ChapterTypeForm
                initialData={chapter}
                courseId={courseId as string}
                chapterId={chapterId as string}
              />
              <ChapterDescriptionForm
                initialData={chapter}
                courseId={courseId as string}
                chapterId={chapterId as string}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge
                  icon={isVideo ? Video : isArticle ? FileText : HelpCircle}
                />
                <h2 className="text-xl">
                  {isVideo
                    ? "Video Content (Mux)"
                    : isArticle
                      ? "Article Content"
                      : "Quiz Content"}
                </h2>
              </div>

              {isVideo && (
                <ChapterVideoForm
                  initialData={chapter}
                  chapterId={chapterId as string}
                  courseId={courseId as string}
                />
              )}

              {isArticle && (
                <ChapterArticleForm
                  initialData={chapter}
                  chapterId={chapterId as string}
                  courseId={courseId as string}
                />
              )}

              {isQuiz && (
                <ChapterQuizForm
                  initialData={chapter}
                  chapterId={chapterId as string}
                  courseId={courseId as string}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChapterIdPage;
