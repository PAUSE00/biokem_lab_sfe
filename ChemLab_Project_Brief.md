# ChemLab — Laboratory Information Management System (LIMS)
> **Project Brief for AI Builder Agent**  
> Version: 1.0.0 | Date: May 2026 | Type: Final Year Project (PFE)

---

## 1. Project Overview

**ChemLab** is an intelligent web platform designed to fully digitalize the operations of chemical analysis laboratories — specifically water, soil, and chemical product analysis labs.

### Problem Statement
Most laboratories currently rely on:
- Excel spreadsheets for storing analyses
- Manual report generation
- Dispersed, non-centralized data
- No centralized history or audit trail
- No automated anomaly detection
- Complex and error-prone ISO audit processes

### Solution
A modern, centralized LIMS platform that handles:
- Sample lifecycle management
- Chemical analysis tracking
- Automated PDF report generation
- AI-powered anomaly detection
- Role-based user access control
- Full traceability via QR codes
- Statistical dashboards and KPIs

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript |
| UI Framework | Tailwind CSS + shadcn/ui |
| Backend | Laravel 11 (REST API) |
| Authentication | Laravel Sanctum (JWT) |
| Database | MySQL |
| Cache | Redis |
| AI Engine | Python FastAPI |
| Charts | Recharts |
| PDF Generation | DomPDF |
| QR Code | Simple QR |
| File Storage | Laravel Storage |
| DevOps | Docker |

---

## 3. System Architecture

```
┌─────────────────────┐
│   React Frontend    │  ← SPA Dashboard (TypeScript)
│   (Dashboard SPA)   │
└────────┬────────────┘
         │ REST API (JSON)
         ▼
┌─────────────────────┐
│  Laravel 11 Backend │  ← Business Logic, Auth, Routing
│  (Business Logic)   │
└────────┬────────────┘
         │
┌────────┴────────────────────────────┐
▼                ▼                    ▼
┌──────────┐  ┌──────────┐   ┌──────────────┐
│  MySQL   │  │  Redis   │   │  FileSystem  │
│ Database │  │  Cache   │   │  (Storage)   │
└──────────┘  └──────────┘   └──────────────┘
         │
         ▼
┌─────────────────────┐
│  Python FastAPI     │  ← AI Engine (Anomaly Detection)
│  AI Microservice    │
└─────────────────────┘
```

---

## 4. User Roles & Permissions

| Role | Access Level | Responsibilities |
|------|-------------|------------------|
| **Admin** | Full access | User management, system config, all modules |
| **Responsable** | High access | Validate analyses, approve reports, view all |
| **Technicien** | Medium access | Enter analysis results, manage assigned samples |


---

## 5. Modules Specification

### Module 1 — Authentication & Security
**Purpose:** Secure access control and session management

**Features:**
- Secure login / logout
- Password reset via email
- Remember me session
- JWT / Sanctum token authentication
- Role-Based Access Control (RBAC)
- Connection logs & audit trail

**Pages:**
- `/login` — Login page
- `/forgot-password` — Password reset
- `/profile` — User profile settings
- `/session-logs` — Active session history

---

### Module 2 — User Management
**Purpose:** CRUD operations for all platform users

**Features:**
- Create, Read, Update, Delete users
- Assign and manage roles
- Set granular permissions per user
- View user activity history

**Pages:**
- `/users` — User list (table with search/filter)
- `/users/create` — Add new user form
- `/users/{id}/edit` — Edit user details
- `/users/permissions` — Permission matrix

---

### Module 3 — Sample Management
**Purpose:** Full lifecycle tracking of laboratory samples

**Features:**
- Register incoming samples with metadata
- Auto-generate unique QR code per sample
- Assign sample to technician
- Track analysis status in real-time
- Full history log per sample

**Sample Workflow:**
```
Sample Reception
      ↓
Technician Assignment
      ↓
Chemical Analysis
      ↓
Manager Validation
      ↓
PDF Report Generation
      ↓
Archiving
```

**Pages:**
- `/samples` — Sample list with status badges
- `/samples/create` — New sample form
- `/samples/{id}` — Sample detail + history
- `/samples/{id}/qr` — QR code tracking page

---

### Module 4 — Chemical Analysis
**Purpose:** Record, validate, and flag chemical measurement results

**Measured Parameters:**

| Parameter | Unit | Notes |
|-----------|------|-------|
| pH | — | Acidity/alkalinity |
| Zinc (Zn) | mg/L | Heavy metal |
| Sulfate (SO₄) | mg/L | Dissolved salt |
| Conductivity | µS/cm | Ion concentration |
| Temperature | °C | |
| Humidity | % | Soil analyses |
| Salinity | g/L | |
| Turbidity | NTU | Water clarity |
| Nitrates (NO₃) | mg/L | Contamination indicator |

**Features:**
- Input analysis results per parameter
- Validate analysis (manager role)
- Auto-detect values outside reference ranges
- Conformity verification against standards
- Automatic alerts for critical values

**Pages:**
- `/analyses/new` — New analysis form
- `/analyses/{id}/validate` — Validation view
- `/analyses` — Analysis history (filterable)
- `/analyses/{id}` — Analysis detail + flagged values

---

### Module 5 — PDF Report Generation
**Purpose:** Auto-generate professional, standardized analysis reports

**Features:**
- One-click PDF generation from validated analysis
- Embedded QR code for authenticity
- Electronic signature support
- Result charts included in PDF
- Automated recommendations section
- Email delivery to client

**Pages:**
- `/reports/{id}/preview` — Report preview (in-browser)
- `/reports/{id}/download` — Trigger PDF download
- `/reports/{id}/send` — Email report to client
- `/reports` — Report history & archive

---

### Module 6 — Dashboard & Analytics
**Purpose:** Real-time KPIs and visual insights for lab managers

**KPIs Displayed:**
- Total analyses this month
- Urgent analyses pending
- Global conformity rate (%)
- Number of anomalies detected
- Active clients count

**Charts:**
- pH trends over time (line chart)
- Analysis volume by period (bar chart)
- Activity heatmap (calendar view)
- Anomaly distribution by parameter (pie chart)
- Global conformity rate evolution (area chart)

**Pages:**
- `/dashboard` — Main analytics dashboard

---

### Module 7 — Notifications & Alerts
**Purpose:** Real-time alerting for critical lab events

**Alert Types:**

| Alert | Trigger |
|-------|---------|
| Critical pH | pH < 6 or pH > 9 |
| High Zinc | Zn > WHO limit |
| Urgent Analysis | Priority sample received |
| Low Stock | Reagent below threshold |
| Report Ready | PDF generated successfully |

**Features:**
- Real-time in-app notifications (bell icon)
- Automated email alerts
- Notification center with read/unread status

---

### Module 8 — AI Engine (Anomaly Detection)
**Purpose:** Intelligent analysis of chemical results using AI

**How It Works:**
```
Analysis Validated (Laravel)
         ↓
Chemical Parameters Sent to FastAPI
         ↓
AI Model Analyzes Data
         ↓
Anomalies Detected
         ↓
Risk Score Computed (0–100)
         ↓
Recommendations Generated
         ↓
Results Returned to Laravel → Stored in DB
```

**AI Capabilities:**
- Multi-parameter anomaly detection
- Sanitary risk scoring (0–100 scale)
- Automated recommendations (text)
- Predictive trend analysis
- Water quality classification (Good / Average / Poor / Critical)

**API Endpoints (FastAPI):**
- `POST /analyze` — Submit parameters, get anomalies + score
- `POST /predict` — Trend prediction for a sample series
- `GET /health` — Service health check

---

### Module 9 — Stock Management
**Purpose:** Track laboratory reagents and supplies

**Features:**
- List all reagents with current quantities
- Low stock alerts (configurable threshold)
- Expiry date tracking with warnings
- Supplier management
- Usage history per reagent

**Pages:**
- `/stock` — Reagent inventory list
- `/stock/create` — Add new reagent
- `/stock/{id}` — Reagent detail + usage log
- `/stock/suppliers` — Supplier directory

---

### Module 10 — Audit & History
**Purpose:** Full traceability for ISO 17025 compliance

**Features:**
- Log every modification to sensitive records
- Complete action history per user
- Immutable audit trail
- Secure long-term archiving
- Exportable logs for ISO auditors

**Pages:**
- `/audit` — Full activity log (filterable by user/date/action)
- `/audit/export` — Export logs (CSV / PDF)

---

## 6. Database — Key Entities

```
users               → id, name, email, role, permissions, created_at
samples             → id, code, qr_code, client_id, technician_id, status, received_at
analyses            → id, sample_id, user_id, parameters (JSON), status, validated_at
analysis_results    → id, analysis_id, parameter, value, unit, is_anomaly, reference_min, reference_max
reports             → id, analysis_id, pdf_path, qr_code, generated_at, sent_at
ai_results          → id, analysis_id, risk_score, anomalies (JSON), recommendations, created_at
stock_items         → id, name, quantity, unit, threshold, expiry_date, supplier_id
notifications       → id, user_id, type, message, read_at, created_at
audit_logs          → id, user_id, action, model, model_id, changes (JSON), created_at
```

---

## 7. API Structure (Laravel REST)

```
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/reset-password

GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}

GET    /api/samples
POST   /api/samples
GET    /api/samples/{id}
PUT    /api/samples/{id}/status

GET    /api/analyses
POST   /api/analyses
GET    /api/analyses/{id}
POST   /api/analyses/{id}/validate

GET    /api/reports
GET    /api/reports/{id}
POST   /api/reports/{id}/generate
POST   /api/reports/{id}/send

GET    /api/dashboard/kpis
GET    /api/dashboard/charts

GET    /api/stock
POST   /api/stock
PUT    /api/stock/{id}

GET    /api/notifications
PATCH  /api/notifications/{id}/read

GET    /api/audit-logs
```

---

## 8. Key Business Rules

1. **A sample must be assigned to a technician** before analysis can begin.
2. **Analysis must be validated by a Responsable** before report generation is allowed.
3. **Reports are immutable** once generated — any correction requires a new analysis.
4. **AI analysis is triggered automatically** after manager validation, not manually.
5. **Stock alerts fire when** a reagent quantity drops below its configured threshold.
6. **Audit logs are append-only** — no record can be deleted or modified.
7. **QR codes are unique per sample** and link to the public tracking page.
8. **Clients can only view** their own samples and reports — no cross-client data access.

---

## 9. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | HTTPS, RBAC, input validation, SQL injection protection |
| **Performance** | Dashboard loads < 2s, Redis caching for KPIs |
| **Scalability** | Docker-based, horizontally scalable |
| **Compliance** | ISO 17025 audit trail support |
| **Availability** | 99.5% uptime target |
| **Accessibility** | Arabic/French bilingual interface (optional) |

---

## 10. Development Priorities

### Phase 1 — Core (MVP)
- [ ] Authentication & RBAC
- [ ] Sample management
- [ ] Chemical analysis input
- [ ] Basic dashboard

### Phase 2 — Automation
- [ ] PDF report generation
- [ ] Email notifications
- [ ] QR code tracking
- [ ] Alert system

### Phase 3 — Intelligence
- [ ] AI anomaly detection (FastAPI)
- [ ] Risk scoring
- [ ] Predictive analytics
- [ ] Advanced dashboard charts

### Phase 4 — Compliance & Polish
- [ ] Stock management
- [ ] Audit logs
- [ ] ISO export tools
- [ ] Performance optimization

---

*ChemLab — Digitalizing laboratory intelligence, one analysis at a time.*
