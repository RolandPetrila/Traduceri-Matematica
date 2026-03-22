from abc import ABC, abstractmethod


class AIProvider(ABC):
    """Base class for AI providers (vision + translation)."""

    name: str = "base"

    @abstractmethod
    async def vision_ocr(self, image_bytes: bytes, mime_type: str, source_lang: str) -> str:
        """Extract structured markdown+LaTeX from an image of a math document."""
        ...

    @abstractmethod
    async def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """Translate markdown text while preserving LaTeX, SVG, and HTML."""
        ...
