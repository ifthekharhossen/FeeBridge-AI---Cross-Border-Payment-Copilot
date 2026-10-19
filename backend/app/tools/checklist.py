"""create_payment_checklist: ordered, dated action checklist (shape: ChecklistTask[])."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from .data import get_university

PRIORITY_RANK = {"high": 0, "medium": 1, "low": 2}
TRANSIT_DAYS = 3  # illustrative upper bound for a bank/provider transfer in this sample


def _task(key, title, category, priority, details, due, external=True):
    return {
        "id": f"chk-{key}", "title": title, "category": category, "priority": priority,
        "completed": False, "requiresExternalConfirmation": external,
        "details": details, "dueDate": due.isoformat(), "source": "auto_generated",
    }


def create_payment_checklist(
    university_id: str,
    payment_deadline: str,
    origin_country: str = "",
    payment_status: str = "not_started",
    unresolved_issues: list[str] | None = None,
    student_reference: str | None = None,
    today: date | None = None,
) -> dict[str, Any]:
    u = get_university(university_id)
    if u is None:
        raise ValueError(f"Unknown university id '{university_id}'")
    today = today or date.today()
    deadline = date.fromisoformat(payment_deadline)
    buffer_days = int(u["depositDeadlineBufferDays"])
    initiate_by = deadline - timedelta(days=buffer_days + TRANSIT_DAYS)
    days_left = (deadline - today).days
    warnings: list[str] = []

    if days_left < 0:
        warnings.append("The stated deadline has already passed. Contact the university about an extension.")
    elif initiate_by < today:
        warnings.append(
            f"Tight timeline: with a {buffer_days}-day university buffer plus ~{TRANSIT_DAYS} days transit, "
            f"the transfer should have started by {initiate_by.isoformat()}. Ask the university whether the deadline can flex."
        )

    def clamp(d: date) -> date:
        return max(d, today) if days_left >= 0 else d

    ref_txt = student_reference or u["exampleReference"]
    tasks: list[dict[str, Any]] = []

    for i, issue in enumerate((unresolved_issues or [])[:10], start=1):
        tasks.append(_task(f"issue{i}", f"Resolve: {issue.strip()[:140]}", "verification", "high",
                           "Flagged during payment-instruction verification. Resolve before sending funds.",
                           clamp(initiate_by - timedelta(days=2)), external=False))

    status_rank = {"not_started": 0, "initiated_with_bank": 1, "receipt_obtained": 2}[payment_status]

    if status_rank < 1:
        tasks += [
            _task("verify-account", "Verify beneficiary account and SWIFT/BIC against the official invoice",
                  "verification", "high",
                  f'Sample record: {u["officialBankName"]}, SWIFT {u["officialSwiftBic"]}. Confirm on your official invoice.',
                  clamp(initiate_by - timedelta(days=3)), external=False),
            _task("reference", f"Use the required payment reference: {ref_txt}", "verification", "high",
                  f'Required format: {u["requiredReferenceFormat"]}. {u["specialInstructions"]}',
                  clamp(initiate_by - timedelta(days=2))),
            _task("fx", "Get a live quote from your chosen provider and compare with the illustrative estimate",
                  "financial", "medium",
                  "Rates in this app are illustrative samples. Confirm the real rate and total fees before paying.",
                  clamp(initiate_by - timedelta(days=1)), external=False),
        ]
        if origin_country.strip().lower() == "bangladesh":
            tasks.append(_task("origin-bank", "Ask your authorised dealer bank what student documents it needs for an outward remittance",
                               "documentation", "high",
                               "Banks in Bangladesh typically ask for admission documents; confirm current requirements directly with your bank.",
                               clamp(initiate_by - timedelta(days=1))))
        tasks.append(_task("initiate", "Initiate the transfer with your chosen bank or provider",
                           "financial", "high",
                           f"Aim to start by {initiate_by.isoformat()} so funds can arrive before the deadline. This app does not send money.",
                           clamp(initiate_by)))
    if status_rank < 2:
        tasks += [
            _task("receipt", "Obtain the official transfer confirmation (e.g. SWIFT MT103 or provider receipt)",
                  "financial", "high", "Request it from the remitting institution once the transfer is dispatched.",
                  clamp(initiate_by + timedelta(days=1))),
            _task("upload", "Submit proof of payment to the university", "confirmation", "medium",
                  u["specialInstructions"], clamp(initiate_by + timedelta(days=2))),
        ]
    tasks.append(_task("clearance", "Confirm with the university that the payment has been received and allocated",
                       "confirmation", "medium", "Check the university ledger or international office before your deadline.",
                       clamp(deadline - timedelta(days=1))))

    tasks.sort(key=lambda t: (t["dueDate"], PRIORITY_RANK[t["priority"]]))
    return {
        "tasks": tasks,
        "initiateBy": initiate_by.isoformat(),
        "daysUntilDeadline": days_left,
        "warnings": warnings,
        "disclaimer": "Planning checklist only. Verify every step with your bank and university.",
    }
