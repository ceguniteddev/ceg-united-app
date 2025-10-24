import z from "zod";

const commentSchema = z.object({
  id: z.string(),
  author: z.string().min(1, { error: "Required" }),
  //   avatar: z.string().optional(),
  authorEmail: z.string().min(1, { error: "Required" }),
  text: z.string().min(1, { error: "Required" }),
  createdAt: z.coerce.date<Date>(),
});

export const noteSchema = z.object({
  description: z.string().optional(),
  comments: z.array(commentSchema),
});

export type NoteSchema = z.infer<typeof noteSchema>;
export type Comment = z.infer<typeof commentSchema>;

// The subcollection and document ID for our notes
