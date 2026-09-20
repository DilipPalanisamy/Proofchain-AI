# ProofChain AI

ProofChain AI is an intelligent fact-checking, claim verification, and evidence chain analysis platform. It leverages NLP, semantic similarity matching, contradiction detection, and credibility scoring to evaluate the validity of claims against supporting or disputing evidence.

---

## 📁 Project Structure

```text
proofchain-ai/
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Home / Landing overview
│   │   ├── analyze/
│   │   │   └── page.tsx        # Claim analysis workspace
│   │   └── dashboard/
│   │       └── page.tsx        # Claims & evidence dashboard
│   │
│   ├── components/
│   │   ├── ClaimInput.tsx      # Claim input & query submission
│   │   ├── EvidenceUpload.tsx  # Evidence file / text ingestion
│   │   ├── EvidenceCard.tsx    # Individual evidence presentation
│   │   ├── ScoreCard.tsx       # Credibility & confidence metrics
│   │   └── EvidenceChain.tsx   # Visualized chain of reasoning
│   │
│   └── lib/
│       └── api.ts              # Frontend API client
│
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI entrypoint & router setup
│   │   │
│   │   ├── api/
│   │   │   ├── claims.py       # Claim CRUD & management endpoints
│   │   │   ├── evidence.py     # Evidence ingestion & query endpoints
│   │   │   └── analysis.py     # ProofChain analysis & verification endpoints
│   │   │
│   │   ├── models/
│   │   │   ├── claim.py        # SQLAlchemy Claim entity
│   │   │   └── evidence.py     # SQLAlchemy Evidence entity
│   │   │
│   │   ├── schemas/
│   │   │   ├── claim.py        # Pydantic schemas for Claims
│   │   │   └── evidence.py     # Pydantic schemas for Evidence & Analysis
│   │   │
│   │   ├── services/
│   │   │   ├── evidence_analyzer.py  # Evidence parsing & reasoning pipeline
│   │   │   ├── similarity.py         # Semantic similarity engine
│   │   │   ├── contradiction.py      # Contradiction detection engine
│   │   │   └── scoring.py            # Credibility scoring algorithm
│   │   │
│   │   └── database.py         # DB connection & session handling
│   │
│   ├── requirements.txt        # Python backend dependencies
│   └── .env                    # Backend configuration environment
│
├── README.md
└── .gitignore
```

---

## 🚀 Getting Started

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Linux / macOS:
   source .venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure `.env` if needed (default SQLite database is configured).
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   API Docs will be available at: `http://localhost:8000/docs`

---

### Frontend Setup (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Access the frontend at: `http://localhost:3000`

---

## ⚡ Core Features

- **Semantic Similarity Analysis**: Measures contextual alignment between claims and provided evidence sources.
- **Contradiction Detection**: Identifies factual inconsistencies, semantic refutations, and opposing stances.
- **Multi-Factor Credibility Scoring**: Combines source reliability, semantic relevance, consensus weight, and contradiction penalties.
- **Evidence Chain Visualization**: Builds an auditable, step-by-step verification trail showing how the verdict was derived.
