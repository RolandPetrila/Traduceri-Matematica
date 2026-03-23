"use client";

import { useCallback, useState, useRef } from "react";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const MAX_FILES = 10;
const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      const dropped = Array.from(e.dataTransfer.files)
        .filter((f) => ACCEPTED.includes(f.type))
        .slice(0, MAX_FILES);
      if (dropped.length > 0) {
        onFilesChange(dropped);
      }
    },
    [onFilesChange]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, MAX_FILES);
    onFilesChange(selected);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        className={`drop-zone cursor-pointer ${isDragging ? "active" : ""}`}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf,.docx"
          className="hidden"
          onChange={handleSelect}
        />
        <p className="text-3xl mb-2 opacity-40">&#x1F4F7;</p>
        <p className="text-lg">
          Trage fotografiile aici sau click pentru selectie
        </p>
        <p className="text-sm opacity-50 mt-1">
          JPG, PNG, PDF sau DOCX &mdash; maxim {MAX_FILES} fisiere
        </p>
      </div>

      {files.length > 0 && (
        <div className="mt-3 space-y-1">
          {files.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between bg-white/5 rounded px-3 py-2"
            >
              <span className="text-sm truncate">
                &#x1F4C4; {f.name}{" "}
                <span className="opacity-50">
                  ({(f.size / 1024).toFixed(0)} KB)
                </span>
              </span>
              <button
                onClick={() => removeFile(i)}
                className="text-chalk-red hover:opacity-80 ml-2"
              >
                &#x2715;
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
