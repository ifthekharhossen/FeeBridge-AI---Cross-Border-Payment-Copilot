"""compare_transfer_costs: deterministic, illustrative route comparison.

Rates/fees come from app/data/fx_rates.json (sample data). Nothing here is a live quote.
Logic is a port of calculateTransferRoutes() in src/utils/calculations.ts.
"""
from __future__ import annotations

import math
from typing import Any

from .data import fx_config

ROUTE_META: dict[str, dict[str, Any]] = {
    "student_fintech": {
        "name": "International Student FinTech Rail",
        "badgeTitle": "University Integrated",
        "estimatedDays": "1 \u2013 2 business days",
        "trackingScore": "End-to-End",
        "intermediaryBankRisk": "Zero (Guaranteed gross)",
        "pros": [
            "Direct integration with university admissions ledger",
            "Guaranteed zero intermediary correspondent deductions",
            "Official university confirmation receipt provided automatically",
        ],
        "cons": ["Requires payment within 48-hour locked quote window"],
        "recommendedFor": "Best for peace-of-mind tuition matching and avoiding short-payment holds.",
    },
    "digital_rail": {
        "name": "Digital Multi-Currency Rail",
        "badgeTitle": "Competitive Rate",
        "estimatedDays": "1 \u2013 3 business days",
        "trackingScore": "Real-Time",
        "intermediaryBankRisk": "Low",
        "pros": [
            "Transparent mid-market benchmarked exchange rates",
            "Live tracking portal with status notifications",
        ],
        "cons": [
            "Must ensure sender name exactly matches university student name",
            "Local payout partner varies by destination region",
        ],
        "recommendedFor": "Cost-conscious students sending funds with pre-verified bank accounts.",
    },
    "direct_bank": {
        "name": "Commercial Bank Direct Wire (SWIFT)",
        "badgeTitle": "Traditional SWIFT",
        "estimatedDays": "3 \u2013 5 business days",
        "trackingScore": "Basic",
        "intermediaryBankRisk": "High (Deductions possible)",
        "pros": [
            "Supported by nearly all physical high-street bank branches",
            "Direct bank-to-bank SWIFT MT103 telegraphic message generated",
        ],
        "cons": [
            "Higher retail exchange rate markup",
            "Intermediary correspondent banks may deduct $15\u2013$35 en route",
            "Manual student ID matching by university finance office required",
        ],
        "recommendedFor": "Students who must pay over the counter using physical cash or local bank loans.",
    },
}
ROUTE_ORDER = ["student_fintech", "digital_rail", "direct_bank"]  # same order the UI uses


def js_round(x: float) -> int:
    """JavaScript Math.round semantics (half rounds up), to match the frontend."""
    return int(math.floor(x + 0.5))


def illustrative_rate(source_currency: str, tuition_currency: str) -> float:
    """1 unit of tuition_currency = N units of source_currency (sample data only)."""
    if source_currency == tuition_currency:
        return 1.0
    rates = fx_config()["ratesPerUsd"]
    for code in (source_currency, tuition_currency):
        if code not in rates:
            raise ValueError(f"No sample rate for currency '{code}'")
    return round(rates[source_currency] / rates[tuition_currency], 4)


def _fixed_fee(route_key: str, source_currency: str) -> float:
    fees = fx_config()["routes"][route_key]["fixedFee"]
    return float(fees.get(source_currency, fees["default"]))


def compare_transfer_costs(
    tuition_amount: float, tuition_currency: str, source_currency: str
) -> dict[str, Any]:
    """Return illustrative costs for the three sample routes (shape: TransferRoute[])."""
    base = illustrative_rate(source_currency, tuition_currency)
    cfg = fx_config()["routes"]
    routes: list[dict[str, Any]] = []

    for key in ROUTE_ORDER:
        markup = cfg[key]["fxMarkupPercent"]
        pct_fee = cfg[key]["percentFee"]
        rate = base * (1 + markup / 100)
        fixed = _fixed_fee(key, source_currency)
        converted = tuition_amount * rate
        variable_fee = converted * pct_fee / 100
        total = js_round(converted + fixed + variable_fee)
        shown_fixed = js_round(fixed + variable_fee) if pct_fee else fixed
        routes.append(
            {
                "id": key,
                "providerType": key,
                "illustrativeRate": round(rate, 4),
                "rateInverted": round(1 / rate, 6),
                "fixedFeeOriginCurrency": shown_fixed,
                "variableFeePercent": pct_fee if key == "digital_rail" else markup,
                "estimatedOriginCost": total,
                "estimatedRecipientAmount": tuition_amount,
                **ROUTE_META[key],
            }
        )

    cheapest = min(routes, key=lambda r: r["estimatedOriginCost"])
    cheapest["isLowestCost"] = True

    return {
        "routes": routes,
        "lowestCostRouteId": cheapest["id"],
        "baseIllustrativeRate": base,
        "tuitionAmount": tuition_amount,
        "tuitionCurrency": tuition_currency,
        "sourceCurrency": source_currency,
        "disclaimer": (
            "Illustrative sample rates and fees for planning only. This is NOT a live quote; "
            "confirm the real rate and fees with your bank or provider before paying."
        ),
    }
