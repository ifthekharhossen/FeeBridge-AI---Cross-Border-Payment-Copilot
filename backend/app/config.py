"""Backend-only configuration. Secrets are read from environment variables / backend/.env
and are never sent to the React frontend."""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BACKEND_DIR / ".env")

_PLACEHOLDER_HINTS = ("your", "my_", "changeme", "xxx", "example", "placeholder")


def _clean_key(value: str | None) -> str | None:
    """Treat empty or obvious placeholder values as 'no key'."""
    if not value:
        return None
    v = value.strip().strip('"').strip("'")
    if not v or any(h in v.lower() for h in _PLACEHOLDER_HINTS):
        return None
    return v


def _bool(name: str, default: bool) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, default))
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    llm_provider: str = "auto"  # auto | anthropic | openai_compatible | demo
    anthropic_api_key: str | None = None
    anthropic_model: str = "claude-sonnet-5-5"
    anthropic_base_url: str = "https://api.anthropic.com"
    openai_compat_api_key: str | None = None
    openai_compat_base_url: str = "https://api.openai.com/v1"
    openai_compat_model: str = "gpt-4o-mini"
    llm_timeout_seconds: float = 45.0
    llm_max_tokens: int = 1200
    llm_max_tool_rounds: int = 5
    llm_fallback_to_demo: bool = True
    llm_send_student_pii: bool = False
    cors_origins: tuple[str, ...] = field(
        default_factory=lambda: ("http://localhost:3000", "http://127.0.0.1:3000")
    )

    @property
    def resolved_provider(self) -> str:
        """The provider that will actually be used, given the keys that are present."""
        choice = self.llm_provider
        if choice == "demo":
            return "demo"
        if choice == "anthropic":
            return "anthropic" if self.anthropic_api_key else "demo"
        if choice == "openai_compatible":
            return "openai_compatible" if self.openai_compat_api_key else "demo"
        # auto
        if self.anthropic_api_key:
            return "anthropic"
        if self.openai_compat_api_key:
            return "openai_compatible"
        return "demo"

    @property
    def active_model(self) -> str | None:
        p = self.resolved_provider
        if p == "anthropic":
            return self.anthropic_model
        if p == "openai_compatible":
            return self.openai_compat_model
        return None


def load_settings() -> Settings:
    origins = tuple(
        o.strip().rstrip("/")
        for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        if o.strip()
    )
    provider = os.getenv("LLM_PROVIDER", "auto").strip().lower()
    if provider not in {"auto", "anthropic", "openai_compatible", "demo"}:
        provider = "auto"
    return Settings(
        llm_provider=provider,
        anthropic_api_key=_clean_key(os.getenv("ANTHROPIC_API_KEY")),
        anthropic_model=os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5-5").strip(),
        anthropic_base_url=os.getenv("ANTHROPIC_BASE_URL", "https://api.anthropic.com").rstrip("/"),
        openai_compat_api_key=_clean_key(os.getenv("OPENAI_COMPAT_API_KEY")),
        openai_compat_base_url=os.getenv("OPENAI_COMPAT_BASE_URL", "https://api.openai.com/v1").rstrip("/"),
        openai_compat_model=os.getenv("OPENAI_COMPAT_MODEL", "gpt-4o-mini").strip(),
        llm_timeout_seconds=float(os.getenv("LLM_TIMEOUT_SECONDS", "45")),
        llm_max_tokens=_int("LLM_MAX_TOKENS", 1200),
        llm_max_tool_rounds=max(1, _int("LLM_MAX_TOOL_ROUNDS", 5)),
        llm_fallback_to_demo=_bool("LLM_FALLBACK_TO_DEMO", True),
        llm_send_student_pii=_bool("LLM_SEND_STUDENT_PII", False),
        cors_origins=origins or ("http://localhost:3000",),
    )
