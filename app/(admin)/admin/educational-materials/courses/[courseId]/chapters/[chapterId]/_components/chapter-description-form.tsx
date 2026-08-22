"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Pencil, Save } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { Form } from "@/components/ui/form";
import { FormTextarea } from "@/components/forms/form-textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Chapter } from "@/schema/educational-materials/course";
import { toast } from "sonner";
import { useChapterMutation } from "@/hooks/educational-materials/chapter";

interface ChapterDescriptionFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

const formSchema = z.object({
  description: z.string().min(1),
});

export const ChapterDescriptionForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterDescriptionFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { updateChapter, isUpdating } = useChapterMutation();
  const toggleEdit = () => setIsEditing((current) => !current);

  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: initialData?.description || "",
    },
  });

  const { isSubmitting, isValid } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // await axios.patch(
      //   `/api/courses/${courseId}/chapters/${chapterId}`,
      //   values
      // );
      await updateChapter({
        courseId,
        chapterId,
        data: { description: values.description },
      });
      toast.success("Chapter updated");
      toggleEdit();
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        Chapter description
        <Button onClick={toggleEdit} variant="ghost" className="cursor-pointer">
          {isEditing ? (
            <>Cancel</>
          ) : (
            <>
              <Pencil className="h-4 w-4 mr-2" />
              Edit description
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <div
          className={cn(
            "text-sm mt-2",
            !initialData.description && "text-slate-500 italic",
          )}
        >
          {!initialData.description && "No description"}
          {initialData.description && (
            <EditorQuill
              value={initialData.description}
              readOnly
              placeholder=""
            />
          )}
        </div>
      )}
      {isEditing && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-4"
          >
            <FormTextarea
              control={form.control}
              name="description"
              label="Chapter Description"
              placeholder="e.g. In this lesson, we will cover..."
              rows={4}
              required
            />
            <div className="flex items-center mt-4">
              <Button
                disabled={!isValid || isSubmitting}
                size="sm"
                type="submit"
              >
                <Save className="h-4 w-4 mr-1" />
                Save Description
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
};
