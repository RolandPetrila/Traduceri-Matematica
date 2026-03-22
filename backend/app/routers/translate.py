import time
import uuid
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse

from app.services.ocr import extract_text_from_image
from app.services.translator import translate_markdown
from app.services.html_builder import build_html_a4
from app.services.dictionary import apply_dictionary
from app.config import MAX_FILES_PER_BATCH

router = APIRouter()


@router.post("/translate")
async def translate_documents(
    files: list[UploadFile] = File(...),
    source_lang: str = Form("ro"),
    target_lang: str = Form("sk"),
):
    if len(files) > MAX_FILES_PER_BATCH:
        return JSONResponse(
            {"error": f"Maximum {MAX_FILES_PER_BATCH} files per batch"},
            status_code=400,
        )

    start = time.time()
    translation_id = str(uuid.uuid4())[:8]
    pages_md = []

    for i, uploaded in enumerate(files):
        content = await uploaded.read()

        # Step 1: OCR — extract text from image
        markdown_text = await extract_text_from_image(
            content, uploaded.content_type or "image/jpeg", source_lang
        )

        # Step 2: Translate markdown
        translated_md = await translate_markdown(
            markdown_text, source_lang, target_lang
        )

        # Step 3: Apply terminological dictionary
        translated_md = apply_dictionary(translated_md, source_lang, target_lang)

        pages_md.append(translated_md)

    # Step 4: Build HTML A4
    html = build_html_a4(pages_md, target_lang)

    duration = int((time.time() - start) * 1000)

    return {
        "id": translation_id,
        "html": html,
        "markdown": "\n\n---\n\n".join(pages_md),
        "pages": len(pages_md),
        "source_lang": source_lang,
        "target_lang": target_lang,
        "duration_ms": duration,
        "status": "success",
    }
