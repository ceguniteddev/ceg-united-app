import HeaderBox from "@/components/HeaderBox";
import React, { Suspense } from "react";
import AddCourse from "./courses/_components/AddCourse";
import { getCourses } from "@/service/educational-materials/course";
import CoursesList from "./list";

export default async function Page() {
  console.log("EducationalMaterialsPage");
  const courses = await getCourses();
  console.log("courses", { courses });
  return (
    <section className="transactions">
      <div className="transactions-header flex flex-row justify-between">
        <HeaderBox title="Educational Materials" />
        <AddCourse />
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <div className="space-y-6">
          <section className="flex w-full flex-col gap-6">
            {courses && courses.length > 0 ? (
              <CoursesList courses={courses} />
            ) : (
              <p>No educational materials found.</p>
            )}
          </section>
        </div>{" "}
      </Suspense>
    </section>
  );
}
