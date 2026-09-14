# FinSentry AI — Financial Threat & Scam Intelligence Agent

**FinSentry AI** is a specialized financial scam detection and risk-assessment web application designed around modern agentic principles. Rather than outputting an opaque "scam / not scam" label, it decomposes suspicious content through an orchestrated 10-stage LangGraph forensic pipeline and computes a deterministic risk score grounded in verified financial fraud intelligence.

---

## Key Features

- **Multi-Stage LangGraph Agent Pipeline:** Investigates messages, entities, contextual intent, pattern triggers, URLs, and RAG knowledge base evidence before drawing conclusions.
- **Step-by-Step Investigation Feedback:** Real-time visual pipeline animation (`✓ Understanding financial context`, `⟳ Analyzing link`, `○ Assessing risk`) so the application behaves like an active investigator.
- **Safe String URL Forensics (Zero-Fetch Guarantee):** Evaluates web domains, punycode lookalikes, URL shorteners, raw IP hosts, and brand impersonation without ever executing or visiting the URL.
- **Deterministic Risk Engine:** Risk weights (Credential request +25, Suspicious URL +20, Payment request +20, Threat/Coercion +15, Impersonation +15, Urgency +10, Unrealistic reward +15) are calculated mathematically, separated from the LLM.
- **Grounded RAG Knowledge Base:** 8 primary financial fraud domains (Phishing, Bank/KYC, UPI Fraud, Investment Scams, Job Fraud, Support Impersonation, Account Takeover, Safety Guidelines).
- **Multi-Factor Confidence & Calibrated Phrasing:** Calibrated language prevents absolute claims ("100% safe" / "definitely a scam"); unclear messages surface honest "Uncertain" verdicts.
- **Privacy-First Saved Dossiers:** Analysis is privacy-respecting and opt-in; no user credentials or unhashed sensitive texts are persisted without consent.

---

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend:** Python 3.13, FastAPI, LangGraph, Pydantic v2, SQLAlchemy
- **Forensics & RAG:** `tldextract`, `urllib.parse`, deterministic rule engines, Cosine Vector Search
- **Database:** SQLite (default zero-dependency) with PostgreSQL + pgvector support (`docker-compose.yml` included)

---

## Quick Start

### 1. Backend

```bash
cd backend

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies (already installed in scratch)
pip install -r requirements.txt

# Run FastAPI server
python -m uvicorn app.main:app --reload --port 8000
```

Backend endpoints:
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/v1/health`
- Investigation Endpoint: `POST http://localhost:8000/api/v1/analyze`

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Visit `http://localhost:3000` in your web browser.

---

## Test Scenarios Included in UI

1. **Urgent Bank KYC Scam (Expect CRITICAL):** Coercive threat to block bank account + OTP credential demand + brand spoofed `.top` link.
2. **Genuine Bank Transaction Alert (Expect LOW):** Standard UPI credit notification with security disclaimer ("never share your OTP").
3. **Part-time Job Fee Trap (Expect HIGH):** Lucrative daily income + upfront registration fee demand.
4. **Spoofed Phishing Domain (Expect HIGH):** Suspicious bank lookalike domain inspected without visiting.
5. **Ambiguous Payment Request (Expect MEDIUM / Uncertain):** Vague communication lacking proof, triggering honest uncertainty and advice to verify independently.

---

## Non-Negotiable Safety Protocols

1. **Zero-Credential Guarantee:** The app will never ask for or store passwords, OTPs, PINs, card CVVs, or full card numbers.
2. **Zero-Fetch URL Sandbox:** URLs are strictly parsed as strings and never fetched or navigated to.
3. **Calibrated Forensic Language:** Avoids absolute certainty; prompts users with emergency escalation helplines (Helpline 1930 / cybercrime.gov.in).
