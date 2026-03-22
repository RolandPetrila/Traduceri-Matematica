const API_BASE = "/api";

export async function translateFiles(
  files: File[],
  sourceLang: string,
  targetLang: string
): Promise<Response> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  formData.append("source_lang", sourceLang);
  formData.append("target_lang", targetLang);

  return fetch(`${API_BASE}/translate`, {
    method: "POST",
    body: formData,
  });
}

export async function convertFiles(
  files: File[],
  operation: string,
  targetFormat: string
): Promise<Response> {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  formData.append("operation", operation);
  formData.append("target_format", targetFormat);

  return fetch(`${API_BASE}/convert`, {
    method: "POST",
    body: formData,
  });
}

export async function fetchHistory(): Promise<Response> {
  return fetch(`${API_BASE}/history`);
}

export async function deleteHistoryEntry(id: string): Promise<Response> {
  return fetch(`${API_BASE}/history`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}
