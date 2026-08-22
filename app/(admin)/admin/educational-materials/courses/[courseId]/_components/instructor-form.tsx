"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/forms/form-input";
import { FormTextarea } from "@/components/forms/form-textarea";
import { Pencil, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useCourseMutation } from "@/hooks/educational-materials/course";
import { Course } from "@/schema/educational-materials/course";

interface InstructorFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().min(1, "Title is required"),
  bio: z.string().optional(),
});

export const InstructorForm = ({
  initialData,
  courseId,
}: InstructorFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { updateCourse, isUpdating } = useCourseMutation();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.instructor?.name || "CEG United Instructor",
      title: initialData?.instructor?.title || "Senior Underwriting Specialist",
      bio: initialData?.instructor?.bio || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateCourse({
        id: courseId,
        data: {
          instructor: {
            name: values.name.trim() || "CEG United Instructor",
            title: values.title.trim() || "Senior Financial Strategist",
            bio: values.bio?.trim() || undefined,
            avatarUrl: initialData?.instructor?.avatarUrl || undefined,
          },
        },
      });
      toast.success("Instructor profile updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update instructor profile");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-600" />
          <span>Instructor Information</span>
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
              Edit Instructor
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-3 space-y-1 text-sm">
          <p className="font-bold text-gray-900 dark:text-gray-100">
            {initialData?.instructor?.name || "CEG United Instructor"}
          </p>
          <p className="text-xs text-gray-500 font-medium">
            {initialData?.instructor?.title || "Senior Underwriting Specialist"}
          </p>
          {initialData?.instructor?.bio && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {initialData.instructor.bio}
            </p>
          )}
        </div>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormInput
              control={form.control}
              name="name"
              label="Instructor Name"
              placeholder="e.g. Michael Vance"
              disabled={isUpdating}
              required
            />

            <FormInput
              control={form.control}
              name="title"
              label="Professional Title / Headline"
              placeholder="e.g. Principal Capital Underwriter"
              disabled={isUpdating}
              required
            />

            <FormTextarea
              control={form.control}
              name="bio"
              label="Bio / Experience"
              placeholder="Brief biography of the instructor..."
              rows={3}
              disabled={isUpdating}
            />

            <div className="flex items-center gap-x-2">
              <Button disabled={isUpdating} type="submit" size="sm">
                Save Instructor
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
