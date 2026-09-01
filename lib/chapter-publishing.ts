import type { Chapter } from "@/schema/educational-materials/course";

export type ChapterPublishField =
  | "title"
  | "video"
  | "article content"
  | "quiz questions";

const hasText = (value: string | null | undefined) =>
  typeof value === "string" && value.trim().length > 0;

export const getMissingChapterPublishFields = (
  chapter: Partial<Chapter>,
): ChapterPublishField[] => {
  const missingFields: ChapterPublishField[] = [];

  if (!hasText(chapter.title)) {
    missingFields.push("title");
  }

  switch (chapter.type ?? "video") {
    case "article":
      if (!hasText(chapter.articleContentHtml)) {
        missingFields.push("article content");
      }
      break;
    case "quiz":
      if (!chapter.quiz?.questions?.length) {
        missingFields.push("quiz questions");
      }
      break;
    case "video":
      if (
        !hasText(chapter.videoUrl) ||
        !chapter.muxData?.assetId ||
        !chapter.muxData?.playbackId
      ) {
        missingFields.push("video");
      }
      break;
  }

  return missingFields;
};

export const isChapterPublishable = (chapter: Partial<Chapter>) =>
  getMissingChapterPublishFields(chapter).length === 0;
