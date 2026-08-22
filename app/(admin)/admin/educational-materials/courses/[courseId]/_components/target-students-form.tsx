"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormTags } from "@/components/forms/form-tags";
import { Pencil, CheckCircle2, ListOrdered, Users } from "lucide-react";
import { toast } from "sonner";
import { useCourseMutation } from "@/hooks/educational-materials/course";
import { Course } from "@/schema/educational-materials/course";

interface TargetStudentsFormProps {
  initialData: Course;
  courseId: string;
}

const formSchema = z.object({
  learningObjectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

export const TargetStudentsForm = ({
  initialData,
  courseId,
}: TargetStudentsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { updateCourse, isUpdating } = useCourseMutation();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      learningObjectives: initialData.learningObjectives || [],
      requirements: initialData.requirements || [],
      targetAudience: initialData.targetAudience || [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      await updateCourse({
        id: courseId,
        data: {
          learningObjectives: values.learningObjectives.filter(
            (t) => t.trim() !== "",
          ),
          requirements: values.requirements.filter((t) => t.trim() !== ""),
          targetAudience: values.targetAudience.filter((t) => t.trim() !== ""),
        },
      });
      toast.success("Target student criteria updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update target student criteria");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4 space-y-6">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600" />
          <span>Target Students & Learning Objectives</span>
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
              Edit Criteria
            </>
          )}
        </Button>
      </div>

      {!isEditing ? (
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              What will students learn?
            </h4>
            {initialData.learningObjectives?.length ? (
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                {initialData.learningObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic text-xs">
                No learning objectives set.
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-amber-600" />
              Requirements & Prerequisites
            </h4>
            {initialData.requirements?.length ? (
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                {initialData.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic text-xs">
                No prerequisites specified.
              </p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              Who is this course for?
            </h4>
            {initialData.targetAudience?.length ? (
              <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
                {initialData.targetAudience.map((aud, i) => (
                  <li key={i}>{aud}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic text-xs">
                No target audience specified.
              </p>
            )}
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormTags
              control={form.control}
              name="learningObjectives"
              label="What will students learn in your course?"
              placeholder="Type an objective and press Enter or comma..."
            />

            <FormTags
              control={form.control}
              name="requirements"
              label="Requirements / Prerequisites"
              placeholder="Type a requirement and press Enter or comma..."
            />

            <FormTags
              control={form.control}
              name="targetAudience"
              label="Who is this course for?"
              placeholder="Type a target audience and press Enter or comma..."
            />

            <div className="flex items-center gap-2 pt-2">
              <Button disabled={isUpdating} type="submit" size="sm">
                Save Target Criteria
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
