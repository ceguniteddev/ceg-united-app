import z from "zod";

export const MuxSchema = z.object({
  id: z.string().optional(),
  assetId: z.string(),
  playbackId: z.string().optional(),
  chapterId: z.string(),
});
export type MuxData = z.infer<typeof MuxSchema>;

export const ChapterSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  position: z.number().int(),
  isPublished: z.boolean().default(false),
  courseId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  muxData: MuxSchema.optional().nullish(),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const AttachmentSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  name: z.string(),
  courseId: z.string(),
  createdAt: z.date(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  imageUrl: z.string().min(1, "Required"),
  category: z.string().min(1, "Required"),
  isPublished: z.boolean().default(false),
  chapters: z.array(ChapterSchema).optional(),
  attachments: z.array(AttachmentSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Course = z.infer<typeof courseSchema>;

export const ChapterModel = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  videoUrl: z.string().nullish(),
  position: z.number().int(),
  isPublished: z.boolean(),
  isFree: z.boolean(),
  courseId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MuxDataModel = z.object({
  id: z.string(),
  assetId: z.string(),
  playbackId: z.string().nullish(),
  chapterId: z.string(),
});

export interface CompleteMuxData extends z.infer<typeof MuxDataModel> {
  chapter: CompleteChapter;
}

// export const RelatedMuxDataModel: z.ZodSchema<CompleteMuxData> = z.lazy(() =>
//   MuxDataModel.extend({
//     chapter: RelatedChapterModel,
//   })
// );

export const UserProgressModel = z.object({
  id: z.string(),
  userId: z.string(),
  chapterId: z.string(),
  isCompleted: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export interface CompleteUserProgress
  extends z.infer<typeof UserProgressModel> {
  chapter: CompleteChapter;
}

// export const RelatedUserProgressModel: z.ZodSchema<CompleteUserProgress> =
//   z.lazy(() =>
//     UserProgressModel.extend({
//       chapter: RelatedChapterModel,
//     })
//   );

export interface CompleteChapter extends z.infer<typeof ChapterModel> {
  muxData?: CompleteMuxData | null;
  course: Course;
  userProgress: CompleteUserProgress[];
}

// export const RelatedChapterModel: z.ZodSchema<CompleteChapter> = z.lazy(() =>
//   ChapterModel.extend({
//     muxData: RelatedMuxDataModel.nullish(),
//     course: RelatedCourseModel,
//     userProgress: RelatedUserProgressModel.array(),
//   })
// );

export const MuxDataSchema = z.object({
  id: z.string(),
  assetId: z.string(),
  playbackId: z.string().optional(),
  chapterId: z.string(),
});

export const UserProgressSchema = z.object({
  id: z.string(),
  userId: z.string(),
  chapterId: z.string(),
  isCompleted: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserProgress = z.infer<typeof UserProgressSchema>;

// Course enrollment tracking
export const UserCourseEnrollmentSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  courseId: z.string(),
  enrolledAt: z.date(),
  lastAccessedAt: z.date().optional(),
  completedAt: z.date().optional(),
  progressPercentage: z.number().min(0).max(100).default(0),
});

export type UserCourseEnrollment = z.infer<typeof UserCourseEnrollmentSchema>;

// Extended course type with progress
export interface CourseWithProgress extends Course {
  enrollment?: UserCourseEnrollment;
  completedChapters?: number;
  totalChapters?: number;
  userProgress?: UserProgress[];
}
