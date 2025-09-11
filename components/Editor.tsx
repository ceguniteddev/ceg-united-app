import { Editor } from "@tinymce/tinymce-react";
import React, { useRef } from "react";
import * as tinymce from "tinymce";

interface TinyEditorProps {
  onContentChange: (content: string) => void;
  content?: string;
  enrichData?: (value: string) => string;
  onSaveCallback?: (content?: string) => void;
}

const plugins = [
  "autosave",
  "charmap",
  "directionality",
  "emoticons",
  "fullscreen",
  "image",
  "insertdatetime",
  "lists",
  "nonbreaking",
  "pagebreak",
  "preview",
  "searchreplace",
  "table",
  "visualblocks",
  "visualchars",
  "link",
];

const toolbar = [
  "blocks fontfamily fontsizeinput | casechange forecolor bold italic underline strikethrough | alignleft aligncenter alignright alignjustify ",
  "numlist bullist outdent indent | table removeformat | undo redo | pastetext pagebreak | link",
];

const EmailTemplateEditor: React.FC<TinyEditorProps> = ({
  onContentChange,
  content,
  onSaveCallback,
}) => {
  const editorRef = useRef<tinymce.Editor | null>(null);

  if (onSaveCallback) {
    plugins.push("save");
    toolbar[0] = `save ${toolbar[0].trim()}`;
  }
  return (
    <div>
      <Editor
        onInit={(_evt, editor) => {
          editorRef.current = editor;
        }}
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        onEditorChange={(newValue, editor) => {
          onContentChange(editor.getContent({ format: "html" }));
        }}
        value={content}
        init={{
          // save_onsavecallback: () => onSaveCallback?.(content),
          // save_onsavecallback: () => {
          //   const html = editorRef.current?.getContent({ format: "html" });
          //   onSaveCallback?.(html);
          // },
          save_oncancelcallback: () => console.log("Save cancelled"),
          save_enablewhendirty: false,
          // init_instance_callback(editor) {
          //   const dialogContainer = document.getElementById("dialog-form");
          //   if (dialogContainer) {
          //     const auxElements = document.querySelectorAll("body > .tox-tinymce-aux");
          //     if (auxElements.length) dialogContainer.append(auxElements[auxElements.length - 1]);
          //   }
          // },
          height: 700,
          menubar: false,
          statusbar: false,
          promotion: false,
          resize: true,
          // toolbar_sticky: true,
          branding: false,

          plugins: plugins,

          toolbar: toolbar,
          width: "auto",
          content_css: "document",
        }}
      />
    </div>
  );
};

export default EmailTemplateEditor;
