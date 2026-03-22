import base64
from mistralai.client import Mistral

from app.providers.base import AIProvider
from app.config import MISTRAL_API_KEY


class MistralProvider(AIProvider):
    """Mistral/Pixtral provider — fallback for vision OCR."""

    name = "mistral"

    def __init__(self):
        self.client = Mistral(api_key=MISTRAL_API_KEY) if MISTRAL_API_KEY else None

    async def vision_ocr(self, image_bytes: bytes, mime_type: str, source_lang: str) -> str:
        if not self.client:
            raise RuntimeError("Mistral API key not configured")

        image_b64 = base64.b64encode(image_bytes).decode("utf-8")

        response = await self.client.chat.complete_async(
            model="pixtral-12b-2409",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                f"Extract ALL content from this math textbook image ({source_lang}). "
                                "Output as Markdown with LaTeX ($...$). Include SVG for geometric figures. "
                                "Preserve all symbols, formulas, measurements, and layout order."
                            ),
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:{mime_type};base64,{image_b64}"},
                        },
                    ],
                }
            ],
        )

        return response.choices[0].message.content or ""

    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        if not self.client:
            raise RuntimeError("Mistral API key not configured")

        response = await self.client.chat.complete_async(
            model="mistral-large-latest",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"Translate from {source_lang} to {target_lang}. "
                        "Preserve LaTeX, HTML/SVG, markdown. Only translate natural language."
                    ),
                },
                {"role": "user", "content": text},
            ],
        )

        return response.choices[0].message.content or ""
