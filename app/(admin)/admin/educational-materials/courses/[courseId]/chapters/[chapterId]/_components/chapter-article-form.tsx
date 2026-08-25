"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Pencil, FileText } from "lucide-react";
import { toast } from "sonner";
import { useChapterMutation } from "@/hooks/educational-materials/chapter";
import { Chapter } from "@/schema/educational-materials/course";

const EditorQuill = dynamic(() => import("@/components/editor/EditorQuill"), {
  ssr: false,
});

interface ChapterArticleFormProps {
  initialData: Chapter;
  courseId: string;
  chapterId: string;
}

export const ChapterArticleForm = ({
  initialData,
  courseId,
  chapterId,
}: ChapterArticleFormProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(
    initialData.articleContentHtml || initialData.description || "",
  );

  const { updateChapter, isUpdating } = useChapterMutation();
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateChapter({
        courseId,
        chapterId,
        data: {
          articleContentHtml: content,
        },
      });
      toast.success("Article content saved");
      setIsEditing(false);
      router.refresh();
    } catch {
      toast.error("Failed to save article content");
    }
  };

  return (
    <div className="mt-6 border bg-slate-100 dark:bg-slate-900 rounded-md p-4">
      <div className="font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>Article & Reading Material</span>
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
              Edit Article
            </>
          )}
        </Button>
      </div>

      {!isEditing && (
        <div className="mt-3 text-sm">
          {initialData.articleContentHtml ? (
            <div
              className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 line-clamp-6 bg-white dark:bg-slate-950 p-4 rounded border"
              dangerouslySetInnerHTML={{
                __html: initialData.articleContentHtml,
              }}
            />
          ) : (
            <p className="text-gray-400 italic text-xs">
              No article content provided yet. Click edit to write rich text
              content.
            </p>
          )}
        </div>
      )}

      {isEditing && (
        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="bg-white dark:bg-slate-950 rounded-md overflow-hidden border">
            <EditorQuill
              value={content}
              onChange={(val) => setContent(val)}
              className="min-h-[220px]"
            />
          </div>

          <div className="flex items-center gap-x-2">
            <Button disabled={isUpdating} type="submit" size="sm">
              Save Article
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
