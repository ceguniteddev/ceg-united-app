"use client";
import { redirect, useParams } from "next/navigation";
import { Banner } from "@/components/banner";
import { IconBadge } from "@/components/icon-badge";
import { LayoutDashboard, ListChecks, File } from "lucide-react";
import { TitleForm } from "./_components/title-form";
import { DescriptionForm } from "./_components/description-form";
import { Actions } from "./_components/actions";
import { ImageForm } from "./_components/image-form";
import { ChaptersForm } from "./_components/chapters-form";
import { CategoryForm } from "./_components/category-form";
import { AttachmentForm } from "./_components/attachment-form";
import { useGetCourseById } from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";

const CoursePage = () => {
  const params = useParams();
  const courseId = params.courseId as string;

  const { course, isLoading } = useGetCourseById(courseId);

  if (isLoading) {
    return <Spinner displayText="Loading course..." />;
  }

  if (!course) {
    return redirect("/admin/educational-materials");
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
        <Banner label="This course is unpublished. It will not be visible to the Clients." />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-medium">
              Course Setup {course.isPublished && "(Published)"}
            </h1>
            <span className="text-sm text-slate-700">
              Complete all fields {completionText}
            </span>
          </div>
          <Actions
            disabled={!isComplete}
            courseId={courseId!}
            isPublished={course.isPublished}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Customize your Course</h2>
            </div>
            <TitleForm initialData={course} courseId={course.id!} />
            <DescriptionForm initialData={course} courseId={course.id!} />
            <ImageForm initialData={course} courseId={course.id!} />
            <CategoryForm initialData={course} courseId={course.id!} />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={ListChecks} />
                <h2 className="text-xl">Course chapters</h2>
              </div>
              <ChaptersForm initialData={course} courseId={course.id!} />
            </div>

            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={File} />
                <h2 className="text-xl">Resources & Attachments</h2>
              </div>
              <AttachmentForm initialData={course} courseId={course.id!} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CoursePage;
