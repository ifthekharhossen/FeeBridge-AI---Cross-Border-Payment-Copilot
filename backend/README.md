# FeeBridge AI backend (FastAPI)

Tool-using payment-planning agent for the existing React frontend. All rates, fees and university
records are **illustrative sample data**. This service never sends money and never returns live quotes.

## What it does

| Endpoint | Purpose |
|---|---|
| `GET  /api/health` | Status, and whether it is running in demo or LLM mode (never returns keys) |
| `POST /api/agent/chat` | The agent. Body: `{message, plan, history}`. Returns `{replyMessage, tools, mode, ...}` in the exact shape `AgentPage.tsx` renders |
| `POST /api/payment/compare` | `compare_transfer_costs` directly |
| `POST /api/payment/check` | `check_payment_instructions` directly |
| `POST /api/payment/checklist` | `create_payment_checklist` directly |
| `GET  /api/universities`, `GET /api/rates` | The sample data |

Interactive docs: http://127.0.0.1:8000/docs

**How the agent works:** the LLM only decides which tool to call. Python computes every number, check and
checklist item (`app/tools/`). The structured cards shown in the UI are built from tool output, not from model text.
With no API key, a deterministic keyword router runs the same tools and every reply starts with `[DEMO MODE ...]`.

## Windows setup (PowerShell)

Prerequisites: Python 3.10+ (python.org, tick "Add python.exe to PATH") and Node.js 18+.

```powershell
# 1) Backend (terminal 1)
cd feebridge-ai\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
# If activation is blocked:  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
pip install -r requirements.txt
copy .env.example .env          # optional: add a key; without one the backend runs in DEMO mode
python -m uvicorn app.main:app --reload --port 8000
```

```powershell
# 2) Frontend (terminal 2)
cd feebridge-ai
npm install
npm run dev                     # opens on http://localhost:3000, proxies /api to port 8000
```

Open http://localhost:3000, go to **AI Agent**, and click "Plan my tuition payment".

Command Prompt users: activate with `.venv\Scripts\activate.bat`.

## Choosing an LLM provider

Edit `backend/.env` (git-ignored), then restart uvicorn.

```ini
# Claude
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=your-key
ANTHROPIC_MODEL=claude-sonnet-5-5     # verify the current model name in Anthropic's docs

# or any OpenAI-compatible API (Groq, Gemini compat endpoint, OpenAI, OpenRouter ...)
LLM_PROVIDER=openai_compatible
OPENAI_COMPAT_API_KEY=your-key
OPENAI_COMPAT_BASE_URL=https://api.groq.com/openai/v1
OPENAI_COMPAT_MODEL=<a tool-calling-capable model>
```

Check `http://127.0.0.1:8000/api/health`: `"demoMode": false` means a key was picked up.
Free tiers, rate limits and data-use terms change; check your provider's current terms.
The model you choose must support tool/function calling.

## Privacy and secrets

- Keys are read only from `backend/.env` / environment variables, never sent to the browser, never in responses or logs.
- `.env` files are git-ignored (only `.env.example` is committed). Do not paste keys into issues or chat.
- By default (`LLM_SEND_STUDENT_PII=false`) the student name and ID are replaced with placeholders before any text is sent to the LLM provider and restored locally. Still, **do not enter real IDs, bank details or confidential payment records** while using external providers.
- Fabricated sample accounts only: the university records are fictional demo data.

## Tests

```powershell
pip install -r requirements-dev.txt
python -m pytest -q
```

## Troubleshooting

- **Chat says "Cannot reach the FeeBridge backend"**: start uvicorn on port 8000 (see above).
- **Port in use**: `python -m uvicorn app.main:app --port 8001` and start the frontend with `$env:BACKEND_URL="http://127.0.0.1:8001"; npm run dev`.
- **Frontend served from another origin** (not the Vite proxy): add it to `CORS_ORIGINS` and set `VITE_API_BASE_URL`.
- **Replies start with `[DEMO MODE (fallback)]`**: the LLM call failed; the `warning` field in the response says why (e.g. HTTP 401 = bad key).

## Layout

```
backend/
  app/main.py            FastAPI app, CORS, error handlers, endpoints
  app/agent.py           orchestrator (LLM mode + demo mode), response builder
  app/llm_providers.py   Anthropic + OpenAI-compatible tool-calling loops
  app/privacy.py         placeholder redaction of student name/ID for LLM calls
  app/tools/             compare_transfer_costs, check_payment_instructions, create_payment_checklist
  app/data/              sample universities + illustrative rates/fees (JSON)
  tests/                 pytest suite (mocked LLM HTTP)
```
