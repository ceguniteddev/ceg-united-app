"use client";

import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { FormSelect } from "@/components/forms/form-select";
import { FormCheckbox } from "@/components/forms/form-checkbox";
import { Pencil, Eye, Layout } from "lucide-react";
import { toast } from "sonner";
import { useChapterMutation } from "@/hooks/educational-materials/chapter";
import { Chapter, LectureType } from "@/schema/educational-materials/course";

interface ChapterTypeFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  type: z.enum(["video", "article", "quiz"]),
  isFreePreview: z.boolean().default(false),
});

const typeOptions = [
  { value: "video", label: "Video (Mux Streaming)" },
  { value: "article", label: "Rich Text / Article" },
  { value: "quiz", label: "Interactive Quiz" },
];

export const ChapterTypeForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterTypeFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { updateChapter, isUpdating } = useChapterMutation();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      type: (initialData.type as LectureType) || "video",
      isFreePreview: Boolean(initialData.isFreePreview),
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateChapter({
        courseId,
        chapterId,
        data: {
          type: values.type,
          isFreePreview: values.isFreePreview,
        },
      });
      toast.success("Lecture type and preview settings updated");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to update lecture settings");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layout className="w-4 h-4 text-blue-600" />
          <span>Lecture Type & Preview Access</span>
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
              Edit
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">Format:</span>
            <span className="capitalize font-semibold text-gray-900 dark:text-gray-100 px-2 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-xs">
              {initialData.type || "video"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-600" />
            <span className="text-gray-700 dark:text-gray-300">
              {initialData.isFreePreview
                ? "Free Preview enabled (accessible before purchase)"
                : "Locked (requires course purchase or enrollment)"}
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
            <FormSelect
              control={form.control}
              name="type"
              label="Content Format"
              options={typeOptions}
              placeholder="Select format"
            />

            <div className="pt-2">
              <FormCheckbox
                control={form.control}
                name="isFreePreview"
                label="Enable Free Preview (Clients can view this lecture without buying)"
              />
            </div>

            <div className="flex items-center gap-x-2 pt-2">
              <Button disabled={isUpdating} type="submit" size="sm">
                Save Settings
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
