import { forwardRef, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import "quill/dist/quill.bubble.css";
import "./editor.css";

interface CustomEditorProps {
  value?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

const EditorQuill = forwardRef<Quill, CustomEditorProps>(
  (
    {
      value = "",
      onChange,
      readOnly = false,
      placeholder = "Write something...",
    },
    ref
  ) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<Quill | null>(null);
    const [editorId] = useState(
      `quill-editor-${Math.random().toString(36).substring(2, 9)}`
    );

    useEffect(() => {
      const destroyQuill = () => {
        if (quillRef.current) {
          quillRef.current = null;
        }
        document
          .querySelectorAll(".ql-toolbar")
          .forEach((toolbar) => toolbar.remove());
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
          const editorElement = document.createElement("div");
          editorElement.id = editorId;
          editorRef.current.appendChild(editorElement);
          return editorElement;
        }
        return null;
      };

      const editorElement = destroyQuill();
      if (!editorElement) return;

      const modules = {
        toolbar: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
        ],
      };

      const quill = new Quill(editorElement, {
        theme: readOnly ? "bubble" : "snow",
        modules,
        placeholder,
        readOnly,
      });
      quillRef.current = quill;

      quill.on("text-change", () => {
        if (onChange) {
          onChange(quill.root.innerHTML);
        }
      });

      return () => {
        destroyQuill();
      };
    }, [placeholder, readOnly, editorId, onChange]);

    // Add this useEffect to handle value changes
    useEffect(() => {
      if (quillRef.current && quillRef.current.root.innerHTML !== value) {
        quillRef.current.root.innerHTML = value;
      }
    }, [value]);

    return <div ref={editorRef} className="custom-editor-container"></div>;
  }
);
EditorQuill.displayName = "EditorQuill";
export default EditorQuill;
