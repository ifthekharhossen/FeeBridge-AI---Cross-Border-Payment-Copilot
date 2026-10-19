"""Pydantic models. JSON field names are camelCase to match src/types/index.ts."""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator
from pydantic.alias_generators import to_camel

SUPPORTED_CURRENCIES = {"USD", "BDT", "CNY", "GBP", "AUD", "MYR", "EUR", "CAD", "INR"}


def check_currency(v: str) -> str:
    v = v.strip().upper()
    if v not in SUPPORTED_CURRENCIES:
        raise ValueError(f"Unsupported currency '{v}'. Supported: {sorted(SUPPORTED_CURRENCIES)}")
    return v


def check_iso_date(v: str) -> str:
    from datetime import date

    try:
        date.fromisoformat(v)
    except ValueError as exc:
        raise ValueError("date must be an ISO date (YYYY-MM-DD)") from exc
    return v


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, extra="ignore")


PaymentPurpose = Literal[
    "Tuition Deposit",
    "Full Semester Tuition",
    "Accommodation Fee",
    "Health Insurance & Student Fee",
]


class PaymentPlanInput(CamelModel):
    """Mirrors PaymentPlanInput in src/types/index.ts."""

    origin_country: str = Field(max_length=80)
    destination_country: str = Field(max_length=80)
    university_id: str = Field(max_length=40)
    university_name: str = Field(default="", max_length=160)
    tuition_amount: float = Field(gt=0, le=10_000_000)
    tuition_currency: str
    source_currency: str
    payment_deadline: str = Field(description="ISO date, YYYY-MM-DD", max_length=10)
    payment_purpose: PaymentPurpose = "Tuition Deposit"
    student_name: str = Field(default="", max_length=120)
    student_id: str = Field(default="", max_length=40)
    notes: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("tuition_currency", "source_currency")
    @classmethod
    def _currency(cls, v: str) -> str:
        return check_currency(v)

    @field_validator("payment_deadline")
    @classmethod
    def _deadline(cls, v: str) -> str:
        return check_iso_date(v)


class HistoryItem(CamelModel):
    sender: Literal["user", "assistant"]
    content: str = Field(max_length=4000)


class ChatRequest(CamelModel):
    message: str = Field(min_length=1, max_length=2000)
    plan: PaymentPlanInput
    history: list[HistoryItem] = Field(default_factory=list, max_length=30)

    @field_validator("message")
    @classmethod
    def _strip(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("message must not be blank")
        return v


# ---- direct tool endpoints -------------------------------------------------

class CompareRequest(CamelModel):
    tuition_amount: float = Field(gt=0, le=10_000_000)
    tuition_currency: str
    source_currency: str

    @field_validator("tuition_currency", "source_currency")
    @classmethod
    def _currency(cls, v: str) -> str:
        return check_currency(v)


class EnteredPaymentDetails(CamelModel):
    beneficiary_name: str = Field(default="", max_length=200)
    bank_name: str = Field(default="", max_length=200)
    account_no: str = Field(default="", max_length=60)
    swift_bic: str = Field(default="", max_length=20)
    reference: str = Field(default="", max_length=140)


class CheckRequest(CamelModel):
    university_id: str = Field(max_length=40)
    entered: EnteredPaymentDetails = Field(default_factory=EnteredPaymentDetails)
    student_id: str = Field(default="", max_length=40)
    student_name: str = Field(default="", max_length=120)


class ChecklistRequest(CamelModel):
    university_id: str = Field(max_length=40)
    payment_deadline: str = Field(max_length=10)
    origin_country: str = Field(default="", max_length=80)
    payment_status: Literal["not_started", "initiated_with_bank", "receipt_obtained"] = "not_started"
    unresolved_issues: list[str] = Field(default_factory=list, max_length=20)
    student_id: str = Field(default="", max_length=40)
    student_name: str = Field(default="", max_length=120)

    @field_validator("payment_deadline")
    @classmethod
    def _deadline(cls, v: str) -> str:
        return check_iso_date(v)


JsonDict = dict[str, Any]
