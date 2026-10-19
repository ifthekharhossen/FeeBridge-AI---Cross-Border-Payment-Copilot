# FeeBridge AI

Cross-border student payment copilot: React + Vite + TypeScript + Tailwind frontend (`src/`) and a
Python FastAPI backend (`backend/`). Rates, fees and university records are **illustrative samples**,
not live quotes, and the app never sends money.

## Run locally (Windows PowerShell)

Terminal 1, backend:
```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env     # optional; no key = clearly labelled DEMO mode
python -m uvicorn app.main:app --reload --port 8000
```

Terminal 2, frontend:
```powershell
npm install
npm run dev                # http://localhost:3000 (proxies /api to http://127.0.0.1:8000)
```

LLM keys go **only** in `backend/.env` (git-ignored). See [backend/README.md](backend/README.md) for providers, endpoints and troubleshooting.
