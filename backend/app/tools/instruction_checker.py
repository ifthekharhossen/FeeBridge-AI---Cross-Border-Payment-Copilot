"""check_payment_instructions: rule-based comparison against SAMPLE university records.

Port of verifyPaymentDetails() in src/utils/calculations.ts, with two deliberate fixes:
  * bank name: token overlap instead of "first word equal" (which matched any "BANK ...")
  * reference: per-university pattern instead of "contains '-' and length >= 8"
Fields the caller did not provide are reported as 'missing', never assumed correct.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any

from .data import get_university, public_university

_GENERIC = {"BANK", "OF", "THE", "AND", "PLC", "N", "A", "BRANCH", "SUB", "BERHAD", "LTD", "CO", "NA"}


def _tokens(s: str, drop_generic: bool = False) -> set[str]:
    toks = set(re.findall(r"[A-Z0-9]+", s.upper()))
    return toks - _GENERIC if drop_generic else toks


def _norm_compact(s: str) -> str:
    return re.sub(r"[\s\-]+", "", s or "").upper()


def expected_reference(u: dict[str, Any], student_id: str, student_name: str) -> str | None:
    """Personalised reference when the university's format can be built from known data."""
    tpl = u.get("referenceTemplate")
    sid = re.sub(r"\s+", "", student_id or "")
    if not tpl or not sid:
        return None
    surname = ""
    if "{surname}" in tpl:
        parts = re.findall(r"[A-Za-z]+", student_name or "")
        if not parts:
            return None
        surname = parts[-1].upper()
    return tpl.format(student_id=sid, surname=surname)


def _check(field, label, entered, expected, status, explanation, guidance):
    return {
        "field": field, "label": label, "enteredValue": entered or "(Empty)",
        "expectedValue": expected, "status": status,
        "explanation": explanation, "guidance": guidance,
    }


def check_payment_instructions(
    university_id: str,
    beneficiary_name: str = "",
    bank_name: str = "",
    account_no: str = "",
    swift_bic: str = "",
    reference: str = "",
    student_id: str = "",
    student_name: str = "",
) -> dict[str, Any]:
    u = get_university(university_id)
    if u is None:
        raise ValueError(f"Unknown university id '{university_id}'")

    personalised = expected_reference(u, student_id, student_name)
    ref_expected_display = personalised or u["exampleReference"]
    nothing_entered = not any(
        (x or "").strip() for x in (beneficiary_name, bank_name, account_no, swift_bic, reference)
    )
    checks: list[dict[str, Any]] = []

    # 1. Beneficiary
    exp = u["officialBeneficiaryName"]
    ent = beneficiary_name.strip()
    if not ent:
        checks.append(_check("beneficiaryName", "Beneficiary Name", "", exp, "missing",
                             "Beneficiary name has not been entered yet.",
                             "Must match the official university accounts name letter-for-letter."))
    elif ent.upper() == exp.upper():
        checks.append(_check("beneficiaryName", "Beneficiary Name", ent, exp, "match",
                             "Exact match with the sample university record.",
                             "Re-confirm against your official invoice."))
    else:
        et, xt = _tokens(ent), _tokens(exp)
        close = len(et) >= 2 and (et <= xt or len(et & xt) / len(xt) >= 0.5)
        checks.append(_check("beneficiaryName", "Beneficiary Name", ent, exp,
                             "needs_confirmation" if close else "mismatch",
                             "Close, but differs from the official title." if close
                             else "Does not match the official receiving entity.",
                             f'Use exactly: "{exp}".' if close
                             else "Risk of wire rejection. Verify with the official tuition invoice."))

    # 2. Bank
    exp = u["officialBankName"]
    ent = bank_name.strip()
    if not ent:
        checks.append(_check("bankName", "Receiving Bank Name", "", exp, "missing",
                             "Receiving bank name has not been entered yet.",
                             f"Sample record lists: {exp}."))
    else:
        xt = _tokens(exp, True)
        score = len(_tokens(ent, True) & xt) / len(xt) if xt else 0.0
        if score >= 0.5:
            st, ex = "match", "Matches the sample receiving bank and branch."
        elif score > 0:
            st, ex = "needs_confirmation", "Bank may be right but the branch/details differ."
        else:
            st, ex = "mismatch", "Differs from the sample university deposit bank."
        checks.append(_check("bankName", "Receiving Bank Name", ent, exp, st, ex,
                             f"Verify on your official invoice. Sample record: {exp}"))

    # 3. Account
    exp = u["officialAccountNo"]
    ent = account_no.strip()
    if not ent:
        checks.append(_check("accountNo", "Account / IBAN", "", exp, "missing",
                             "Account or IBAN has not been entered yet.",
                             "Must be an exact match, digit for digit."))
    elif _norm_compact(ent) == _norm_compact(exp):
        checks.append(_check("accountNo", "Account / IBAN", ent, exp, "match",
                             "Matches the sample record.", "Re-confirm against your official invoice."))
    else:
        checks.append(_check("accountNo", "Account / IBAN", ent, exp, "mismatch",
                             "Does not match the sample record.",
                             "Do not send. Verify the number on the official invoice."))

    # 4. SWIFT / BIC
    exp = u["officialSwiftBic"]
    ent = swift_bic.strip()
    if not ent:
        checks.append(_check("swiftBic", "SWIFT / BIC Code", "", exp, "missing",
                             "SWIFT/BIC has not been entered yet.",
                             "International transfers need a valid 8 or 11 character code."))
    elif _norm_compact(ent) == _norm_compact(exp):
        checks.append(_check("swiftBic", "SWIFT / BIC Code", ent, exp, "match",
                             "Matches the sample record.", "Re-confirm against your official invoice."))
    else:
        checks.append(_check("swiftBic", "SWIFT / BIC Code", ent, exp, "mismatch",
                             "Does not match the sample record.",
                             f"Expected {exp}. A wrong code may cause funds to be returned or delayed."))

    # 5. Reference
    ent = reference.strip()
    if not ent:
        checks.append(_check("reference", "Payment Reference (Field 70)", "", ref_expected_display, "missing",
                             "No payment reference entered.",
                             f'Required format: {u["requiredReferenceFormat"]}. '
                             f"Without it the finance office may not identify your payment."))
    elif personalised and ent.upper() == personalised.upper():
        checks.append(_check("reference", "Payment Reference (Field 70)", ent, ref_expected_display, "match",
                             "Matches the required reference for this student.",
                             "Ask your bank to copy it verbatim into Field 70."))
    elif re.match(u["referenceRegex"], ent.upper()):
        checks.append(_check("reference", "Payment Reference (Field 70)", ent, ref_expected_display,
                             "match" if not personalised else "needs_confirmation",
                             "Follows the required format." if not personalised
                             else "Follows the format but differs from the reference built from your student ID/name.",
                             "Ask your bank to copy it verbatim into Field 70." if not personalised
                             else f"Expected for you: {personalised}."))
    else:
        checks.append(_check("reference", "Payment Reference (Field 70)", ent, ref_expected_display,
                             "needs_confirmation",
                             "Present, but does not follow the required format.",
                             f'Required format: {u["requiredReferenceFormat"]}. Example: {ref_expected_display}.'))

    statuses = {c["status"] for c in checks}
    if "mismatch" in statuses:
        overall, score = "critical_mismatch", 40
        summary = "Mismatch detected. Do not proceed until the beneficiary and account details are reconciled with the official invoice."
    elif nothing_entered:
        overall, score = "action_required", 50
        summary = "No payment details have been entered yet, so nothing could be verified. Official sample instructions are shown for comparison."
    elif statuses & {"missing", "needs_confirmation"}:
        overall, score = "action_required", 75
        summary = "Action required: complete or confirm the flagged fields before sending."
    else:
        overall, score = "verified", 100
        summary = "All entered fields match the sample university record. Still confirm with the university before sending."

    return {
        "universityId": u["id"],
        "university": public_university(u),
        "overallStatus": overall,
        "matchScore": score,
        "checks": checks,
        "summary": summary,
        "verifiedAt": datetime.now(timezone.utc).isoformat(),
        "nothingEntered": nothing_entered,
        "expectedReference": ref_expected_display,
        "disclaimer": "Checked against SAMPLE university records, not live bank data. Always confirm with the university and your bank.",
    }
