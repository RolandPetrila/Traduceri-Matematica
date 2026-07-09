"use client";

import { useCallback, useState, useRef } from "react";
import { logAction } from "@/lib/monitoring";

interface FileUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

const MAX_FILES = 10;
const MAX_SIZE = 4 * 1024 * 1024; // 4MB — safe limit for the serverless function body
// OCR reads IMAGES (PDFs are rasterized in the browser). Word .docx cannot be
// rasterized/OCR-ed, so it is NOT accepted here — a clear message tells the user
// to save it as PDF (see isDocx below). File conversion for .docx lives in the
// separate Convertor module.
const ACCEPTED_MIMES = ["image/jpeg", "image/png", "application/pdf"];
const ACCEPTED_EXTS = [".jpg", ".jpeg", ".png", ".pdf"];
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function isDocx(file: File): boolean {
  return file.type === DOCX_MIME || file.name.toLowerCase().endsWith(".docx");
}

function isAccepted(file: File): boolean {
  if (ACCEPTED_MIMES.includes(file.type)) return true;
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return ACCEPTED_EXTS.includes(ext);
}

function validateFiles(files: File[]): { valid: File[]; errors: string[] } {
  const errors: string[] = [];
  const valid = files.filter((f) => {
    if (isDocx(f)) {
      errors.push(
        `${f.name}: documentele Word (.docx) nu pot fi citite de OCR. Salvează-l ca PDF (în Word: Fișier → Salvare ca → PDF, sau Tipărire → „Microsoft Print to PDF") și încarcă PDF-ul.`,
      );
      return false;
    }
    if (!isAccepted(f)) {
      errors.push(`${f.name}: format nesuportat (acceptate: JPG, PNG, PDF)`);
      return false;
    }
    if (f.size > MAX_SIZE) {
      errors.push(
        `${f.name}: depaseste limita de 4MB (${(f.size / 1024 / 1024).toFixed(1)}MB)`,
      );
      return false;
    }
    return true;
  });
  return { valid: valid.slice(0, MAX_FILES), errors };
}

export default function FileUpload({ files, onFilesChange }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const dragCounter = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      const { valid, errors } = validateFiles(Array.from(e.dataTransfer.files));
      setFileErrors(errors);
      if (valid.length > 0) {
        logAction("Fisiere selectate (drag&drop)", {
          count: valid.length,
          names: valid.map((f) => f.name),
          sizes: valid.map((f) => `${(f.size / 1024).toFixed(0)}KB`),
          types: valid.map((f) => f.type),
        });
        onFilesChange(valid);
      }
    },
    [onFilesChange],
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
    const { valid, errors } = validateFiles(Array.from(e.target.files || []));
    setFileErrors(errors);
    if (valid.length > 0) {
      logAction("Fisiere selectate (click)", {
        count: valid.length,
        names: valid.map((f) => f.name),
        sizes: valid.map((f) => `${(f.size / 1024).toFixed(0)}KB`),
        types: valid.map((f) => f.type),
      });
    }
    onFilesChange(valid);
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
          accept=".jpg,.jpeg,.png,.pdf"
          className="hidden"
          onChange={handleSelect}
        />
        <p className="text-3xl mb-2 opacity-40">&#x1F4F7;</p>
        <p className="text-lg">
          Trage fotografiile aici sau click pentru selectie
        </p>
        <p className="text-sm opacity-50 mt-1">
          JPG, PNG sau PDF &mdash; maxim {MAX_FILES} fisiere, 4MB/fisier
          <br />
          <span className="opacity-70">
            (Word .docx? Salvează-l întâi ca PDF)
          </span>
        </p>
      </div>

      {fileErrors.length > 0 && (
        <div
          className="mt-2 p-3 rounded-lg"
          style={{
            background: "rgba(232, 131, 107, 0.15)",
            border: "1px solid var(--chalk-red)",
          }}
        >
          {fileErrors.map((err, i) => (
            <p key={i} className="text-sm text-chalk-red">
              {err}
            </p>
          ))}
        </div>
      )}

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
