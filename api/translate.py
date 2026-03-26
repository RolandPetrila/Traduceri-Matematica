"""Python Serverless Function for OCR + Translation (Render).

Thin handler — delegates to lib/ modules for OCR, translation, and HTML building.
Handles POST /api/translate — image files -> AI OCR -> translate -> HTML.
"""

from __future__ import annotations

from http.server import BaseHTTPRequestHandler
import json
import os
import re
import sys
import time
import traceback

# Ensure api/lib/ is importable
_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

# --- Lib imports ---
from lib.html_builder import build_html, build_html_structured
from lib.translation_router import (
    gemini_request,
    ocr_with_gemini,
    translate_with_gemini,
    translate_with_groq,
    extract_text_from_docx,
    format_and_translate_docx,
    claude_ocr_and_translate,
    claude_translate_text,
    _sanitize_error,
)
from lib.math_protect import protect_for_deepl, restore_from_deepl

try:
    from lib.deepl_client import translate_text as _deepl_translate
    _HAS_DEEPL_LIB = True
except ImportError:
    _HAS_DEEPL_LIB = False

from lib.ocr_structured import ocr_structured
from lib.figure_crop import crop_all_figures


# --- PDF to images (PyMuPDF, DPI 150) ---

def _pdf_to_images(pdf_bytes: bytes, dpi: int = 150) -> list[tuple[bytes, str]]:
    """Convert each PDF page to a PNG image using PyMuPDF.

    Returns list of (image_bytes, mime_type) per page.
    DPI 150 = good quality with low memory (~100MB for 10 pages on 512MB Render).
    """
    try:
        import pymupdf
    except ImportError:
        print("[PDF] PyMuPDF not installed, cannot process PDF", file=sys.stderr)
        return []

    pages = []
    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
        total = len(doc)
        print(f"[PDF] Converting {total} pages at DPI {dpi}", file=sys.stderr)
        for page_num in range(total):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=dpi)
            img_bytes = pix.tobytes("png")
            pages.append((img_bytes, "image/png"))
            print(f"[PDF] Page {page_num+1}/{total}: {pix.width}x{pix.height}px, {len(img_bytes)} bytes", file=sys.stderr)
        doc.close()
    except Exception as e:
        print(f"[PDF] Error converting PDF: {e}", file=sys.stderr)
        return []

    return pages


# --- Helpers ---

def _log_to_file(message: str) -> None:
    """Append log entry to data/logs/local_debug.log (local dev only)."""
    log_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "logs")
    if not os.path.isdir(log_dir):
        return
    try:
        from datetime import datetime
        ts = datetime.now().strftime("%H:%M:%S")
        with open(log_dir + "/local_debug.log", "a", encoding="utf-8") as f:
            f.write(f"[{ts}] {message}\n")
    except Exception:
        pass


def protect_math(text: str) -> tuple[str, dict[str, str]]:
    """Protect LaTeX/SVG/HTML from translation."""
    placeholders = {}
    counter = [0]
    def _replace(match: re.Match) -> str:
        key = f"__MATH_{counter[0]}__"
        placeholders[key] = match.group(0)
        counter[0] += 1
        return key
    patterns = [
        r"<div[^>]*>[\s\S]*?<svg[\s\S]*?</svg>[\s\S]*?</div>",
        r"\$\$[\s\S]+?\$\$", r"\$[^\$\n]+?\$",
        r"\\begin\{[^}]+\}[\s\S]*?\\end\{[^}]+\}",
        r"\\[a-zA-Z]+\{[^}]*\}", r"\\[a-zA-Z]+",
        r"<[^>]+>",
    ]
    for pattern in patterns:
        text = re.sub(pattern, _replace, text)
    return text, placeholders


def restore_math(text: str, placeholders: dict[str, str]) -> str:
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text


# --- Multipart parser ---

def parse_boundary(content_type: str) -> str:
    for part in content_type.split(";"):
        part = part.strip()
        if part.startswith("boundary="):
            return part[len("boundary="):].strip('"').strip("'")
    raise ValueError(f"No boundary found in Content-Type: {content_type}")


# --- Main Handler ---

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com"))
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        try:
            content_type = self.headers.get("Content-Type", "")
            content_length = int(self.headers.get("Content-Length", 0))
            print(f"[TRANSLATE] Request: content_type={content_type[:80]}, size={content_length}", file=sys.stderr)
            body = self.rfile.read(content_length)

            if "multipart/form-data" in content_type:
                parts = self._parse_multipart(body, parse_boundary(content_type))
            else:
                parts = json.loads(body)

            source_lang = parts.get("source_lang", "ro")
            target_lang = parts.get("target_lang", "sk")
            files = parts.get("files", [])
            translate_engine = parts.get("translate_engine", "deepl")

            dict_terms = []
            dict_raw = parts.get("dictionary", "")
            if dict_raw:
                try:
                    dict_terms = json.loads(dict_raw)
                except (json.JSONDecodeError, TypeError):
                    pass

            if not files:
                self._send_json(400, {"error": "Nu au fost trimise fisiere", "status": "error"})
                return

            _log_to_file(f"ACTION  | Traducere initiata | {len(files)} fisier(e) | {source_lang} -> {target_lang} | Engine: {translate_engine}")

            all_markdowns = []
            all_structured_pages = []
            all_structured_figs = []
            results = []
            t0 = time.time()

            for idx, file_info in enumerate(files):
                file_data = file_info["data"]
                mime_type = file_info.get("mime_type", "image/jpeg")
                filename = file_info.get("filename", "")
                is_docx = "wordprocessingml" in mime_type or filename.lower().endswith(".docx")
                is_pdf = mime_type == "application/pdf" or filename.lower().endswith(".pdf")
                has_claude = False  # Claude suspended

                # PDF: convert each page to image, process individually
                if is_pdf and not is_docx:
                    pdf_pages = _pdf_to_images(file_data)
                    if pdf_pages:
                        for pg_idx, (pg_bytes, pg_mime) in enumerate(pdf_pages):
                            files.append({"data": pg_bytes, "mime_type": pg_mime, "filename": f"{filename}_p{pg_idx+1}.png"})
                        continue  # Skip this file, process extracted pages
                    # Fallback: treat as regular image (might fail, but try)

                if is_docx:
                    extracted = extract_text_from_docx(file_data)
                    final_markdown = format_and_translate_docx(extracted, source_lang, target_lang)
                elif has_claude:
                    try:
                        final_markdown = claude_ocr_and_translate(file_data, mime_type, source_lang, target_lang)
                    except Exception:
                        extracted = ocr_with_gemini(file_data, mime_type, source_lang)
                        protected, ph = protect_math(extracted)
                        final_markdown = restore_math(translate_with_gemini(protected, source_lang, target_lang, dict_terms), ph)
                else:
                    # Structured pipeline: OCR -> crop -> translate -> HTML
                    t_ocr = time.time()
                    use_structured = True
                    try:
                        page_data = ocr_structured(file_data, mime_type, source_lang)
                    except Exception:
                        use_structured = False

                    if use_structured:
                        sections = page_data.get("sections", [])
                        cropped_figs = crop_all_figures(file_data, sections)

                        # Batch translate all text parts in one API call
                        text_indices = []
                        all_text_parts = []
                        title = page_data.get("title", "")
                        if title:
                            all_text_parts.append(title)
                            text_indices.append(("title", -1))
                        for si, sec in enumerate(sections):
                            if sec.get("type") in ("paragraph", "heading", "step", "observation", "list"):
                                content = sec.get("content", "")
                                if content.strip():
                                    all_text_parts.append(content)
                                    text_indices.append(("section", si))

                        if all_text_parts:
                            SEP = "\n|||SEPARATOR|||\n"
                            batch_text = SEP.join(all_text_parts)
                            try:
                                if translate_engine == "deepl" and _HAS_DEEPL_LIB and os.environ.get("DEEPL_API_KEY", "").strip():
                                    try:
                                        protected = protect_for_deepl(batch_text)
                                        translated_batch = _deepl_translate(protected, target_lang, source_lang)
                                        translated_batch = restore_from_deepl(translated_batch)
                                    except Exception:
                                        protected_ph, ph = protect_math(batch_text)
                                        translated_batch = restore_math(translate_with_gemini(protected_ph, source_lang, target_lang, dict_terms), ph)
                                else:
                                    protected_ph, ph = protect_math(batch_text)
                                    translated_batch = restore_math(translate_with_gemini(protected_ph, source_lang, target_lang, dict_terms), ph)

                                parts_tr = translated_batch.split("|||SEPARATOR|||")
                                for pi, (kind, si) in enumerate(text_indices):
                                    if pi < len(parts_tr):
                                        text = parts_tr[pi].strip()
                                        if kind == "title":
                                            page_data["title"] = text
                                        else:
                                            sections[si]["content"] = text
                            except Exception as tr_err:
                                print(f"[TRANSLATE] Batch failed: {tr_err}", file=sys.stderr)

                        all_structured_pages.append(page_data)
                        all_structured_figs.append(cropped_figs)
                        results.append({"source_lang": source_lang, "target_lang": target_lang, "status": "success", "pipeline": "structured"})
                        continue
                    else:
                        # Legacy fallback
                        extracted = ocr_with_gemini(file_data, mime_type, source_lang)
                        protected, ph = protect_math(extracted)
                        final_markdown = restore_math(translate_with_gemini(protected, source_lang, target_lang, dict_terms), ph)

                all_markdowns.append(final_markdown)
                results.append({"source_lang": source_lang, "target_lang": target_lang, "status": "success", "pipeline": "legacy" if not is_docx else "docx"})

            # Build HTML
            duration_ms = int((time.time() - t0) * 1000)
            if all_structured_pages:
                unified_html = build_html_structured(all_structured_pages, all_structured_figs, target_lang)
            elif all_markdowns:
                unified_html = build_html(all_markdowns, target_lang)
            else:
                unified_html = ""

            print(f"[TRANSLATE] Success: {len(results)} pages in {duration_ms}ms", file=sys.stderr)
            self._send_json(200, {
                "results": results,
                "html": unified_html,
                "pages": len(results),
                "duration_ms": duration_ms,
                "status": "success",
                "source_lang": source_lang,
                "target_lang": target_lang,
                "structured_pages": all_structured_pages if all_structured_pages else None,
            })

        except Exception as e:
            error_msg = _sanitize_error(f"{type(e).__name__}: {str(e)}")
            print(f"[TRANSLATE ERROR] {error_msg}", file=sys.stderr)
            traceback.print_exc(file=sys.stderr)
            self._send_json(500, {"error": error_msg, "status": "error"})

    def _parse_multipart(self, body: bytes, boundary: str) -> dict:
        parts_data = {"files": [], "source_lang": "ro", "target_lang": "sk"}
        boundary_bytes = f"--{boundary}".encode()
        sections = body.split(boundary_bytes)
        for section in sections[1:]:
            if section.strip() in (b"--", b"", b"--\r\n"):
                continue
            header_end = section.find(b"\r\n\r\n")
            if header_end == -1:
                continue
            header = section[:header_end].decode("utf-8", errors="replace")
            content = section[header_end + 4:]
            if content.endswith(b"\r\n"):
                content = content[:-2]
            name_match = re.search(r'name="([^"]+)"', header)
            if not name_match:
                continue
            name = name_match.group(1)
            if name in ("source_lang", "target_lang", "dictionary", "translate_engine"):
                parts_data[name] = content.decode("utf-8").strip()
            elif name == "files" or "filename" in header:
                ct_match = re.search(r"Content-Type:\s*(\S+)", header)
                mime = ct_match.group(1) if ct_match else "image/jpeg"
                fname_match = re.search(r'filename="([^"]*)"', header)
                fname = fname_match.group(1) if fname_match else ""
                parts_data["files"].append({"mime_type": mime, "data": content, "filename": fname})
        return parts_data

    def _send_json(self, status: int, data: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", os.environ.get("ALLOWED_ORIGIN", "https://traduceri-matematica-7sh7.onrender.com"))
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
