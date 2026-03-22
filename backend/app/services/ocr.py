from app.providers.gemini import GeminiProvider
from app.providers.mistral import MistralProvider
from app.config import GOOGLE_AI_API_KEY, MISTRAL_API_KEY


async def extract_text_from_image(
    image_bytes: bytes, mime_type: str, source_lang: str
) -> str:
    """Extract text from image using AI Vision with automatic fallback."""

    # Primary: Gemini
    if GOOGLE_AI_API_KEY:
        try:
            provider = GeminiProvider()
            return await provider.vision_ocr(image_bytes, mime_type, source_lang)
        except Exception as e:
            print(f"[OCR] Gemini failed: {e}, trying fallback...")

    # Fallback: Mistral/Pixtral
    if MISTRAL_API_KEY:
        try:
            provider = MistralProvider()
            return await provider.vision_ocr(image_bytes, mime_type, source_lang)
        except Exception as e:
            print(f"[OCR] Mistral failed: {e}")

    raise RuntimeError("No AI Vision provider available. Check API keys in .env")
