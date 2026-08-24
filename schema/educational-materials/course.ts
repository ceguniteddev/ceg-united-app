import z from "zod";

export const MuxSchema = z.object({
  id: z.string().optional(),
  assetId: z.string(),
  playbackId: z.string().optional(),
  chapterId: z.string(),
  durationSeconds: z.number().optional(),
});
export type MuxData = z.infer<typeof MuxSchema>;

export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question is required"),
  options: z
    .array(z.string().min(1, "Option cannot be empty"))
    .min(2, "At least 2 options required"),
  correctAnswerIndex: z.number().int().min(0),
  explanation: z.string().optional(),
});
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const QuizSchema = z.object({
  questions: z.array(QuizQuestionSchema).default([]),
  passingScorePercentage: z.number().min(0).max(100).default(70),
});
export type Quiz = z.infer<typeof QuizSchema>;

export const LectureTypeEnum = z.enum(["video", "article", "quiz"]);
export type LectureType = z.infer<typeof LectureTypeEnum>;

export const AttachmentSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  name: z.string(),
  courseId: z.string(),
  chapterId: z.string().optional(),
  fileSizeBytes: z.number().optional(),
  createdAt: z.date(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const ChapterSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().optional(),
  position: z.number().int(),
  isPublished: z.boolean().default(false),
  isFree: z.boolean().default(false),
  isFreePreview: z.boolean().default(false),
  type: LectureTypeEnum.default("video"),
  sectionId: z.string().optional(),
  courseId: z.string(),
  articleContentHtml: z.string().optional(),
  quiz: QuizSchema.optional(),
  durationMinutes: z.number().optional(),
  attachments: z.array(AttachmentSchema).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  muxData: MuxSchema.optional().nullish(),
});
export type Chapter = z.infer<typeof ChapterSchema>;
export type Lecture = Chapter; // Alias for Udemy terminology

export const SectionSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Section title is required"),
  description: z.string().optional(),
  position: z.number().int().default(0),
  courseId: z.string(),
  isPublished: z.boolean().default(true),
  chapters: z.array(ChapterSchema).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type Section = z.infer<typeof SectionSchema>;

export const InstructorSchema = z.object({
  name: z.string().default("CEG United Instructor"),
  title: z.string().default("Senior Financial & Credit Strategist"),
  bio: z.string().optional(),
  avatarUrl: z.string().optional(),
});
export type Instructor = z.infer<typeof InstructorSchema>;

export const CourseLevelEnum = z.enum([
  "All Levels",
  "Beginner",
  "Intermediate",
  "Advanced",
]);
export type CourseLevel = z.infer<typeof CourseLevelEnum>;

export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  imageUrl: z.string().min(1, "Thumbnail is required"),
  promoVideoPlaybackId: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  level: CourseLevelEnum.default("All Levels"),
  language: z.string().default("English"),
  instructor: InstructorSchema.default({
    name: "CEG United Instructor",
    title: "Senior Financial Strategist",
  }),
  // Udemy-style value proposition
  learningObjectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  targetAudience: z.array(z.string()).default([]),

  // Pricing and Monetization
  isFree: z.boolean().default(false),
  price: z.number().min(0).default(0), // in USD (e.g. 49.99)
  discountPrice: z.number().min(0).optional(),
  dodoProductId: z.string().optional(),
  luminoCheckoutUrl: z.string().optional(),

  // Publishing & Metrics
  isPublished: z.boolean().default(false),
  sections: z.array(SectionSchema).optional(),
  chapters: z.array(ChapterSchema).optional(),
  attachments: z.array(AttachmentSchema).optional(),

  averageRating: z.number().default(5.0),
  totalRatingsCount: z.number().default(0),
  enrolledStudentsCount: z.number().default(0),
  totalDurationSeconds: z.number().default(0),

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

export interface CompleteUserProgress extends z.infer<
  typeof UserProgressModel
> {
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
  dodoPaymentId: z.string().optional(),
  receiptUrl: z.string().optional(),
  amountPaid: z.number().optional(),
  certificateId: z.string().optional(),
});

export type UserCourseEnrollment = z.infer<typeof UserCourseEnrollmentSchema>;

// Course Reviews
export const CourseReviewSchema = z.object({
  id: z.string().optional(),
  courseId: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1, "Comment is required"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type CourseReview = z.infer<typeof CourseReviewSchema>;

// Course Student Notes
export const CourseNoteSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  courseId: z.string(),
  chapterId: z.string(),
  timestampSeconds: z.number().default(0),
  content: z.string().min(1, "Note content cannot be empty"),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type CourseNote = z.infer<typeof CourseNoteSchema>;

// Course Q&A
export const CourseQAAnswerSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  isInstructor: z.boolean().default(false),
  content: z.string(),
  createdAt: z.date(),
});
export type CourseQAAnswer = z.infer<typeof CourseQAAnswerSchema>;

export const CourseQASchema = z.object({
  id: z.string().optional(),
  courseId: z.string(),
  chapterId: z.string().optional(),
  userId: z.string(),
  userName: z.string(),
  userAvatar: z.string().optional(),
  title: z.string(),
  content: z.string(),
  answers: z.array(CourseQAAnswerSchema).default([]),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
export type CourseQA = z.infer<typeof CourseQASchema>;

// Extended course type with progress
export interface CourseWithProgress extends Course {
  enrollment?: UserCourseEnrollment;
  completedChapters?: number;
  totalChapters?: number;
  userProgress?: UserProgress[];
  reviews?: CourseReview[];
}
