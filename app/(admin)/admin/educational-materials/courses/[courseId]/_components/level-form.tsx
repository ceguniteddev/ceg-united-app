"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormSelect } from "@/components/forms/form-select";
import { FormInput } from "@/components/forms/form-input";
import { Pencil, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useCourseMutation } from "@/hooks/educational-materials/course";
import { Course, CourseLevel } from "@/schema/educational-materials/course";

interface LevelFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  level: z.enum(["All Levels", "Beginner", "Intermediate", "Advanced"]),
  language: z.string().min(1, "Language is required"),
});

const levelOptions = [
  { value: "All Levels", label: "All Levels" },
  { value: "Beginner", label: "Beginner" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced", label: "Advanced" },
];

export const LevelForm = ({ initialData, courseId }: LevelFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { updateCourse, isUpdating } = useCourseMutation();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      level: (initialData?.level as CourseLevel) || "All Levels",
      language: initialData?.language || "English",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateCourse({
        id: courseId,
        data: {
          level: values.level,
          language: values.language.trim() || "English",
        },
      });
      toast.success("Level and language updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update course details");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-600" />
          <span>Course Level & Language</span>
        </div>
        <Button
          onClick={() => setIsEditing(!isEditing)}
          variant="ghost"
          size="sm"
        >
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-1" />
              Edit Details
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-3 flex items-center gap-4 text-sm">
          <div>
            <span className="text-gray-500 text-xs block">
              Difficulty Level
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {initialData?.level || "All Levels"}
            </span>
          </div>
          <div className="border-l pl-4">
            <span className="text-gray-500 text-xs block">
              Primary Language
            </span>
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {initialData?.language || "English"}
            </span>
          </div>
        </div>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormSelect
                control={form.control}
                name="level"
                label="Difficulty Level"
                options={levelOptions}
                placeholder="Select level"
              />

              <FormInput
                control={form.control}
                name="language"
                label="Primary Language"
                placeholder="e.g. English"
                disabled={isUpdating}
                required
              />
            </div>

            <div className="flex items-center gap-x-2">
              <Button disabled={isUpdating} type="submit" size="sm">
                Save Level & Language
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
