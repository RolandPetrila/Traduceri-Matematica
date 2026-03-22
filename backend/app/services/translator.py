import re

from app.providers.gemini import GeminiProvider
from app.providers.groq import GroqProvider
from app.config import GOOGLE_AI_API_KEY, GROQ_API_KEY

# Pattern to match LaTeX math expressions
MATH_PATTERN = re.compile(
    r"(\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$|\\[a-zA-Z]+\{[^}]*\})"
)

# Pattern to match HTML/SVG blocks
HTML_PATTERN = re.compile(r"(<(?:div|svg|table|img)[^>]*>[\s\S]*?</(?:div|svg|table|img)>)", re.IGNORECASE)


def protect_math(text: str) -> tuple[str, dict[str, str]]:
    """Replace LaTeX expressions with placeholders to protect from translation."""
    placeholders: dict[str, str] = {}

    def replace(match: re.Match) -> str:
        key = f"@@MATH_{len(placeholders)}@@"
        placeholders[key] = match.group(0)
        return key

    return MATH_PATTERN.sub(replace, text), placeholders


def protect_html(text: str) -> tuple[str, dict[str, str]]:
    """Replace HTML/SVG blocks with placeholders."""
    placeholders: dict[str, str] = {}

    def replace(match: re.Match) -> str:
        key = f"@@HTML_{len(placeholders)}@@"
        placeholders[key] = match.group(0)
        return key

    return HTML_PATTERN.sub(replace, text), placeholders


def restore_placeholders(text: str, placeholders: dict[str, str]) -> str:
    """Restore all placeholders back to original content."""
    for key, value in placeholders.items():
        text = text.replace(key, value)
    return text


async def translate_markdown(
    text: str, source_lang: str, target_lang: str
) -> str:
    """Translate markdown text with LaTeX/HTML protection and fallback."""

    if source_lang == target_lang:
        return text

    # Protect math and HTML before sending to AI
    text_safe, math_ph = protect_math(text)
    text_safe, html_ph = protect_html(text_safe)

    translated = None

    # Primary: Gemini
    if GOOGLE_AI_API_KEY:
        try:
            provider = GeminiProvider()
            translated = await provider.translate(text_safe, source_lang, target_lang)
        except Exception as e:
            print(f"[Translate] Gemini failed: {e}, trying fallback...")

    # Fallback: Groq
    if translated is None and GROQ_API_KEY:
        try:
            provider = GroqProvider()
            translated = await provider.translate(text_safe, source_lang, target_lang)
        except Exception as e:
            print(f"[Translate] Groq failed: {e}")

    if translated is None:
        raise RuntimeError("No translation provider available. Check API keys in .env")

    # Restore protected content
    translated = restore_placeholders(translated, html_ph)
    translated = restore_placeholders(translated, math_ph)

    return translated
