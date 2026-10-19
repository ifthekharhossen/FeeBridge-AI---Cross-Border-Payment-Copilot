"""LLM providers with a tool-calling loop. Keys come from backend env vars only.

Two wire formats cover most providers:
  * AnthropicProvider        - Anthropic Messages API (Claude)
  * OpenAICompatibleProvider - /chat/completions (OpenAI, Groq, Gemini's OpenAI-compatible endpoint, OpenRouter, ...)
"""
from __future__ import annotations

import json
from typing import Any, Callable

import httpx

from .config import Settings

ToolExecutor = Callable[[str, dict[str, Any]], str]


class LLMError(Exception):
    """Provider call failed. Message is safe to log (never contains the API key)."""


def _normalise_history(history: list[dict[str, str]], user_message: str) -> list[dict[str, str]]:
    """Return alternating user/assistant messages that start and end with 'user'."""
    msgs: list[dict[str, str]] = []
    for h in history[-10:]:
        role = "assistant" if h["role"] == "assistant" else "user"
        if not h["content"].strip():
            continue
        if msgs and msgs[-1]["role"] == role:
            msgs[-1]["content"] += "\n" + h["content"]
        else:
            msgs.append({"role": role, "content": h["content"]})
    while msgs and msgs[0]["role"] != "user":
        msgs.pop(0)
    if msgs and msgs[-1]["role"] == "user":
        msgs[-1]["content"] += "\n" + user_message
    else:
        msgs.append({"role": "user", "content": user_message})
    return msgs


def _raise_for(resp: httpx.Response) -> None:
    if resp.status_code >= 400:
        try:
            body = resp.json()
            detail = body.get("error", body)
            detail = detail.get("message", detail) if isinstance(detail, dict) else detail
        except Exception:
            detail = resp.text[:200]
        raise LLMError(f"Provider returned HTTP {resp.status_code}: {str(detail)[:300]}")


class AnthropicProvider:
    name = "anthropic"

    def __init__(self, s: Settings, transport: httpx.AsyncBaseTransport | None = None):
        self.s, self.transport = s, transport
        self.model = s.anthropic_model

    async def converse(self, system: str, history: list[dict[str, str]], user_message: str,
                       tools: list[dict[str, Any]], execute: ToolExecutor) -> str:
        messages: list[dict[str, Any]] = _normalise_history(history, user_message)
        headers = {"x-api-key": self.s.anthropic_api_key or "", "anthropic-version": "2023-06-01",
                   "content-type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=self.s.llm_timeout_seconds, transport=self.transport) as client:
                for round_no in range(self.s.llm_max_tool_rounds + 1):
                    payload: dict[str, Any] = {
                        "model": self.model, "max_tokens": self.s.llm_max_tokens,
                        "system": system, "messages": messages, "tools": tools,
                    }
                    if round_no == self.s.llm_max_tool_rounds:
                        payload["tool_choice"] = {"type": "none"}  # force a final text answer
                    resp = await client.post(f"{self.s.anthropic_base_url}/v1/messages", headers=headers, json=payload)
                    _raise_for(resp)
                    data = resp.json()
                    blocks = data.get("content", [])
                    uses = [b for b in blocks if b.get("type") == "tool_use"]
                    if not uses:
                        return "\n".join(b.get("text", "") for b in blocks if b.get("type") == "text").strip()
                    messages.append({"role": "assistant", "content": blocks})
                    messages.append({"role": "user", "content": [
                        {"type": "tool_result", "tool_use_id": b["id"], "content": execute(b["name"], b.get("input") or {})}
                        for b in uses
                    ]})
        except httpx.HTTPError as exc:
            raise LLMError(f"Network error talking to Anthropic: {type(exc).__name__}") from exc
        raise LLMError("Model did not produce a final answer")


class OpenAICompatibleProvider:
    name = "openai_compatible"

    def __init__(self, s: Settings, transport: httpx.AsyncBaseTransport | None = None):
        self.s, self.transport = s, transport
        self.model = s.openai_compat_model

    async def converse(self, system: str, history: list[dict[str, str]], user_message: str,
                       tools: list[dict[str, Any]], execute: ToolExecutor) -> str:
        messages: list[dict[str, Any]] = [{"role": "system", "content": system},
                                          *_normalise_history(history, user_message)]
        oa_tools = [{"type": "function", "function": {
            "name": t["name"], "description": t["description"], "parameters": t["input_schema"]}} for t in tools]
        headers = {"Authorization": f"Bearer {self.s.openai_compat_api_key}", "Content-Type": "application/json"}
        try:
            async with httpx.AsyncClient(timeout=self.s.llm_timeout_seconds, transport=self.transport) as client:
                for round_no in range(self.s.llm_max_tool_rounds + 1):
                    payload: dict[str, Any] = {"model": self.model, "messages": messages,
                                               "tools": oa_tools, "max_tokens": self.s.llm_max_tokens}
                    if round_no == self.s.llm_max_tool_rounds:
                        payload["tool_choice"] = "none"
                    resp = await client.post(f"{self.s.openai_compat_base_url}/chat/completions",
                                             headers=headers, json=payload)
                    _raise_for(resp)
                    try:
                        msg = resp.json()["choices"][0]["message"]
                    except (KeyError, IndexError, ValueError) as exc:
                        raise LLMError("Unexpected response format from provider") from exc
                    calls = msg.get("tool_calls") or []
                    if not calls:
                        return (msg.get("content") or "").strip()
                    messages.append({"role": "assistant", "content": msg.get("content"), "tool_calls": calls})
                    for call in calls:
                        try:
                            args = json.loads(call["function"].get("arguments") or "{}")
                        except ValueError:
                            args = {}
                        messages.append({"role": "tool", "tool_call_id": call["id"],
                                         "content": execute(call["function"]["name"], args if isinstance(args, dict) else {})})
        except httpx.HTTPError as exc:
            raise LLMError(f"Network error talking to provider: {type(exc).__name__}") from exc
        raise LLMError("Model did not produce a final answer")


def build_provider(s: Settings, transport: httpx.AsyncBaseTransport | None = None):
    """Return a provider instance, or None when running in demo mode."""
    p = s.resolved_provider
    if p == "anthropic":
        return AnthropicProvider(s, transport)
    if p == "openai_compatible":
        return OpenAICompatibleProvider(s, transport)
    return None
