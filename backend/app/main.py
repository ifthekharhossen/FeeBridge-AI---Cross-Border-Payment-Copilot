"""FeeBridge AI backend (FastAPI).

Run from the backend/ folder:  uvicorn app.main:app --reload --port 8000
"""
from __future__ import annotations

import logging
from datetime import date, datetime, timezone
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from . import __version__
from .agent import DISCLAIMER, run_agent
from .config import Settings, load_settings
from .llm_providers import LLMError
from .schemas import ChatRequest, CheckRequest, ChecklistRequest, CompareRequest
from .tools.checklist import create_payment_checklist
from .tools.cost_calculator import compare_transfer_costs
from .tools.data import fx_config, public_university, universities
from .tools.instruction_checker import check_payment_instructions, expected_reference

log = logging.getLogger("feebridge")


def _error(status: int, code: str, message: str, details: Any = None) -> JSONResponse:
    body: dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        body["error"]["details"] = details
    return JSONResponse(status_code=status, content=body)


def create_app(settings: Settings | None = None, provider: Any = None) -> FastAPI:
    """`settings`/`provider` can be injected for tests."""
    cfg = settings or load_settings()
    app = FastAPI(title="FeeBridge AI backend", version=__version__,
                  description="Tool-using payment-planning agent. Illustrative sample data only.")
    app.state.settings, app.state.provider = cfg, provider

    app.add_middleware(
        CORSMiddleware, allow_origins=list(cfg.cors_origins), allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type"],
    )

    # ---- error handling: every error is {"error": {code, message, details?}} ----
    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError):
        details = [{"field": ".".join(str(p) for p in e["loc"] if p != "body"), "message": e["msg"]}
                   for e in exc.errors()]
        return _error(422, "validation_error", "The request was invalid.", details)

    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException):
        return _error(exc.status_code, "http_error", str(exc.detail))

    @app.exception_handler(LLMError)
    async def _llm(_: Request, exc: LLMError):
        log.warning("LLM error: %s", exc)
        return _error(502, "llm_unavailable", "The AI provider could not complete the request.")

    @app.exception_handler(Exception)
    async def _unhandled(_: Request, exc: Exception):
        log.exception("Unhandled error")
        return _error(500, "internal_error", "Something went wrong on the server.")

    # ---- endpoints ----
    @app.get("/api/health")
    async def health():
        s = app.state.settings
        provider_name = s.resolved_provider
        if app.state.provider is not None:
            provider_name = getattr(app.state.provider, "name", "custom")
        demo = provider_name == "demo"
        return {
            "status": "ok", "service": "feebridge-backend", "version": __version__,
            "time": datetime.now(timezone.utc).isoformat(),
            "demoMode": demo,
            "llm": {"mode": "demo" if demo else "llm", "provider": None if demo else provider_name,
                    "model": None if demo else s.active_model, "fallbackToDemo": s.llm_fallback_to_demo},
            "dataNotice": "Sample data only: illustrative rates, fees and university records.",
        }

    @app.post("/api/agent/chat")
    async def agent_chat(req: ChatRequest):
        return await run_agent(req, app.state.settings, provider=app.state.provider)

    @app.post("/api/payment/compare")
    async def payment_compare(req: CompareRequest):
        return compare_transfer_costs(req.tuition_amount, req.tuition_currency, req.source_currency)

    @app.post("/api/payment/check")
    async def payment_check(req: CheckRequest):
        if req.university_id.strip().lower() not in universities():
            return _error(404, "unknown_university", f"Unknown university id '{req.university_id}'.")
        e = req.entered
        return check_payment_instructions(
            req.university_id, e.beneficiary_name, e.bank_name, e.account_no, e.swift_bic, e.reference,
            req.student_id, req.student_name)

    @app.post("/api/payment/checklist")
    async def payment_checklist(req: ChecklistRequest):
        u = universities().get(req.university_id.strip().lower())
        if u is None:
            return _error(404, "unknown_university", f"Unknown university id '{req.university_id}'.")
        ref = expected_reference(u, req.student_id, req.student_name)
        return create_payment_checklist(
            req.university_id, req.payment_deadline, req.origin_country, req.payment_status,
            req.unresolved_issues, student_reference=ref)

    @app.get("/api/universities")
    async def list_universities():
        return {"universities": [public_university(u) for u in universities().values()],
                "disclaimer": "Sample university records for demonstration only."}

    @app.get("/api/rates")
    async def sample_rates():
        c = fx_config()
        return {"ratesPerUsd": c["ratesPerUsd"], "illustrative": True,
                "disclaimer": "Illustrative sample rates. NOT live market rates."}

    return app


app = create_app()
