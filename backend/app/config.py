import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(PROJECT_ROOT / ".env")

# AI Provider keys
GOOGLE_AI_API_KEY = os.getenv("GOOGLE_AI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY", "")

# Paths
DATA_DIR = PROJECT_ROOT / "data"
DICTIONARY_DIR = DATA_DIR / "dictionary"
HISTORY_DIR = DATA_DIR / "history"
CONFIG_DIR = PROJECT_ROOT / "config"

# Encoding fallbacks
ENCODING_FALLBACKS = ["utf-8", "utf-8-sig", "cp1250", "latin-1"]

# Translation settings
MAX_FILES_PER_BATCH = 10
SUPPORTED_IMAGE_TYPES = {"image/jpeg", "image/png"}
SUPPORTED_DOC_TYPES = {"application/pdf"}

# MathJax CDN
MATHJAX_SRC = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
