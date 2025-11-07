// components/QuillPreview.tsx
"use client";

import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.bubble.css";

interface PreviewProps {
  value: string;
}

const QuillPreview: React.FC<PreviewProps> = ({ value }) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<Quill | null>(null);

  // Initialize the Quill instance in read-only mode
  useEffect(() => {
    if (previewRef.current && !quillInstance.current) {
      quillInstance.current = new Quill(previewRef.current, {
        theme: "bubble",
        readOnly: true,
        // Disable the toolbar for a pure preview experience
        modules: {
          toolbar: false,
        },
      });
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  // Load the content into the editor when the `value` prop changes
  useEffect(() => {
    if (quillInstance.current && value) {
      // Use setContents to programmatically update the editor
      const delta = quillInstance.current.clipboard.convert({ text: value });
      quillInstance.current.setContents(delta, "silent");
    }
  }, [value]);

  return <div ref={previewRef} className="quill-preview" />;
};

export default QuillPreview;
