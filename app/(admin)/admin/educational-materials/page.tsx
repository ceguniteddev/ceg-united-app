"use client";
import HeaderBox from "@/components/HeaderBox";
import AddCourse from "./courses/_components/AddCourse";
import CoursesList from "./list";
import { useGetCourses } from "@/hooks/educational-materials/course";
import Spinner from "@/components/Spinner";

const Page = () => {
  const { courses, isLoading } = useGetCourses();

  if (isLoading) {
    return <Spinner displayText="Loading courses..." />;
  }

  return (
    <section className="transactions">
      <div className="transactions-header flex flex-col sm:flex-row justify-between gap-3">
        <HeaderBox title="Educational Materials" />
        <AddCourse />
      </div>

      <div className="space-y-4 sm:space-y-6">
        <section className="flex w-full flex-col gap-4 sm:gap-6">
          {courses && courses.length > 0 ? (
            <CoursesList courses={courses} />
          ) : (
            <p className="text-center text-sm sm:text-base">
              No educational materials found.
            </p>
          )}
        </section>
      </div>
    </section>
  );
};

export default Page;
