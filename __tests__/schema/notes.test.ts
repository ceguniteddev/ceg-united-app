import { describe, it, expect } from "vitest";
import { noteSchema } from "@/schema/notes";

describe("noteSchema", () => {
  const validComment = {
    id: "comment-1",
    author: "Jane Doe",
    authorEmail: "jane@example.com",
    text: "This is a comment",
    createdAt: new Date("2024-01-01T10:00:00Z"),
  };

  it("should accept a valid note with no description and no comments", () => {
    const result = noteSchema.safeParse({ comments: [] });
    expect(result.success).toBe(true);
  });

  it("should accept a note with a description", () => {
    const result = noteSchema.safeParse({
      description: "Some description",
      comments: [],
    });
    expect(result.success).toBe(true);
  });

  it("should accept a note with valid comments", () => {
    const result = noteSchema.safeParse({
      comments: [validComment],
    });
    expect(result.success).toBe(true);
  });

  it("should accept multiple valid comments", () => {
    const result = noteSchema.safeParse({
      comments: [
        validComment,
        { ...validComment, id: "comment-2", text: "Another comment" },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("should reject a comment missing author", () => {
    const { author, ...rest } = validComment;
    const result = noteSchema.safeParse({ comments: [rest] });
    expect(result.success).toBe(false);
  });

  it("should reject a comment with empty author", () => {
    const result = noteSchema.safeParse({
      comments: [{ ...validComment, author: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("should reject a comment with empty authorEmail", () => {
    const result = noteSchema.safeParse({
      comments: [{ ...validComment, authorEmail: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("should reject a comment with empty text", () => {
    const result = noteSchema.safeParse({
      comments: [{ ...validComment, text: "" }],
    });
    expect(result.success).toBe(false);
  });

  it("should coerce createdAt from ISO string to Date", () => {
    const result = noteSchema.safeParse({
      comments: [{ ...validComment, createdAt: "2024-01-01T10:00:00Z" }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comments[0].createdAt).toBeInstanceOf(Date);
    }
  });

  it("should reject missing comments field", () => {
    const result = noteSchema.safeParse({ description: "test" });
    expect(result.success).toBe(false);
  });
});
