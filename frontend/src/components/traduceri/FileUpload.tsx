"use client";

import { useCallback } from "react";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const MAX_FILES = 10;
const ACCEPTED = ["image/jpeg", "image/png", "application/pdf"];

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const dropped = Array.from(e.dataTransfer.files)
        .filter((f) => ACCEPTED.includes(f.type))
        .slice(0, MAX_FILES);
      onFilesChange(dropped);
    },
    [onFilesChange]
  );

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
        onDragOver={(e) => e.preventDefault()}
        className="drop-zone cursor-pointer"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleSelect}
        />
        <p className="text-3xl mb-2 opacity-40">&#x1F4F7;</p>
        <p className="text-lg">
          Trage fotografiile aici sau click pentru selectie
        </p>
        <p className="text-sm opacity-50 mt-1">
          JPG, PNG sau PDF &mdash; maxim {MAX_FILES} fisiere
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
