# Project Handoff Document: Enterprise Spend Management Suite

This document outlines the detailed system setup, complete folder structures, completed features, configuration profiles, and next steps for continuing the development lifecycle.

For system architecture details, refer to the [PROJECT_CONTEXT.md](file:///d:/vibe%20code/spend-managment/doc/PROJECT_CONTEXT.md) document.

---

## 1. Project Folder Structure

### Backend Layout (`project/backend`)
```
project/backend/
├── src/
│   ├── main.ts                     # API entry point & configuration setup
│   ├── app.module.ts               # Roots all database/business module registrations
│   │
│   ├── config/
│   │   └── configuration.ts        # Environment mapping and validation schemas
│   │
│   ├── database/
│   │   ├── mongodb.module.ts       # Mongoose client initialization
│   │   ├── redis.module.ts         # Redis client configuration
│   │   └── redis.service.ts        # Cache helper with memory fallbacks
│   │
│   ├── common/                     # Shared filters, guards, and interceptors
│   │   └── filters/
│   │       └── pii-masking.filter.ts # Automatically masks sensitive identifiers
│   │
│   └── modules/                    # Feature business logic modules
│       ├── auth/                   # JWT & OAuth2 login flows
│       ├── users/                  # User records and department profiles
│       ├── expenses/               # Core expense submissions & OCR checks
│       ├── workflow/               # Approval queues, SLA triggers & rules
│       ├── notifications/          # In-app feed and FCM notification engines
│       ├── reporting/              # Statistics aggregations & compilers
│       ├── dashboard/              # Role-specific analytics metrics
│       └── ai/                     # Anomaly detection & Chatbot assistants
│
├── package.json
└── Dockerfile
```

### Frontend Layout (`project/frontend`)
```
project/frontend/
├── src/
│   ├── main.tsx                    # React client entry point
│   ├── App.tsx                     # Core coordinator & Tab layouts
│   ├── index.css                   # Global styles & typography overrides
│   │
│   ├── store/
│   │   └── index.ts                # Redux state & authentication credentials
│   │
│   ├── components/                 # Shared presentation layouts
│   │   ├── Header.tsx              # Page titles & search inputs
│   │   └── Sidebar.tsx             # Tab navigation links & user profiles
│   │
│   ├── services/
│   │   └── api.ts                  # RTK Query API endpoints & cache declarations
│   │
│   └── features/                   # Screen view components
│       ├── auth/                   # Secure login inputs
│       ├── dashboard/              # Metrics overview tables
│       ├── expenses/               # New expense form & receipt dropzone
│       ├── workflow/               # Approvals list & rule editor tabs
│       ├── reporting/              # Audit trail table & department charts
│       ├── notifications/          # Notifications logs
│       └── ai/                     # Policy chat panel & forecasting widget
│
├── tailwind.config.js              # Theme custom font mappings
└── vite.config.ts
```

---

## 2. Completed Features

All features correspond directly to core PRD specifications and Stitch design layouts:

| Feature Area | Component / File | Functional Accomplishments |
| :--- | :--- | :--- |
| **Authentication** | [auth.service.ts](file:///d:/vibe%20code/spend-managment/project/backend/src/modules/auth/auth.service.ts) | Double-tokens JWT refresh cycles, hashed credentials, and role-based route permissions. |
| **User Directory** | [UsersTab.tsx](file:///d:/vibe%20code/spend-managment/project/frontend/src/features/users/UsersTab.tsx) | Clean filters (Department, Status, Role), outside-click dropdown handler, profile creation forms with password inputs, and soft-delete invalidations. |
| **Expense Core** | [expenses.service.ts](file:///d:/vibe%20code/spend-managment/project/backend/src/modules/expenses/expenses.service.ts) | Duplicate receipt validation (hash matching), idempotency key caching, and automatic conversions. |
| **Approvals Queue** | [WorkflowTab.tsx](file:///d:/vibe%20code/spend-managment/project/frontend/src/features/workflow/WorkflowTab.tsx) | Rule builder with SLA auto-escalations, multi-level limit filters, and actions (Approve/Reject/More Info). |
| **Analytics Dashboard** | [DashboardTab.tsx](file:///d:/vibe%20code/spend-managment/project/frontend/src/features/dashboard/DashboardTab.tsx) | High-fidelity Bento layout with role-based statistics (personal vs team approved spends, active policy violation rings). |
| **Reporting & Audit** | [ReportingTab.tsx](file:///d:/vibe%20code/spend-managment/project/frontend/src/features/reporting/ReportingTab.tsx) | Real-time database audit log feed, category pie charts, spend by department bar graphs, and dynamic report downloads. |
| **AI Assistant Hub** | [AiTab.tsx](file:///d:/vibe%20code/spend-managment/project/frontend/src/features/ai/AiTab.tsx) | Chatbot with citation blocks, session continuity caching in Redis, Q4 forecast graphs, sensitivity sliders, and intelligence log tables. |
| **Typography Scale** | [index.css](file:///d:/vibe%20code/spend-managment/project/frontend/src/index.css) | Boosted root scale (`109.375%` / 17.5px base) and targeted overrides for micro-font classes. |

---

## 3. Environment Variables (`.env`)

Configure the following variables in a root `.env` or configuration profile:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/spend-management

# Caching Layer
REDIS_HOST=localhost
REDIS_PORT=6379

# Cryptography
JWT_SECRET=your_jwt_access_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here

# AI Services
OPENAI_API_KEY=your_openai_api_key_here
```

---

## 4. Commands to Run & Verify

Due to local group security policies, execution commands must be launched directly on the host system:

### 1. Start Database and Cache (Docker Compose)
```bash
# Run from the project root containing docker-compose.yml
docker-compose up -d
```

### 2. Launch NestJS Backend API
```bash
cd project/backend
npm install
npm run start:dev
```

### 3. Launch React Frontend
```bash
cd project/frontend
npm install
npm run dev
```

---

## 5. Pending Tasks & What Should Be Done Next

The remaining roadmap targets security audits and performance tuning (Sprints 11 & 12):

1. **Setup End-to-End (E2E) Test Suite**:
   - Implement frontend integration tests using Cypress/Playwright.
   - Expand Jest E2E tests for concurrency approvals lock handling.
2. **Implement Notification Webhooks**:
   - Replace Firebase Admin SDK mock placeholders in [notifications.service.ts](file:///d:/vibe%20code/spend-managment/project/backend/src/modules/notifications/notifications.service.ts) with real firebase connection configurations.
3. **Conduct Role Auditing (RBAC Validation)**:
   - Perform validation checks ensuring no user with a subordinate role (`employee`) can query admin/auditor routes.
4. **Load Testing & Optimization**:
   - Run Apache Bench or K6 load tests to verify database query response times are under `1s` at P95 under concurrent loads.
