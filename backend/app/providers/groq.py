from groq import Groq

from app.providers.base import AIProvider
from app.config import GROQ_API_KEY


class GroqProvider(AIProvider):
    """Groq provider — fallback for translation (no vision support)."""

    name = "groq"

    def __init__(self):
        self.client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

    async def vision_ocr(self, image_bytes: bytes, mime_type: str, source_lang: str) -> str:
        raise NotImplementedError("Groq does not support vision OCR")

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.client:
            raise RuntimeError("Groq API key not configured")

        response = self.client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional math textbook translator from {source_lang} to {target_lang}. "
                        "Preserve ALL LaTeX ($...$), HTML/SVG blocks, and markdown formatting exactly. "
                        "Only translate natural language text. Use correct mathematical terminology with proper diacritics."
                    ),
                },
                {"role": "user", "content": text},
            ],
            temperature=0.1,
            max_tokens=4096,
        )

        return response.choices[0].message.content or ""
