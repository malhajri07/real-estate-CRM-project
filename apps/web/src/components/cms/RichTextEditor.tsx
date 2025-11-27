/**
 * RichTextEditor.tsx - Rich Text Editor Component
 * 
 * Location: apps/web/src/ → Components/ → CMS Components → RichTextEditor.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Rich text editor component using React Quill. Provides:
 * - WYSIWYG text editing
 * - Rich text formatting
 * - HTML content editing
 * 
 * Related Files:
 * - apps/web/src/pages/admin/articles-management.tsx - Uses this editor
 * - apps/web/src/pages/admin/cms-landing/ - CMS landing editor uses this
 */

import { useEffect, useRef } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "اكتب المحتوى هنا...",
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    // Inject custom styles for RTL support
    const style = document.createElement("style");
    style.textContent = `
      .rich-text-editor .ql-container {
        font-family: inherit;
        font-size: 14px;
        min-height: 300px;
      }
      .rich-text-editor .ql-editor {
        min-height: 300px;
        direction: rtl;
        text-align: right;
      }
      .rich-text-editor .ql-toolbar {
        border-top-right-radius: 0.375rem;
        border-top-left-radius: 0.375rem;
        border-bottom: 1px solid #e5e7eb;
      }
      .rich-text-editor .ql-container {
        border-bottom-right-radius: 0.375rem;
        border-bottom-left-radius: 0.375rem;
      }
      .rich-text-editor .ql-editor.ql-blank::before {
        right: 15px;
        left: auto;
        font-style: normal;
        color: #9ca3af;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const modules = {
    toolbar: readOnly
      ? false
      : [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["link", "image"],
          ["blockquote", "code-block"],
          [{ color: [] }, { background: [] }],
          ["clean"],
        ],
    clipboard: {
      matchVisual: false,
    },
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "align",
    "link",
    "image",
    "blockquote",
    "code-block",
    "color",
    "background",
  ];

  return (
    <div className={cn("rich-text-editor", className)} dir="rtl">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </div>
  );
}

