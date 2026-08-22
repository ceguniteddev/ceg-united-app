"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Banner } from "@/components/banner";
import { IconBadge } from "@/components/icon-badge";
import {
  LayoutDashboard,
  ListChecks,
  File,
  DollarSign,
  Users,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

import { TitleForm } from "./_components/title-form";
import { SubtitleForm } from "./_components/subtitle-form";
import { DescriptionForm } from "./_components/description-form";
import { Actions } from "./_components/actions";
import { ImageForm } from "./_components/image-form";
import { ChaptersForm } from "./_components/chapters-form";
import { CategoryForm } from "./_components/category-form";
import { AttachmentForm } from "./_components/attachment-form";
import { LevelForm } from "./_components/level-form";
import { InstructorForm } from "./_components/instructor-form";
import { TargetStudentsForm } from "./_components/target-students-form";
import { PriceForm } from "./_components/price-form";

import { useGetCourseById } from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";

const CoursePage = () => {
  const params = useParams();
  const courseId = params.courseId as string;
  const router = useRouter();

  const { course, isLoading, isError, error } = useGetCourseById(courseId);
  const [activeTab, setActiveTab] = useState("landing-page");

  useEffect(() => {
    if (!isLoading && isError) {
      const status = (error as any)?.status;
      if (status === 404) {
        router.push("/admin/educational-materials");
      }
    }
  }, [isLoading, isError, error, router]);

  if (isLoading) {
    return <Spinner displayText="Loading course studio..." />;
  }

  if (!course) {
    return null;
  }

  const requiredFields = [
    course.title,
    course.description,
    course.imageUrl,
    course.category,
    course.chapters?.some((chapter) => chapter.isPublished),
  ];

  const totalFields = requiredFields.length;
  const completedFields = requiredFields.filter(Boolean).length;
  const completionText = `(${completedFields}/${totalFields})`;
  const isComplete = requiredFields.every(Boolean);

  return (
    <>
      {!course.isPublished && (
        <Banner label="This course is currently in Draft mode. Publish it to make it available to students." />
      )}
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div>
          <Link
            href="/admin/educational-materials"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all courses
          </Link>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {course.title || "Course Studio"}
                </h1>
                {course.isPublished ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                    Published
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-amber-950 dark:text-amber-300">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Completion Progress: {completionText} requirements met
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/client/courses/${courseId}`} target="_blank">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Eye className="w-4 h-4" /> Preview Course Page
                </Button>
              </Link>
              <Actions
                disabled={!isComplete}
                courseId={courseId}
                isPublished={course.isPublished}
              />
            </div>
          </div>
        </div>

        {/* Multi-Tab Studio Navigation */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full space-y-6"
        >
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full bg-slate-100 dark:bg-slate-900 p-1 rounded-lg h-auto">
            <TabsTrigger
              value="landing-page"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-medium"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Landing Page</span>
            </TabsTrigger>
            <TabsTrigger
              value="curriculum"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-medium"
            >
              <ListChecks className="w-4 h-4" />
              <span>Curriculum</span>
            </TabsTrigger>
            <TabsTrigger
              value="target-students"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              <span>Target Students</span>
            </TabsTrigger>
            <TabsTrigger
              value="pricing"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-medium"
            >
              <DollarSign className="w-4 h-4" />
              <span>Pricing</span>
            </TabsTrigger>
            <TabsTrigger
              value="resources"
              className="flex items-center gap-2 py-2.5 text-xs sm:text-sm font-medium"
            >
              <File className="w-4 h-4" />
              <span>Resources</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Landing Page & Basics */}
          <TabsContent value="landing-page" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={LayoutDashboard} />
                  <h2 className="text-lg font-semibold">Course Details</h2>
                </div>
                <TitleForm initialData={course} courseId={course.id!} />
                <SubtitleForm initialData={course} courseId={course.id!} />
                <DescriptionForm initialData={course} courseId={course.id!} />
                <CategoryForm initialData={course} courseId={course.id!} />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-x-2">
                  <IconBadge icon={Users} />
                  <h2 className="text-lg font-semibold">
                    Media & Instructor Attribution
                  </h2>
                </div>
                <ImageForm initialData={course} courseId={course.id!} />
                <LevelForm initialData={course} courseId={course.id!} />
                <InstructorForm initialData={course} courseId={course.id!} />
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Curriculum Builder */}
          <TabsContent value="curriculum" className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2 mb-2">
                <IconBadge icon={ListChecks} />
                <h2 className="text-lg font-semibold">Course Curriculum</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Organize lectures, quizzes, and reading materials in order.
                Click on any lecture to configure Mux video streaming, article
                content, or quiz questions.
              </p>
              <ChaptersForm initialData={course} courseId={course.id!} />
            </div>
          </TabsContent>

          {/* TAB 3: Target Students */}
          <TabsContent value="target-students" className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2 mb-2">
                <IconBadge icon={Users} />
                <h2 className="text-lg font-semibold">Intended Learners</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Help students determine if this course fits their goals and
                skill level.
              </p>
              <TargetStudentsForm initialData={course} courseId={course.id!} />
            </div>
          </TabsContent>

          {/* TAB 4: Pricing Payments */}
          <TabsContent value="pricing" className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2 mb-2">
                <IconBadge icon={DollarSign} />
                <h2 className="text-lg font-semibold">Course Monetization</h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Set individual pricing for this course. Dodo Payments handles
                checkout sessions, credit card/Apple Pay transactions, and
                automatic course enrollment.
              </p>
              <PriceForm initialData={course} courseId={course.id!} />
            </div>
          </TabsContent>

          {/* TAB 5: Resources & Attachments */}
          <TabsContent value="resources" className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2 mb-2">
                <IconBadge icon={File} />
                <h2 className="text-lg font-semibold">
                  Course Materials & Workbooks
                </h2>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Upload PDFs, spreadsheets, and guides that enrolled students can
                download.
              </p>
              <AttachmentForm initialData={course} courseId={course.id!} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default CoursePage;
