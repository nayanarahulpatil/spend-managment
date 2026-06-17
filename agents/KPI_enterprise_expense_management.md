# KPI Document

**Project:** Enterprise Employee Expense Management Platform
**Version:** 1.0
**Date:** 2026-06-16
**Reference:** PRD_enterprise_expense_management.md

---

# KPI Matrix

## Auth Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| AUTH-01 | Login Success Rate | % of login attempts that succeed without system error | ≥ 99.5% of valid credential logins return `200 OK` with tokens |
| AUTH-02 | Login API Latency | Response time for `POST /api/v1/auth/login` at P95 | < 500ms at P95 under 500 concurrent users |
| AUTH-03 | MFA Enforcement Rate | % of non-exempt users challenged with MFA on login | 100% of users with MFA-enabled role are challenged |
| AUTH-04 | Token Refresh Success Rate | % of valid refresh token calls that return a new access token | ≥ 99.9% success rate for non-expired refresh tokens |
| AUTH-05 | Unauthorized Access Block Rate | % of requests with invalid/expired tokens blocked by API Gateway | 100% of expired/invalid tokens return `401 Unauthorized` |
| AUTH-06 | Brute-Force Lockout Enforcement | Account locked after N consecutive failed login attempts | Account locked after 5 failed attempts; `423 Locked` returned |
| AUTH-07 | Session Expiry Compliance | Access tokens expire within the configured TTL | 100% of tokens expire within configured TTL (e.g., 15 minutes) |
| AUTH-08 | Logout Invalidation | Refresh token is invalidated server-side on logout | 100% of logout calls result in refresh token blacklisting; re-use returns `401` |

---

## User Management Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| USR-01 | User Creation Success Rate | % of `POST /api/v1/users` calls that successfully create a user record | ≥ 99% success rate for valid payloads |
| USR-02 | User Creation API Latency | Response time for `POST /api/v1/users` at P95 | < 500ms at P95 |
| USR-03 | Role Assignment Accuracy | % of users assigned the correct role matching the request payload | 100% — role in DB matches role in `PATCH /api/v1/users/:id` payload |
| USR-04 | Duplicate User Prevention | System rejects creation of a user with an already-registered email | 100% of duplicate email submissions return `409 Conflict` |
| USR-05 | RBAC Enforcement Coverage | % of role-restricted endpoints that correctly enforce access control | 100% of endpoints return `403 Forbidden` for unauthorized roles |
| USR-06 | Department/Cost-Center Mapping Accuracy | % of users correctly linked to a valid department and cost-center | 100% — invalid `department_id` returns `422 Unprocessable Entity` |
| USR-07 | User Soft-Delete Compliance | Deactivated users cannot authenticate or perform actions | 100% of deactivated user login attempts return `401 Unauthorized` |
| USR-08 | PII Data Masking in Logs | Employee PII is not exposed in system logs or API error responses | 0 PII fields (email, name) present in error logs or non-authenticated responses |

---

## Expense Management Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| EXP-01 | Expense Submission Success Rate | % of valid `POST /api/v1/expenses` calls that create an expense record | ≥ 99% success rate |
| EXP-02 | Expense Submission API Latency | P95 response time for `POST /api/v1/expenses` | < 500ms at P95 under normal load |
| EXP-03 | Policy Violation Detection Rate | % of expenses exceeding category policy limit correctly flagged | 100% — `policy_violation: true` returned for all over-limit submissions |
| EXP-04 | OCR Field Extraction Accuracy | % of clear receipt images with correctly extracted amount, date, and vendor | ≥ 90% accuracy on clear, machine-printed receipts |
| EXP-05 | OCR Processing Latency | Time from receipt upload to OCR data returned | < 5 seconds for images ≤ 5MB |
| EXP-06 | Duplicate Receipt Detection Rate | % of duplicate receipts (same hash) correctly rejected | 100% of duplicate receipts return `409 Conflict` |
| EXP-07 | Missing Receipt Enforcement | Expenses above threshold ($25) without receipt are rejected | 100% of such submissions return `422 Unprocessable Entity` |
| EXP-08 | Multi-Currency Support Accuracy | Expense amounts correctly converted using live FX rate at submission time | 100% of multi-currency expenses store both original and converted amounts |
| EXP-09 | Idempotent Submission Handling | Retried submissions with same `idempotency_key` do not create duplicate records | 100% of retry requests with existing key return original record without duplication |
| EXP-10 | Expense Pagination Correctness | `GET /api/v1/expenses` returns correct paginated results | Page size, total count, and record subset match query params in 100% of calls |

---

## Workflow Management Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| WF-01 | Approval Chain Resolution Accuracy | % of submitted expenses routed to the correct first-level approver per org policy | 100% correct routing based on employee → manager hierarchy |
| WF-02 | Approval Action API Latency | P95 response time for approve/reject endpoints | < 500ms at P95 |
| WF-03 | SLA Breach Escalation Rate | % of SLA-breached expenses that trigger auto-escalation to secondary approver | 100% — escalation fires within 5 minutes of SLA expiry |
| WF-04 | Concurrent Approval Conflict Prevention | % of concurrent approval conflicts correctly prevented via optimistic locking | 100% — second concurrent action returns `409 Conflict` |
| WF-05 | Multi-Level Approval Progression | Expenses correctly advance through all configured approval levels | 100% of multi-level expenses reach Finance Approved only after all levels complete |
| WF-06 | Bulk Approval Accuracy | Bulk approval actions are applied to all selected expenses without partial failure | 100% atomicity — all-or-nothing; partial failures roll back and return error |
| WF-07 | Rejection Reason Capture Rate | % of rejections that include a mandatory reason/comment | 100% — reject endpoint returns `422` if `reason` field is absent |
| WF-08 | Approval Queue Load Time | Time to load the approval queue page for an approver with up to 500 pending items | < 2 seconds at P95 |

---

## Dashboard Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| DASH-01 | Dashboard Load Latency | Time to render role-specific dashboard with all widgets populated | < 3 seconds at P95 under 200 concurrent sessions |
| DASH-02 | Data Accuracy — Employee Summary | Employee's spend summary matches sum of their approved + pending expenses | 100% match between dashboard total and `GET /api/v1/expenses` aggregated total |
| DASH-03 | Data Accuracy — Manager Team View | Manager's team spend view reflects all direct-report expenses | 100% of direct-report expenses appear in manager dashboard |
| DASH-04 | Finance Approvals Queue Accuracy | Finance dashboard queue count matches actual pending Finance-level expenses | 100% match; no stale counts |
| DASH-05 | Executive Analytics Refresh Rate | Executive spend analytics data freshness | Data updated within 15 minutes of a new approval or reimbursement event |
| DASH-06 | Role-Based Dashboard Isolation | Employee cannot view other employees' expense data via dashboard | 100% — cross-user data access returns `403 Forbidden` |
| DASH-07 | Dashboard Availability | Dashboard is accessible during defined business hours | ≥ 99.9% uptime during business hours |

---

## Notification Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| NOTIF-01 | Notification Delivery Rate | % of triggered notifications successfully delivered (email + in-app) | ≥ 99.5% delivery rate |
| NOTIF-02 | Notification Delivery Latency | Time from triggering event to notification delivery | ≤ 60 seconds for 99% of notifications |
| NOTIF-03 | Event Coverage Completeness | % of defined events (submit, approve, reject, flag, reimburse) that trigger a notification | 100% — all 5 event types trigger notifications without manual intervention |
| NOTIF-04 | Unread Count Accuracy | `GET /api/v1/notifications` returns correct `unread_count` | 100% — count matches actual unread records for the authenticated user |
| NOTIF-05 | Notification De-duplication | Duplicate notifications not sent for the same event | 0 duplicate notifications per single event trigger |
| NOTIF-06 | Mark-as-Read Reliability | `PATCH /api/v1/notifications/:id/read` correctly marks notification as read | 100% — subsequent `GET` shows notification as read |
| NOTIF-07 | Escalation Notification Delivery | Both the employee and escalation manager receive escalation alert | 100% of SLA-breach escalations notify both parties within 5 minutes |

---

## Reporting & Audit Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| RPT-01 | Standard Report Generation Time | Time to generate reports with < 10,000 records | < 10 seconds for 99% of requests |
| RPT-02 | Large Report Async Completion Time | Time to complete async report job for > 10,000 records | < 5 minutes for datasets up to 100,000 records |
| RPT-03 | Report Data Accuracy | % of report records that match source database records | 100% — report output matches direct DB query for same filters |
| RPT-04 | Export Format Compliance | CSV and PDF exports are correctly formatted and complete | 100% of exports open without errors; all filtered records included |
| RPT-05 | Audit Log Completeness | % of create/update/delete actions captured in the immutable audit log | 100% — no action on expense or user entity goes unlogged |
| RPT-06 | Audit Log Immutability | Audit log records cannot be modified or deleted by any user role | 0 successful modifications or deletions of any audit log entry |
| RPT-07 | Audit Log Retention Compliance | Audit logs retained for the minimum required regulatory period | 100% of logs retained for ≥ 7 years (configurable per jurisdiction) |
| RPT-08 | Filter Accuracy | Report results match all applied filter combinations | 100% — results contain only records matching all active filters |
| RPT-09 | Audit Log Query Latency | Time to retrieve paginated audit log results at P95 | < 1 second for pages of 20 records |
| RPT-10 | Policy Violation Report Coverage | Violation reports include 100% of flagged expenses in the filter range | 100% — no flagged expense omitted from violation report |

---

## AI Assistant Module

| KPI Number | KPI Name | Description | Criteria |
|---|---|---|---|
| AI-01 | Categorization Acceptance Rate | % of AI-suggested categories accepted by users without modification | ≥ 85% acceptance rate across all categorization requests |
| AI-02 | Categorization Confidence Threshold | % of responses that include a confidence score ≥ 0.85 for known vendors | ≥ 85% of known-vendor requests return confidence ≥ 0.85 |
| AI-03 | Categorization API Latency | P95 response time for `POST /api/v1/ai/categorize` | < 1 second at P95 |
| AI-04 | Anomaly Detection Accuracy | % of flagged anomalies that are confirmed as genuine outliers upon review | ≥ 80% precision on flagged anomalies (< 20% false-positive rate) |
| AI-05 | Anomaly Detection Coverage | % of known anomaly patterns (amount outliers, duplicate vendors, off-hours claims) detected | ≥ 90% detection rate on seeded anomaly test data |
| AI-06 | Chatbot Response Accuracy | % of policy Q&A chatbot responses that correctly answer the user's question | ≥ 85% correct responses validated against policy documentation |
| AI-07 | Chatbot API Latency | P95 response time for `POST /api/v1/ai/chat` | < 2 seconds at P95 |
| AI-08 | Session Continuity | Chatbot correctly maintains context across messages within the same `session_id` | 100% — follow-up messages reference prior context within session |
| AI-09 | Model Degradation Monitoring | Categorization accuracy does not degrade below threshold after model updates | < 5% drop in acceptance rate post any model deployment; rollback if exceeded |

---

# Development Timeline

| Sprint | Focus Area | Deliverables |
|---|---|---|
| Sprint 1 | Foundation & Auth | `auth-service`: Login, Logout, Token Refresh, MFA; `api-gateway` setup; RBAC middleware; JWT infrastructure |
| Sprint 2 | User Management | User CRUD, role assignment, department/cost-center mapping, RBAC enforcement tests |
| Sprint 3 | Expense Core | Expense submission, receipt upload + OCR integration, policy violation engine, category management |
| Sprint 4 | Expense Extended | Multi-currency support, idempotency handling, duplicate receipt detection, expense retrieval + pagination |
| Sprint 5 | Workflow Engine | Approval chain configuration, approve/reject/request-info actions, multi-level progression, bulk approval |
| Sprint 6 | Workflow Automation | SLA timer + auto-escalation, concurrent conflict handling, approval queue API + load testing |
| Sprint 7 | Notifications | `notification-service`: event-driven triggers for all 5 event types, in-app + email delivery, de-duplication |
| Sprint 8 | Dashboard | Role-specific dashboard APIs, employee/manager/finance/executive views, data accuracy validation |
| Sprint 9 | Reporting & Audit | Standard and async report generation, CSV/PDF export, audit log write + query, retention policy config |
| Sprint 10 | AI Assistant | `ai-service`: categorization model integration, anomaly detection, chatbot (policy Q&A), session management |
| Sprint 11 | Integration & Security | End-to-end integration testing, penetration testing, RBAC audit, PII masking verification, rate limiting |
| Sprint 12 | Performance & UAT | Load testing all modules at P95 targets, bug fixing, UAT with stakeholders, final KPI validation |

---

# Success Criteria

| Category | Success Metric | Target |
|---|---|---|
| **Security** | Unauthorized role access blocked across all endpoints | 100% of unauthorized requests return `403 Forbidden` |
| **Security** | Brute-force lockout enforced on login | Account locked after 5 failed attempts; 0 bypass cases |
| **Security** | PII absent from system logs and error responses | 0 PII fields exposed in any log or non-authenticated API response |
| **Security** | Audit log is immutable | 0 successful modifications or deletions of audit log entries |
| **Performance** | Core API P95 latency (submit, approve, login) | < 500ms at P95 under defined load |
| **Performance** | Dashboard load time | < 3 seconds at P95 under 200 concurrent sessions |
| **Performance** | Standard report generation | < 10 seconds for datasets < 10,000 records |
| **Performance** | System uptime | ≥ 99.9% monthly uptime across all services |
| **Compliance** | Policy violation detection | 100% of over-limit expenses flagged at submission |
| **Compliance** | Audit log completeness | 100% of entity-level actions captured in audit log |
| **Compliance** | Audit log retention | ≥ 7 years retention enforced (configurable per jurisdiction) |
| **Operational** | Expense submission success rate | ≥ 99% |
| **Operational** | Notification delivery rate | ≥ 99.5% within 60 seconds of event trigger |
| **Operational** | SLA escalation execution | 100% of SLA-breached approvals auto-escalated within 5 minutes |
| **Operational** | Approval SLA compliance | ≥ 95% of expenses actioned within defined SLA window |
| **Quality** | OCR field extraction accuracy | ≥ 90% on clear, machine-printed receipts |
| **Quality** | AI categorization acceptance rate | ≥ 85% user acceptance without modification |
| **Quality** | AI anomaly detection precision | ≥ 80% (false-positive rate < 20%) |
| **Scalability** | Concurrent user support | System stable under 500 concurrent users across all modules |
| **Scalability** | Async report completion | Large reports (≤ 100,000 records) complete within 5 minutes |
