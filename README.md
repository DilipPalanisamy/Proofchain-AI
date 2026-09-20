# ProofChain AI

> **"Evidence you can inspect. Decisions you can trust."**  
> *From evidence to transparent decisions.*

ProofChain AI is an auditable evidence-intelligence and claim-verification platform. It ingests multi-source documentation, computes semantic similarity, detects factual contradictions, performs automated evidence relevance checks, and synthesizes a transparent, deterministic credibility score (0–100) with step-by-step explainability.

**Live Demo:** [Open ProofChain AI](https://dilippalanisamy.github.io/Proofchain-AI/)

---

## 🔑 Demo Access & Navigation

### Hackathon Demo Credentials
- **Email:** `demo@proofchain.ai`
- **Password:** `proofchain123`

### Navigation Routes
- **Sign In / Login:** `/login`
- **Account Registration:** `/register`
- **Claim Analysis Workspace:** `/analyze`
- **Evidence Intelligence Dashboard:** `/dashboard`

---

## 🏛 Auditable Verification Architecture

```text
       CLAIM
         ↓
      EVIDENCE
         ↓
     AI ANALYSIS (Gemini 3.7 Flash)
         ↓
    RELEVANCE & SIMILARITY AUDIT
         ↓
   CONTRADICTION DETECTION
         ↓
    PROOFCHAIN CREDIBILITY SCORE (0-100)
```

---

## 📁 Project Structure

```text
proofchain-ai/
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Platform Landing Page
│   │   ├── login/
│   │   │   └── page.tsx        # Split-screen Login UI with demo credentials
│   │   ├── register/
│   │   │   └── page.tsx        # Account Registration UI
│   │   ├── analyze/
│   │   │   └── page.tsx        # End-to-end Claim Creation & Evidence Ingestion Workspace
│   │   └── dashboard/
│   │       └── page.tsx        # Evidence Intelligence Dashboard & Session Guard
│   │
│   ├── components/
│   │   ├── ClaimInput.tsx      # Claim formulation component
│   │   ├── EvidenceUpload.tsx  # Multi-file evidence uploader (PNG, JPG, PDF, TXT, DOCX)
│   │   ├── EvidenceCard.tsx    # Evidence metadata & observation display
│   │   ├── ScoreCard.tsx       # Multi-factor credibility score & metrics
│   │   └── EvidenceChain.tsx   # Step-by-step visual chain of reasoning
│   │
│   └── lib/
│       └── api.ts              # Type-safe API client for ProofChain backend
│
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint & CORS middleware
│   │   │
│   │   ├── api/
│   │   │   ├── claims.py       # Claim management & demo seed endpoints
│   │   │   ├── evidence.py     # Multi-format file ingestion & verification
│   │   │   ├── ai.py           # Gemini 3.7 Flash evidence analysis endpoint
│   │   │   └── analysis.py     # ProofChain analysis pipeline endpoint
│   │   │
│   │   ├── models/
│   │   │   ├── claim.py        # SQLAlchemy Claim entity
│   │   │   └── evidence.py     # SQLAlchemy Evidence entity
│   │   │
│   │   ├── schemas/
│   │   │   ├── claim.py        # Pydantic validation schemas for Claims
│   │   │   └── evidence.py     # Pydantic schemas for Evidence
│   │   │   └── analysis.py     # Pydantic schemas for ProofChain Analysis
│   │   │
│   │   ├── services/
│   │   │   ├── ai_extractor.py # Gemini 3.7 Flash multimodal factual extraction
│   │   │   ├── relevance.py    # Semantic relevance & keyword overlap calculator
│   │   │   ├── similarity.py   # SentenceTransformers embedding similarity
│   │   │   ├── contradiction.py# Polar discrepancy & negation clash audit
│   │   │   └── scoring.py      # Weighted deterministic scoring algorithm
│   │   │
│   │   └── database.py         # SQLite database & session manager
│   │
│   ├── requirements.txt        # Backend dependencies
│   └── .env                    # Environment configuration
│
├── README.md
└── .gitignore
```

---

## ⚡ Key Features & Capabilities

1. **Multimodal Evidence Ingestion & AI Extraction**: Uses `gemini-3.7-flash` to extract observable facts, entity relations, dates, and locations without hallucinating verdict conclusions.
2. **Semantic Relevance Detection**: Ensures uploaded evidence is contextually relevant to the claim before allowing it to influence the score (`RELEVANT`, `PARTIALLY_RELEVANT`, `IRRELEVANT`).
3. **Redundancy & Duplicate Audit**: Detects duplicate or near-identical evidence items using `SentenceTransformers` embeddings.
4. **Contradiction Detection**: Surfacing polar clashes, negation flips, and factual refutations across evidence sources.
5. **Deterministic Scoring Engine**: Calculates an auditable score (0–100) based on weighted contributions of quality, reliability, consistency, completeness, diversity, recency, and contradiction penalties.
6. **Auditable Visual Dashboard**: Presents evidence chain links, score breakdowns, duplicate pairings, contradictions, limitations, and recommendations.

---

## 🚀 Running Locally

### 1. Backend Setup (FastAPI)

```bash
cd backend
python -m venv .venv

# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
- API Documentation: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/health`

### 2. Frontend Setup (Next.js)

```bash
cd frontend
npm install
npm run dev
```
- Web Application: `http://localhost:3000`
- Login Page: `http://localhost:3000/login`

### Google OAuth Configuration

Create a Google OAuth Web application and add these authorized redirect URIs:

- `http://localhost:8000/auth/google/callback`
- `https://proofchain-ai-backend.onrender.com/auth/google/callback`

Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the backend environment. For the Render deployment, enter both values in the `proofchain-ai-backend` service environment variables. The frontend never receives the client secret.
