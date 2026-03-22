import base64
import google.generativeai as genai

from app.providers.base import AIProvider
from app.config import GOOGLE_AI_API_KEY

VISION_PROMPT = """You are a math document OCR specialist. Extract ALL content from this image of a math textbook page.

Output format: Markdown with LaTeX math notation ($...$ for inline, $$...$$ for display).

Rules:
- Preserve ALL mathematical symbols, formulas, angles, triangles, measurements
- Use LaTeX notation: $\\triangle ABC$, $\\angle A = 60°$, $AB = 4 \\text{ cm}$
- For geometric construction figures, create precise inline SVG elements wrapped in <div> containers
- SVG coordinates: use ~20px per cm scale
- Include vertex labels (italic), angle arcs, measurement annotations, dashed construction lines
- Preserve the exact layout order: text, then figure, then text, as in the original
- Source language: {source_lang}
- Output in the SAME language as the source (no translation at this stage)"""

TRANSLATE_PROMPT = """You are a professional math textbook translator.

Translate the following markdown text from {source_lang} to {target_lang}.

CRITICAL RULES:
- Preserve ALL LaTeX expressions ($...$, $$...$$) exactly as-is — do NOT translate inside LaTeX
- Preserve ALL HTML/SVG blocks exactly as-is — do NOT modify any HTML tags or SVG elements
- Preserve ALL markdown formatting (headings, bold, lists)
- Use correct mathematical terminology in {target_lang} with proper diacritics
- Translate ONLY the natural language text, not the math notation
- Maintain the same document structure and layout order

Text to translate:
{text}"""


class GeminiProvider(AIProvider):
    name = "gemini"

    def __init__(self):
        if GOOGLE_AI_API_KEY:
            genai.configure(api_key=GOOGLE_AI_API_KEY)

    async def vision_ocr(self, image_bytes: bytes, mime_type: str, source_lang: str) -> str:
        model = genai.GenerativeModel("gemini-1.5-flash")
        image_data = base64.b64encode(image_bytes).decode("utf-8")

        response = model.generate_content([
            VISION_PROMPT.format(source_lang=source_lang),
            {"mime_type": mime_type, "data": image_data},
        ])

        return response.text

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        model = genai.GenerativeModel("gemini-1.5-flash")

        response = model.generate_content(
            TRANSLATE_PROMPT.format(
                source_lang=source_lang,
                target_lang=target_lang,
                text=text,
            )
        )

        return response.text
