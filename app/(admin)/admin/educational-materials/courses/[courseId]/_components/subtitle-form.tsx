"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormInput } from "@/components/forms/form-input";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { useCourseMutation } from "@/hooks/educational-materials/course";
import { Course } from "@/schema/educational-materials/course";

interface SubtitleFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  subtitle: z.string().optional(),
});

export const SubtitleForm = ({ initialData, courseId }: SubtitleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { updateCourse, isUpdating } = useCourseMutation();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      subtitle: initialData?.subtitle || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateCourse({
        id: courseId,
        data: { subtitle: values.subtitle?.trim() || undefined },
      });
      toast.success("Subtitle updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update subtitle");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <span>Course Subtitle / Tagline</span>
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
              Edit Subtitle
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 italic">
          {initialData?.subtitle ||
            "No subtitle provided. Add a compelling 1-line hook."}
        </p>
      )}

      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormInput
              control={form.control}
              name="subtitle"
              label="Course Subtitle"
              placeholder="e.g. A complete step-by-step masterclass on commercial underwriting"
              disabled={isUpdating}
            />
            <div className="flex items-center gap-x-2">
              <Button disabled={isUpdating} type="submit" size="sm">
                Save Subtitle
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
