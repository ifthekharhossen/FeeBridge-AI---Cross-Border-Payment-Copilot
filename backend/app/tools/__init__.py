"""Tool registry: JSON schemas the LLM sees + safe execution + UI execution records.

The LLM only chooses WHICH tool to call and with what arguments. All numbers, checks and
checklist items are produced by the Python functions in this package.
"""
from __future__ import annotations

import time
from dataclasses import dataclass
from datetime import date, datetime
from typing import Any

from ..schemas import PaymentPlanInput, check_currency, check_iso_date
from .checklist import create_payment_checklist
from .cost_calculator import compare_transfer_costs
from .data import get_university
from .instruction_checker import check_payment_instructions, expected_reference

TOOL_NAMES = ("compare_transfer_costs", "check_payment_instructions", "create_payment_checklist")

TOOL_SPECS: list[dict[str, Any]] = [
    {
        "name": "compare_transfer_costs",
        "description": (
            "Compare ILLUSTRATIVE total costs of three sample transfer routes (student fintech rail, digital rail, "
            "commercial bank wire) using sample rates/fees. Not live quotes. All arguments are optional and default "
            "to the student's current payment plan."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "amount": {"type": "number", "description": "Tuition amount in the tuition currency"},
                "tuition_currency": {"type": "string", "description": "ISO code, e.g. CNY"},
                "source_currency": {"type": "string", "description": "ISO code the student pays from, e.g. BDT"},
            },
        },
    },
    {
        "name": "check_payment_instructions",
        "description": (
            "Check payment details against the SAMPLE university payment record and return matched, missing and "
            "mismatched fields plus the required payment reference. Pass entered fields only if the user actually "
            "provided them; never guess values. Defaults to the plan's university."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "university_id": {"type": "string", "description": "e.g. zju, tsinghua, uom, unimelb, neu, um"},
                "beneficiary_name": {"type": "string"},
                "bank_name": {"type": "string"},
                "account_no": {"type": "string"},
                "swift_bic": {"type": "string"},
                "reference": {"type": "string", "description": "Payment reference (Field 70) entered by the user"},
            },
        },
    },
    {
        "name": "create_payment_checklist",
        "description": (
            "Create a dated, prioritised checklist for completing the payment before the deadline. Defaults to the "
            "student's plan. This tool never sends money."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "university_id": {"type": "string"},
                "deadline": {"type": "string", "description": "ISO date YYYY-MM-DD"},
                "payment_status": {"type": "string", "enum": ["not_started", "initiated_with_bank", "receipt_obtained"]},
                "unresolved_issues": {"type": "array", "items": {"type": "string"}},
            },
        },
    },
]


@dataclass
class ToolContext:
    plan: PaymentPlanInput
    today: date | None = None


@dataclass
class ToolRun:
    name: str
    args: dict[str, Any]
    result: dict[str, Any]
    execution: dict[str, Any]
    ok: bool


def money(amount: float, currency: str) -> str:
    return f"{currency} {amount:,.0f}" if float(amount).is_integer() else f"{currency} {amount:,.2f}"


def _now_label() -> str:
    return datetime.now().strftime("%I:%M %p").lstrip("0")


def _finding(kind: str, text: str) -> dict[str, str]:
    return {"type": kind, "text": text}


# ---- execution (argument resolution + validation) --------------------------

def _resolve(name: str, raw: dict[str, Any], ctx: ToolContext) -> dict[str, Any]:
    p = ctx.plan
    raw = raw if isinstance(raw, dict) else {}
    if name == "compare_transfer_costs":
        amount = raw.get("amount", p.tuition_amount)
        if isinstance(amount, bool) or not isinstance(amount, (int, float)) or not (0 < amount <= 10_000_000):
            raise ValueError("amount must be a positive number up to 10,000,000")
        return {
            "tuition_amount": float(amount),
            "tuition_currency": check_currency(str(raw.get("tuition_currency") or p.tuition_currency)),
            "source_currency": check_currency(str(raw.get("source_currency") or p.source_currency)),
        }
    if name == "check_payment_instructions":
        out = {"university_id": str(raw.get("university_id") or p.university_id)}
        for k in ("beneficiary_name", "bank_name", "account_no", "swift_bic", "reference"):
            v = raw.get(k, "")
            out[k] = v.strip()[:200] if isinstance(v, str) else ""
        out["student_id"], out["student_name"] = p.student_id, p.student_name
        return out
    if name == "create_payment_checklist":
        issues = raw.get("unresolved_issues") or []
        if not isinstance(issues, list):
            raise ValueError("unresolved_issues must be a list of strings")
        status = raw.get("payment_status", "not_started")
        if status not in {"not_started", "initiated_with_bank", "receipt_obtained"}:
            raise ValueError("invalid payment_status")
        return {
            "university_id": str(raw.get("university_id") or p.university_id),
            "payment_deadline": check_iso_date(str(raw.get("deadline") or p.payment_deadline)),
            "origin_country": p.origin_country,
            "payment_status": status,
            "unresolved_issues": [str(i) for i in issues if str(i).strip()][:10],
        }
    raise ValueError(f"Unknown tool '{name}'")


def run_tool(name: str, raw_args: dict[str, Any], ctx: ToolContext, seq: int = 1) -> ToolRun:
    exec_id = f"tool-{int(time.time() * 1000)}-{seq}"
    label = {
        "compare_transfer_costs": "Comparing illustrative transfer costs",
        "check_payment_instructions": "Checking university payment instructions",
        "create_payment_checklist": "Preparing payment checklist",
    }.get(name, name)
    try:
        args = _resolve(name, raw_args, ctx)
        if name == "compare_transfer_costs":
            result = compare_transfer_costs(**args)
        elif name == "check_payment_instructions":
            result = check_payment_instructions(**args)
        else:
            u = get_university(args["university_id"])
            ref = expected_reference(u, ctx.plan.student_id, ctx.plan.student_name) if u else None
            result = create_payment_checklist(**args, student_reference=ref, today=ctx.today)
        status, summary, findings = _summarise(name, args, result)
        shown = {k: v for k, v in args.items() if k not in {"student_id", "student_name"}}
        ok = True
    except ValueError as exc:
        args = raw_args if isinstance(raw_args, dict) else {}
        shown, result, ok = args, {"error": str(exc)}, False
        status, summary = "flagged", f"Tool could not run: {exc}"
        findings = [_finding("alert", str(exc))]
    return ToolRun(
        name=name, args=args, result=result, ok=ok,
        execution={
            "id": exec_id, "toolName": name, "label": label, "status": status,
            "timestamp": _now_label(), "inputPayload": shown,
            "outputSummary": summary, "findings": findings,
        },
    )


# ---- human-readable summaries (deterministic, generated from tool output) --

def _summarise(name: str, args: dict[str, Any], r: dict[str, Any]):
    if name == "compare_transfer_costs":
        routes = r["routes"]
        best = next(x for x in routes if x["id"] == r["lowestCostRouteId"])
        src = r["sourceCurrency"]
        findings = [
            _finding("success", f"Compared {len(routes)} sample routes for {money(r['tuitionAmount'], r['tuitionCurrency'])}."),
            _finding("info", f"Lowest illustrative total: {best['name']} at ~{money(best['estimatedOriginCost'], src)}."),
        ]
        bank = next(x for x in routes if x["id"] == "direct_bank")
        findings.append(_finding("warning", f"{bank['name']}: higher markup and possible intermediary deductions (~{money(bank['estimatedOriginCost'], src)})."))
        findings.append(_finding("info", "Sample rates and fees only. Not a live quote."))
        return "completed", f"Evaluated {len(routes)} routes. Lowest illustrative total: {best['name']} at ~{money(best['estimatedOriginCost'], src)}.", findings

    if name == "check_payment_instructions":
        checks = r["checks"]
        findings = []
        for c in checks:
            if c["status"] == "match":
                findings.append(_finding("success", f"{c['label']}: matches the sample record."))
            elif c["status"] == "mismatch":
                findings.append(_finding("alert", f"{c['label']}: {c['explanation']}"))
            else:
                findings.append(_finding("warning", f"{c['label']}: {c['explanation']}"))
        flagged = r["overallStatus"] != "verified"
        n = sum(1 for c in checks if c["status"] != "match")
        return ("flagged" if flagged else "completed",
                f"{r['summary']} ({n} of {len(checks)} fields need attention.)" if flagged else r["summary"], findings)

    tasks = r["tasks"]
    findings = [
        _finding("success", f"Generated {len(tasks)} prioritised tasks, starting with: {tasks[0]['title']}"),
        _finding("info", f"Suggested latest start for the transfer: {r['initiateBy']} (illustrative buffer)."),
    ]
    findings += [_finding("warning", w) for w in r["warnings"]]
    return ("flagged" if r["warnings"] else "completed",
            f"Created {len(tasks)} tasks; start the transfer by {r['initiateBy']}.", findings)
