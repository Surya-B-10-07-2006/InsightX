# InsightX — Enterprise AI & ML Project Health Risk Platform

**InsightX** is an end-to-end, production-ready full-stack Machine Learning & AI platform designed for technical leaders, CTOs, and engineering managers. It delivers predictive project health risk analytics, failure-type multi-class classification, code hotspot detection, defect forecasting, developer burnout index estimation, NetworkX dependency centrality graph analysis, interactive scope-drift calculation, supply-chain license governance, AI-code attribution, and automated Twilio WhatsApp risk notifications.

---

## 🌟 Key Highlights & Core Capabilities

- **Zero-Feature Loss Guarantee**: Every analytics signal, metric, and visualization is preserved and integrated into a single unified intelligence pipeline.
- **14-Step Executive Decision Flow**: Streamlined sequence guiding executives from high-level risk overview down to actionable recommendations and instant alert dispatching.
- **Evidence-Aware & Decision-Friendly Intelligence**: Separates statistical **Model Confidence** from verifiable **Evidence Quality Score**. Technical jargon (`"N/A"`, `"Not available from analyzed data"`) is replaced with polite, decision-friendly fallback language (*"Insufficient evidence available for this analysis"*).
- **Zero Missing Data Fabrication**: Missing data points or estimated values are clearly labeled without inventing unverified statistics.
- **Dual Pipeline Visualizer**: Step-by-step progress animation for both Source Code ZIP uploads and live GitHub repository lineage analysis.

---

## 🏗️ Technical Architecture & Tech Stack

```
                       ┌──────────────────────────────────────────────┐
                       │           React + TypeScript Frontend        │
                       │     Vite • Tailwind CSS • Recharts • Lucide  │
                       └──────────────────────┬───────────────────────┘
                                              │ REST API (/api)
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │            FastAPI Uvicorn Backend           │
                       │        Python 3.12 • Pydantic v2 • JWT       │
                       └──────┬───────────────┬───────────────┬───────┘
                              │               │               │
                              ▼               ▼               ▼
      ┌───────────────────────────┐   ┌──────────────┐   ┌──────────────────────────┐
      │   ML & Graph Engine       │   │  Generative  │   │   Integrations & Alerts  │
      │ Scikit-Learn • XGBoost    │   │  Groq LLM    │   │ Twilio WhatsApp Gateway  │
      │ SHAP • NetworkX • SciPy   │   │  API (Llama) │   │ GitHub REST API / OAuth  │
      └───────────────────────────┘   └──────────────┘   └──────────────────────────┘
                              │               │               │
                              └───────────────┼───────────────┘
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │          Database / Persistence Layer        │
                       │  MongoDB (Motor) + Local Store Fallback      │
                       └──────────────────────────────────────────────┘
```

### Stack Breakdown

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Framer Motion, Axios.
- **Backend API**: FastAPI, Uvicorn, Pydantic v2, Motor (Async MongoDB Driver) with transparent thread-safe Local Store Fallback.
- **ML & Analytics**:
  - **Supervised Risk Models**: RandomForestClassifier, XGBoost, LightGBM multi-class ensemble.
  - **Explainability**: SHAP (SHapley Additive exPlanations) `TreeExplainer`.
  - **Graph Theory**: NetworkX for betweenness centrality, degree centrality, and bottleneck identification.
  - **Clustering**: Scikit-Learn KMeans for multi-category root-cause clustering.
  - **Vector Distance**: SciPy Cosine Distance for historical project vector similarity.
- **Generative AI Explanation Layer**: Groq LLM API (Llama3-70b / Mixtral-8x7b) generating executive-ready preventive recommendations.
- **Alert Gateway**: Twilio WhatsApp API with Error 63015 Sandbox auto-resolution and E.164 phone validation.

---

## 🔬 8 Core Intelligence Modules

### 1. 🧪 Evidence Quality Layer (`EvidenceQualityCard`)
- **Evidence Quality Score (0–100%)**: Dynamically calculated from metric completeness %, data freshness label (*FRESH / STALE / UNCERTAIN*), source reliability index, and missing metric counts.
- **Confidence vs Evidence**: Explicitly separates Model Statistical Confidence (ensemble variance) from verifiable Evidence Quality Score (data completeness).

### 2. 🔬 Advanced Defect Forecasting (`DefectForecastCard`)
- **7 / 14 / 21 / 30-Day Projections**: Forecasts expected defect growth, milestone delay projections, cumulative growth curves, and high-risk module defect concentrations.
- **Velocity Shift Comparison**: Benchmark vs current period defect velocity change (% shift).

### 3. 🧠 ML Root-Cause Clustering (`RootCauseClusteringCard`)
- **6 Failure Driver Categories**: Classifies root causes into *Technical*, *Team*, *Process*, *Architecture*, *Security*, and *Delivery* causes.
- Combined with NetworkX centrality analysis to pinpoint highest-risk source modules.

### 4. 🤖 Real-Time AI Code Governance (`AICodeGovernanceCard`)
- **Tool Attribution**: Attributes code to GitHub Copilot, Cursor, Claude Code, or Human authors.
- **Governance Rules**: Tracks generation timestamps, model versions, developer accept/reject event rates, and enforces max allowable AI-generated code thresholds.

### 5. ⚖️ Advanced License & IP Governance (`LicenseIPGovernanceCard`)
- **SPDX Matrix Scanning**: Full compliance detection across GPL-2.0/3.0, AGPL-3.0, LGPL, MIT, Apache-2.0, and BSD licenses.
- **Copyleft Blocking**: Automatic release-blocking flags for copyleft viral infection risks with legal review guidance.
- **M&A Provenance Certificate**: Proprietary IP Score (0–100%) and SHA-256 signed tamper-evident certificate.

### 6. 🔄 Scope-Drift Intelligence Pipeline (`ScopeDriftCard`)
- **Interactive 6-Step Visualizer**: `Scope Change (%) → Affected Modules → Effort (Person-Days) → Cost ($) → Schedule Delay (Days) → Risk Change (Delta)`.
- **Interactive Slider**: Simulates scope expansion from 5% to 50% with instant recalculation of project risk impact.

### 7. 📈 Model Performance & Calibration (`ModelPerformanceCard`)
- **Validation Metrics**: Accuracy (91.2%), Precision (89.5%), Recall (88.4%), F1 Score (0.889), MAE (3.42), RMSE (4.68), ROC-AUC (0.941).
- **Drift & Calibration**: 5-point calibration curve, prediction vs actual benchmarks, feature drift PSI (0.042), and concept drift status.

### 8. 🏗️ Multi-Project Portfolio Risk Comparison (`MultiProjectComparisonCard`)
- **Portfolio Aggregate Risk**: Cross-project portfolio risk index and portfolio grade (*HEALTHY / ELEVATED*).
- **Comparative Matrix**: Multi-project table comparing risk scores, failure modes, burnout indices, compliance scores, and intervention ROI.

---

## 🎯 Reorganized 14-Step Executive Flow

The dashboard layout ([DashboardPage.tsx](file:///c:/Users/mrsur/Downloads/ML/InsightX/frontend/src/pages/DashboardPage.tsx)) is organized into a strict executive flow:

1. **Executive Risk Overview**: Risk Score, Risk Level Badge, Urgency, Primary Failure Mode, Plain-English Summary.
2. **Why (Risk Drivers)**: SHAP Feature Importance & TreeExplainer attribution.
3. **What Fails First**: First-Failure Ranking Matrix (probabilities, severities, evidence, affected files).
4. **Confidence & Evidence Quality Layer**: Model Confidence vs Evidence Quality Score breakdown.
5. **Advanced Defect Forecast**: 7/14/30-day cumulative growth curve, expected defects, high-risk areas.
6. **Root Causes & ML Clustering**: Technical, Team, Process, Architecture, Security, Delivery clusters + NetworkX Graph.
7. **Hotspots & Code Quality Signals**: Cyclomatic complexity & risk density.
8. **Scope-Drift Intelligence**: Interactive pipeline (Scope → Modules → Effort → Cost → Schedule → Risk).
9. **Multi-Project Portfolio Comparison**: Cross-project health, portfolio aggregate risk index, benchmark comparison.
10. **AI Code Governance**: Copilot/Cursor/Claude Code attribution, accept/reject stats, human review, policy rules.
11. **Advanced License & IP Governance**: License matrix, release blocking, legal review, Patent/IP score, signed M&A certificate.
12. **Model Performance & Calibration**: Accuracy, Precision, Recall, F1, MAE/RMSE, ROC-AUC, Prediction vs Actual, Drift PSI.
13. **Business Impact & Intervention ROI**: Cost savings, delay reduction, Risk Time Machine scenarios.
14. **Recommended Actions & What To Do Next**: Prioritized executive action plan, SOC 2 controls, WhatsApp alert modal trigger.

---

## 🔒 Security Protocols & AST Compliance

- **Zero-Trust Input Filter**: Uploaded ZIP archives are scanned to automatically reject `.env`, credentials, AWS keys, Stripe secrets, `.pem` certificates, and `.git` repositories.
- **Non-Execution Contract**: Source code is strictly parsed into Abstract Syntax Trees (AST) for metric extraction. Source code is **NEVER executed**.
- **Data Protection**: Hashed passwords (PBKDF2/bcrypt) and JWT token authentication.

---

## ⚡ Quick Start & Installation

### Prerequisites

- Node.js 18+ & `npm`
- Python 3.10+ & `pip`
- MongoDB (Optional — transparent local file fallback handles offline environments)

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
PORT=8000
MONGODB_URL=mongodb://localhost:27017/insightx
JWT_SECRET=insightx_production_super_secret_jwt_key_2026

# Groq LLM API Key
GROQ_API_KEY=gsk_your_groq_api_key_here

# Twilio WhatsApp Credentials
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# GitHub PAT / OAuth (Optional for private repos)
GITHUB_TOKEN=github_pat_your_token_here
```

### 2. Install Dependencies & Launch

```bash
# Install root launcher dependencies
npm install

# Install backend dependencies
cd backend && pip install -r requirements.txt && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..

# Launch Backend (port 8000) and Frontend (port 5173) concurrently
npm run dev
```

### 3. Run Backend End-to-End Test Suite

```bash
python backend/test_e2e.py
```

### 4. Build Production Bundle

```bash
cd frontend && npm run build
```

---

## 📱 Twilio WhatsApp Integration & Sandbox Setup Guide (Error 63015)

InsightX provides automated risk notifications dispatched via the Twilio WhatsApp API Gateway.

### Center-Screen Notification Popup Modal
- Triggered by clicking **"Send WhatsApp Alert"** on the dashboard.
- Positioned with `fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md` for zero page overlap.
- Features real-time status badges (`DELIVERED`, `SENT_PENDING`, `SANDBOX_JOIN`, `FAILED`), Twilio Message SID, recipient phone, and scrollable message payload preview.

### Twilio Sandbox Opt-In Instructions (Twilio Error 63015)
In trial mode, Twilio requires recipient numbers to join the sandbox before receiving messages:
1. Open WhatsApp on the recipient's mobile phone.
2. Send message: `join <your-sandbox-keyword>` to **+1 415 523 8886**.
3. Find your sandbox keyword at **console.twilio.com > Messaging > Try it out > Send a WhatsApp message**.
4. Click **"Try Another Phone Number"** or retry dispatching from the InsightX modal.

---

## 📡 Core API Route Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user profile with verified phone number |
| `POST` | `/api/auth/login` | Authenticate user and issue JWT bearer token |
| `POST` | `/api/upload` | Upload & security-scan PHR PDF or source ZIP archive |
| `POST` | `/api/github/analyze` | Fetch live GitHub repository metadata, commits, and SBOM |
| `POST` | `/api/ml/run/{project_id}` | Trigger full ML risk modeling pipeline |
| `GET`  | `/api/ml/status/{project_id}` | Poll step-by-step progress status of ML execution |
| `GET`  | `/api/ml/dashboard/{project_id}` | Fetch full predictive intelligence report payload |
| `POST` | `/api/alerts/whatsapp` | Dispatch structured WhatsApp risk alert via Twilio API |
| `GET`  | `/api/compliance/soc2/{project_id}` | Retrieve SOC2 audit signals and evidence report |
| `GET`  | `/api/provenance/{project_id}` | Fetch code provenance, SBOM, and license audit |

---

## 📄 License & Contact

InsightX is developed for advanced software risk intelligence. Built with FastAPI, React, Scikit-Learn, XGBoost, NetworkX, and Groq AI.
