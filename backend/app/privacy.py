"""Keeps the student's name / ID away from the external LLM provider by default.

Tools still run locally with the real values. Text sent to the LLM is scrubbed to placeholders;
placeholders in the LLM's output (and in tool arguments it produces) are restored locally.
"""
from __future__ import annotations

import json
import re
from typing import Any

from .schemas import PaymentPlanInput
from .tools.data import get_university
from .tools.instruction_checker import expected_reference


class Redactor:
    def __init__(self, plan: PaymentPlanInput, enabled: bool = True):
        self.enabled = enabled
        self._pairs: list[tuple[str, str]] = []  # (original, placeholder), longest/specific first
        if not enabled:
            return
        u = get_university(plan.university_id)
        ref = expected_reference(u, plan.student_id, plan.student_name) if u else None
        if ref:
            self._pairs.append((ref, "[REQUIRED_REFERENCE]"))
        if plan.student_id.strip():
            self._pairs.append((plan.student_id.strip(), "[STUDENT_ID]"))
        if plan.student_name.strip():
            self._pairs.append((plan.student_name.strip(), "[STUDENT_NAME]"))
            for i, part in enumerate(re.findall(r"[A-Za-z]{3,}", plan.student_name), start=1):
                self._pairs.append((part, f"[NAME_PART_{i}]"))

    def scrub(self, text: str) -> str:
        if not self.enabled or not isinstance(text, str):
            return text
        for original, placeholder in self._pairs:
            text = re.sub(re.escape(original), placeholder, text, flags=re.IGNORECASE)
        return text

    def restore(self, text: str) -> str:
        if not self.enabled or not isinstance(text, str):
            return text
        for original, placeholder in reversed(self._pairs):
            text = text.replace(placeholder, original)
        return text

    def scrub_obj(self, obj: Any) -> Any:
        return json.loads(self.scrub(json.dumps(obj, ensure_ascii=False))) if self.enabled else obj

    def restore_obj(self, obj: Any) -> Any:
        if not self.enabled:
            return obj
        if isinstance(obj, str):
            return self.restore(obj)
        if isinstance(obj, list):
            return [self.restore_obj(i) for i in obj]
        if isinstance(obj, dict):
            return {k: self.restore_obj(v) for k, v in obj.items()}
        return obj
