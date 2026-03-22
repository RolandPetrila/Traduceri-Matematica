import json
from pathlib import Path
from fastapi import APIRouter
from fastapi.responses import JSONResponse

from app.config import HISTORY_DIR

router = APIRouter()

HISTORY_FILE = HISTORY_DIR / "history.json"


def _load_history() -> list[dict]:
    if HISTORY_FILE.exists():
        return json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    return []


def _save_history(entries: list[dict]) -> None:
    HISTORY_DIR.mkdir(parents=True, exist_ok=True)
    HISTORY_FILE.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")


@router.get("/history")
async def get_history():
    return {"entries": _load_history()}


@router.delete("/history/{entry_id}")
async def delete_history_entry(entry_id: str):
    entries = _load_history()
    entries = [e for e in entries if e.get("id") != entry_id]
    _save_history(entries)
    return {"ok": True}
