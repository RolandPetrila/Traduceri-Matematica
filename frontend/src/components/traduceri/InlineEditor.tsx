"use client";

import { useRef, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface InlineEditorProps {
  html: string;
  onChange: (html: string) => void;
}

/**
 * WYSIWYG inline editor: text is editable, images/SVG are protected (non-editable).
 * Uses contentEditable with MutationObserver to track changes.
 */
export default function InlineEditor({ html, onChange }: InlineEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  // Extract body/main content from full HTML document
  function extractContent(fullHtml: string): string {
    const mainMatch = fullHtml.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) return mainMatch[1];
    const bodyMatch = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) return bodyMatch[1];
    return fullHtml;
  }

  useEffect(() => {
    if (!containerRef.current || isUpdatingRef.current) return;
    containerRef.current.innerHTML = sanitizeHtml(extractContent(html));
    protectNonEditableElements(containerRef.current);
  }, [html]);

  function protectNonEditableElements(container: HTMLElement) {
    // Make images and SVGs non-editable
    container.querySelectorAll("img, svg, .figure-container").forEach((el) => {
      (el as HTMLElement).contentEditable = "false";
      (el as HTMLElement).style.outline = "2px dashed rgba(0,0,0,0.1)";
      (el as HTMLElement).style.borderRadius = "4px";
      (el as HTMLElement).title = "Figura protejata (needitabila)";
    });
  }

  function handleInput() {
    if (!containerRef.current) return;
    isUpdatingRef.current = true;

    // Rebuild the full HTML with edited content
    const editedContent = containerRef.current.innerHTML;
    const headMatch = html.match(/([\s\S]*?<main[^>]*>)/i);
    const tailMatch = html.match(/(<\/main>[\s\S]*$)/i);

    const newHtml = headMatch && tailMatch
      ? headMatch[1] + editedContent + tailMatch[1]
      : editedContent;

    onChange(newHtml);
    isUpdatingRef.current = false;
  }

  return (
    <div
      ref={containerRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      className="bg-white text-gray-900 p-6 rounded-lg min-h-[500px] prose prose-sm max-w-none focus:outline-none focus:ring-2 focus:ring-chalk-yellow/50"
      style={{ fontFamily: '"Cambria", "Times New Roman", serif', fontSize: "12pt", lineHeight: 1.45 }}
    />
  );
}
