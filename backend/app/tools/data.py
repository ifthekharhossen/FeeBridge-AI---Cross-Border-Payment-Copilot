"""Loads the SAMPLE data files. Everything here is illustrative, never live."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


@lru_cache(maxsize=1)
def universities() -> dict[str, dict[str, Any]]:
    rows = json.loads((DATA_DIR / "universities.json").read_text(encoding="utf-8"))
    return {u["id"]: u for u in rows}


@lru_cache(maxsize=1)
def fx_config() -> dict[str, Any]:
    return json.loads((DATA_DIR / "fx_rates.json").read_text(encoding="utf-8"))


def get_university(university_id: str) -> dict[str, Any] | None:
    return universities().get((university_id or "").strip().lower())


def public_university(u: dict[str, Any]) -> dict[str, Any]:
    """University record in the shape of UniversityMockData (drops backend-only fields)."""
    return {k: v for k, v in u.items() if k not in {"referenceRegex", "referenceTemplate"}}
