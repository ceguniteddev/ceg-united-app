import { describe, expect, it } from "vitest";

import {
  getMissingChapterPublishFields,
  isChapterPublishable,
} from "@/lib/chapter-publishing";

describe("chapter publishing requirements", () => {
  it("accepts a ready video chapter without requiring a description", () => {
    const chapter = {
      title: "Video lecture",
      type: "video" as const,
      videoUrl: "https://stream.mux.com/playback.m3u8",
      muxData: {
        assetId: "asset-1",
        playbackId: "playback-1",
        chapterId: "chapter-1",
      },
    };

    expect(getMissingChapterPublishFields(chapter)).toEqual([]);
    expect(isChapterPublishable(chapter)).toBe(true);
  });

  it("requires complete Mux data for a video chapter", () => {
    const chapter = {
      title: "Video lecture",
      type: "video" as const,
      videoUrl: "https://stream.mux.com/playback.m3u8",
      muxData: {
        assetId: "asset-1",
        chapterId: "chapter-1",
      },
    };

    expect(getMissingChapterPublishFields(chapter)).toEqual(["video"]);
  });

  it("accepts an article without video fields", () => {
    const chapter = {
      title: "Article lecture",
      type: "article" as const,
      articleContentHtml: "<p>Useful content</p>",
    };

    expect(isChapterPublishable(chapter)).toBe(true);
  });

  it("accepts a quiz without video fields", () => {
    const chapter = {
      title: "Quiz lecture",
      type: "quiz" as const,
      quiz: {
        passingScorePercentage: 70,
        questions: [
          {
            id: "question-1",
            question: "What is credit utilization?",
            options: ["A ratio", "A fee"],
            correctAnswerIndex: 0,
          },
        ],
      },
    };

    expect(isChapterPublishable(chapter)).toBe(true);
  });

  it("reports the type-specific missing field", () => {
    expect(
      getMissingChapterPublishFields({ title: " ", type: "article" }),
    ).toEqual(["title", "article content"]);
    expect(
      getMissingChapterPublishFields({ title: "Quiz", type: "quiz" }),
    ).toEqual(["quiz questions"]);
  });
});
