export interface Language {
  code: string;
  name: string;
  flag: string;
  can_be_source: boolean;
  can_be_target: boolean;
}

export interface TranslationRequest {
  files: File[];
  source_lang: string;
  target_lang: string;
}

export interface TranslationResult {
  id: string;
  html: string;
  markdown: string;
  pages: number;
  source_lang: string;
  target_lang: string;
  created_at: string;
  duration_ms: number;
  status: "success" | "error" | "partial";
  error?: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  files: string[];
  source_lang: string;
  target_lang: string;
  status: "success" | "error" | "partial";
  duration_ms: number;
  pages: number;
  html?: string;
}

export interface DictEntry {
  source: string;
  target: string;
  domain: string;
}

export interface ConversionRequest {
  files: File[];
  operation: "convert" | "merge" | "split" | "compress" | "edit-pdf";
  target_format?: string;
  options?: Record<string, unknown>;
}
