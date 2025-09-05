"use client";
import { MinimalTiptap } from "@/components/ui/shadcn-io/minimal-tiptap";
import { useState } from "react";

type Props = {
  content: string;
  setContent: (content: string) => void;
};
export default function Editor({ content, setContent }: Props) {
  return (
    <div className="size-full flex items-center justify-center p-4 items-start">
      <div className="w-full max-w-4xl">
        <MinimalTiptap
          content={content}
          onChange={setContent}
          placeholder="Start typing your content here..."
          className="h-full"
        />
      </div>
    </div>
  );
}
