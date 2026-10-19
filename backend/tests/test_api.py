import json
from datetime import date

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.llm_providers import AnthropicProvider, OpenAICompatibleProvider
from app.main import create_app
from app.privacy import Redactor
from app.schemas import PaymentPlanInput
from app.tools import ToolContext, run_tool
from app.tools.cost_calculator import compare_transfer_costs
from app.tools.instruction_checker import check_payment_instructions

PLAN = dict(originCountry="Bangladesh", destinationCountry="China", universityId="zju",
            universityName="Zhejiang University", tuitionAmount=8000, tuitionCurrency="CNY",
            sourceCurrency="BDT", paymentDeadline="2026-10-28", paymentPurpose="Tuition Deposit",
            studentName="Farhan Ahmed", studentId="32401899")


def demo_client(**kw):
    return TestClient(create_app(Settings(llm_provider="demo", **kw)))


# ---------------- tools ----------------

def test_compare_matches_frontend_numbers():
    r = compare_transfer_costs(8000, "CNY", "BDT")
    by = {x["id"]: x for x in r["routes"]}
    assert by["student_fintech"]["estimatedOriginCost"] == 136134   # same as calculations.ts
    assert by["student_fintech"]["isLowestCost"] is True
    assert by["direct_bank"]["fixedFeeOriginCurrency"] == 2600
    assert by["digital_rail"]["estimatedOriginCost"] > by["student_fintech"]["estimatedOriginCost"]
    assert "NOT a live quote" in r["disclaimer"]


def test_instruction_checker_fixes_loose_matching():
    r = check_payment_instructions("zju", bank_name="HSBC BANK", reference="TUITION-FEE",
                                   account_no="376 658 348 921", swift_bic="bkchcnbj920",
                                   beneficiary_name="ZHEJIANG UNIVERSITY INTERNATIONAL COLLEGE",
                                   student_id="32401899", student_name="Farhan Ahmed")
    st = {c["field"]: c["status"] for c in r["checks"]}
    assert st["bankName"] == "mismatch"            # old UI check passed any bank starting with "BANK"
    assert st["reference"] == "needs_confirmation"  # old UI check passed any "xxx-yyyyy"
    assert st["accountNo"] == st["swiftBic"] == st["beneficiaryName"] == "match"
    assert r["overallStatus"] == "critical_mismatch"


def test_correct_reference_and_all_fields_verified():
    r = check_payment_instructions("zju", "ZHEJIANG UNIVERSITY INTERNATIONAL COLLEGE",
                                   "Bank of China, Hangzhou Yuquan Sub-branch", "376658348921",
                                   "BKCHCNBJ920", "ZJU-32401899-AHMED", "32401899", "Farhan Ahmed")
    assert r["overallStatus"] == "verified"


def test_missing_fields_are_never_assumed_correct():
    r = check_payment_instructions("zju", student_id="32401899", student_name="Farhan Ahmed")
    assert all(c["status"] == "missing" for c in r["checks"]) and r["nothingEntered"]
    assert r["expectedReference"] == "ZJU-32401899-AHMED"


def test_checklist_tight_deadline_warns():
    ctx = ToolContext(PaymentPlanInput(**PLAN), today=date(2026, 10, 27))
    run = run_tool("create_payment_checklist", {}, ctx)
    assert run.execution["status"] == "flagged" and run.result["warnings"]


def test_tool_errors_are_reported_not_raised():
    ctx = ToolContext(PaymentPlanInput(**PLAN))
    run = run_tool("compare_transfer_costs", {"tuition_currency": "XXX"}, ctx)
    assert not run.ok and run.execution["status"] == "flagged"


# ---------------- HTTP API ----------------

def test_health_demo_mode():
    j = demo_client().get("/api/health").json()
    assert j["status"] == "ok" and j["demoMode"] is True and "key" not in json.dumps(j).lower()


@pytest.mark.parametrize("msg,tools", [
    ("Plan my tuition payment", ["compare_transfer_costs", "check_payment_instructions", "create_payment_checklist"]),
    ("Compare transfer costs", ["compare_transfer_costs"]),
    ("Check payment instructions", ["check_payment_instructions"]),
    ("Prepare a payment checklist", ["create_payment_checklist"]),
    ("hello there", []),
])
def test_demo_agent_routes_and_labels(msg, tools):
    r = demo_client().post("/api/agent/chat", json={"message": msg, "plan": PLAN})
    assert r.status_code == 200
    j = r.json()
    assert j["mode"] == "demo" and [t["toolName"] for t in j["tools"]] == tools
    m = j["replyMessage"]
    assert m["sender"] == "assistant" and m["content"].startswith("[DEMO MODE")
    assert "**" not in m["content"]
    assert m["structuredBreakdown"]["actionItems"]
    assert "cannot send money" in j["disclaimer"]


def test_demo_reference_in_message_is_checked():
    r = demo_client().post("/api/agent/chat", json={"message": "Check my reference TUITION-FEE", "plan": PLAN}).json()
    titles = [f["title"] for f in r["replyMessage"]["structuredBreakdown"]["verificationFindings"]]
    assert any("Payment Reference" in t and "Needs confirmation" in t for t in titles)


@pytest.mark.parametrize("patch,field", [
    ({"tuitionAmount": -5}, "plan.tuitionAmount"),
    ({"tuitionCurrency": "ZZZ"}, "plan.tuitionCurrency"),
    ({"paymentDeadline": "tomorrow"}, "plan.paymentDeadline"),
])
def test_validation_errors_are_structured(patch, field):
    r = demo_client().post("/api/agent/chat", json={"message": "plan", "plan": {**PLAN, **patch}})
    assert r.status_code == 422
    e = r.json()["error"]
    assert e["code"] == "validation_error" and any(field in d["field"] for d in e["details"])


def test_unknown_route_and_university_errors():
    c = demo_client()
    assert c.get("/api/nope").json()["error"]["code"] == "http_error"
    r = c.post("/api/payment/check", json={"universityId": "nope"})
    assert r.status_code == 404 and r.json()["error"]["code"] == "unknown_university"


def test_direct_payment_endpoints():
    c = demo_client()
    assert c.post("/api/payment/compare", json={"tuitionAmount": 8000, "tuitionCurrency": "cny", "sourceCurrency": "BDT"}).status_code == 200
    r = c.post("/api/payment/check", json={"universityId": "zju", "entered": {"reference": "ZJU-32401899-AHMED"},
                                           "studentId": "32401899", "studentName": "Farhan Ahmed"}).json()
    assert {x["field"]: x["status"] for x in r["checks"]}["reference"] == "match"
    r = c.post("/api/payment/checklist", json={"universityId": "zju", "paymentDeadline": "2026-10-28"}).json()
    assert r["tasks"] and r["tasks"][0]["source"] == "auto_generated"


def test_cors_allows_only_configured_origins():
    c = demo_client(cors_origins=("http://localhost:3000",))
    ok = c.options("/api/agent/chat", headers={"Origin": "http://localhost:3000",
                                               "Access-Control-Request-Method": "POST",
                                               "Access-Control-Request-Headers": "content-type"})
    assert ok.headers.get("access-control-allow-origin") == "http://localhost:3000"
    bad = c.options("/api/agent/chat", headers={"Origin": "http://evil.example",
                                                "Access-Control-Request-Method": "POST"})
    assert "access-control-allow-origin" not in bad.headers


# ---------------- LLM loops (mocked provider HTTP) ----------------

def _client_with(provider_cls, handler, **settings_kw):
    s = Settings(llm_provider="anthropic" if provider_cls is AnthropicProvider else "openai_compatible",
                 anthropic_api_key="sk-test", openai_compat_api_key="sk-test", **settings_kw)
    prov = provider_cls(s, transport=httpx.MockTransport(handler))
    return TestClient(create_app(s, provider=prov))


def test_anthropic_tool_loop_and_pii_redaction():
    seen = []

    def handler(req: httpx.Request):
        body = json.loads(req.content)
        seen.append(body)
        assert req.headers["x-api-key"] == "sk-test"
        if len(seen) == 1:
            return httpx.Response(200, json={"stop_reason": "tool_use", "content": [
                {"type": "tool_use", "id": "t1", "name": "compare_transfer_costs", "input": {}},
                {"type": "tool_use", "id": "t2", "name": "check_payment_instructions",
                 "input": {"reference": "ZJU-[STUDENT_ID]-[NAME_PART_2]"}}]})
        return httpx.Response(200, json={"stop_reason": "end_turn", "content": [
            {"type": "text", "text": "**Use** reference [REQUIRED_REFERENCE]. Rates are illustrative."}]})

    c = _client_with(AnthropicProvider, handler)
    j = c.post("/api/agent/chat", json={"message": "Plan for Farhan Ahmed", "plan": PLAN}).json()
    assert j["mode"] == "llm" and j["provider"] == "anthropic"
    assert [t["toolName"] for t in j["tools"]] == ["compare_transfer_costs", "check_payment_instructions"]
    assert j["replyMessage"]["content"] == "Use reference ZJU-32401899-AHMED. Rates are illustrative."  # restored + de-markdowned
    wire = json.dumps(seen)
    assert "32401899" not in wire and "Farhan" not in wire and "AHMED" not in wire   # nothing sensitive left the server
    # the model's placeholder argument was restored before the tool ran -> reference matched
    chk = next(f for f in j["replyMessage"]["structuredBreakdown"]["verificationFindings"] if "Payment Reference" in f["title"])
    assert "Matches" in chk["title"]
    assert seen[0]["tools"][0]["name"] == "compare_transfer_costs"


def test_openai_compatible_tool_loop():
    calls = []

    def handler(req: httpx.Request):
        calls.append(json.loads(req.content))
        assert req.headers["authorization"] == "Bearer sk-test"
        if len(calls) == 1:
            return httpx.Response(200, json={"choices": [{"message": {"content": None, "tool_calls": [
                {"id": "c1", "type": "function", "function": {"name": "create_payment_checklist", "arguments": "{}"}}]}}]})
        assert calls[1]["messages"][-1]["role"] == "tool"
        return httpx.Response(200, json={"choices": [{"message": {"content": "Checklist ready. Verify with your bank."}}]})

    j = _client_with(OpenAICompatibleProvider, handler).post(
        "/api/agent/chat", json={"message": "checklist please", "plan": PLAN}).json()
    assert j["mode"] == "llm" and j["checklist"] and j["provider"] == "openai_compatible"


def test_llm_failure_falls_back_to_labeled_demo():
    c = _client_with(AnthropicProvider, lambda r: httpx.Response(401, json={"error": {"message": "invalid x-api-key"}}))
    j = c.post("/api/agent/chat", json={"message": "Compare transfer costs", "plan": PLAN}).json()
    assert j["mode"] == "demo_fallback" and "fallback" in j["replyMessage"]["content"].lower()
    assert "401" in j["warning"] and "sk-test" not in json.dumps(j)


def test_llm_failure_without_fallback_returns_502():
    c = _client_with(AnthropicProvider, lambda r: httpx.Response(500, text="boom"), llm_fallback_to_demo=False)
    r = c.post("/api/agent/chat", json={"message": "plan", "plan": PLAN})
    assert r.status_code == 502 and r.json()["error"]["code"] == "llm_unavailable"


def test_placeholder_keys_mean_demo_mode():
    from app.config import _clean_key
    assert _clean_key("your-key-here") is None and _clean_key("") is None and _clean_key("sk-ant-real123") == "sk-ant-real123"


def test_redactor_roundtrip():
    r = Redactor(PaymentPlanInput(**PLAN))
    s = r.scrub("Hi Farhan Ahmed, use ZJU-32401899-AHMED (ID 32401899)")
    assert "Farhan" not in s and "32401899" not in s and r.restore(s).startswith("Hi Farhan Ahmed, use ZJU-32401899-AHMED")
