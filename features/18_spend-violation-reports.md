# Feature: Spend & Violation Reports

## Feature ID
`F-18`

## Purpose
Enable Finance users and Admins to generate filterable, exportable reports on organization-wide spend and policy violations. Support synchronous generation for small datasets and asynchronous job-based generation for large datasets, with export to CSV and PDF.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-18-1 | Finance | As a Finance user, I want to generate a spend report filtered by date, department, and category. |
| US-18-2 | Finance | As a Finance user, I want to export reports to CSV and PDF for offline review and sharing. |
| US-18-3 | Auditor | As an auditor, I want to see all policy violation records for a given period and department. |
| US-18-4 | Admin | As an admin, I want to view a full org-wide expense report for budget reconciliation. |

---

## Functional Requirements

**Report Types:**
1. **Spend Report:** All expense records with applied filters; aggregated totals per category/dept.
2. **Policy Violations Report:** All expenses with `policy_violation: true` in filter range.
3. **Audit Report:** All audit log entries for a given entity type and date range.

**Filters (all optional):**
- `date_from`, `date_to` (required for non-admin users)
- `department_id`
- `employee_id`
- `category_id`
- `status` (pending, approved, rejected, reimbursed)

**Output Formats:** `json` (API response), `csv` (file download), `pdf` (file download).

**Synchronous:** Datasets < 10,000 records → return immediately (< 10 seconds).
**Asynchronous:** Datasets ≥ 10,000 records → return `202 Accepted` with `job_id`; client polls for completion.

**Export:** File stored in cloud storage; pre-signed download URL returned.

---

## Validation Rules

| Field | Rule |
|---|---|
| `type` | Required. One of: `spend\|violations\|audit`. |
| `format` | Required. One of: `json\|csv\|pdf`. |
| `date_from` | ISO 8601. Required for non-admin users. |
| `date_to` | ISO 8601. Must be ≥ `date_from`. |
| `date_range` | Maximum 12-month range per request (configurable). |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No records match filters | `200 OK` with `records: []` and `total: 0`. |
| Large dataset (≥10,000 records) | `202 Accepted` with `job_id`; async processing begins. |
| Report job times out (> 5 minutes) | Job marked `failed`; user notified via in-app notification. |
| PDF generation fails | Fallback to CSV offered; user notified. |
| Date range exceeds 12 months | `422 Unprocessable Entity` — "Date range cannot exceed 12 months." |
| Employee-level filter applied by non-admin Finance | Allowed only for own-department employees. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `reporting-service` | Report generation and export |
| MongoDB | `expenses`, `audit_logs`, `policy_rules` aggregation |
| Cloud Object Storage | Stores CSV/PDF exports; pre-signed URL returned |
| Job Queue (BullMQ) | Async report job processing |
| F-03 RBAC | Finance, Admin, Auditor roles only |
| F-19 Audit Log | Source data for audit reports |
| F-17 Notifications | Notifies user when async report job completes |

---

## API Requirements

### `POST /api/v1/reports/generate`
**Access:** Finance, Admin, Auditor

**Request:**
```json
{
  "type": "spend|violations|audit",
  "filters": {
    "date_from": "2026-01-01",
    "date_to": "2026-06-30",
    "department_id": "string|optional",
    "employee_id": "string|optional",
    "category_id": "string|optional",
    "status": "approved|optional"
  },
  "format": "json|csv|pdf"
}
```

**Response 200 OK (sync, < 10k records):**
```json
{
  "status": 200,
  "data": {
    "report_url": "https://storage.platform.com/reports/uuid.csv",
    "records": [],
    "total": 245,
    "generated_at": "ISO8601"
  },
  "message": "Report generated"
}
```

**Response 202 Accepted (async, ≥ 10k records):**
```json
{
  "status": 202,
  "data": {
    "job_id": "string",
    "poll_url": "/api/v1/reports/status/job_id"
  },
  "message": "Report generation in progress"
}
```

---

### `GET /api/v1/reports/status/:job_id`
**Response (complete):**
```json
{
  "status": 200,
  "data": {
    "status": "complete",
    "report_url": "string",
    "total": 15000,
    "generated_at": "ISO8601"
  },
  "message": "Report ready"
}
```

**Response (processing):**
```json
{
  "status": 200,
  "data": { "status": "processing", "progress_percentage": 45 },
  "message": "Report in progress"
}
```

---

## Database Impact

**Collection: `report_jobs`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `job_id` | String | UUID |
| `requested_by` | ObjectId | Ref: `users` |
| `type` | Enum | `spend\|violations\|audit` |
| `filters` | Object | Applied filters |
| `format` | Enum | `json\|csv\|pdf` |
| `status` | Enum | `queued\|processing\|complete\|failed` |
| `progress_percentage` | Number | |
| `report_url` | String | Pre-signed URL on completion |
| `total_records` | Number | |
| `created_at` | Date | |
| `completed_at` | Date | |

**Indexes:** `requested_by`, `status`, `created_at`

---

## UI Components

| Component | Description |
|---|---|
| `ReportBuilderForm` | Type selector, filter pickers (date range, dept, employee, category, status), format selector |
| `GenerateReportButton` | Triggers POST; shows spinner during sync; shows job progress for async |
| `AsyncReportProgressBar` | Polls `status` endpoint; shows % complete with estimated time |
| `ReportResultsTable` | Inline table for JSON format results with sort and search |
| `DownloadReportButton` | Download CSV/PDF from pre-signed URL |
| `ReportHistoryList` | List of previously generated reports with download links (last 30 days) |

---

## Security Requirements

- Finance users can only access expenses within their authorized scope (org-wide for Finance, dept-limited for Managers using report).
- Report files stored with UUID filenames — original data patterns not deducible from URL.
- Pre-signed download URLs expire after 1 hour.
- `requested_by` validated: user can only poll their own job's status.
- All report generation requests written to `audit_logs`.

---

## Acceptance Criteria

- [ ] GIVEN a Finance user applies date and department filters, WHEN `POST /api/v1/reports/generate` is called with `format: csv`, THEN a CSV download URL is returned with all matching records.
- [ ] GIVEN a dataset ≥ 10,000 records, WHEN the report is requested, THEN `202 Accepted` with `job_id` is returned and the async job completes within 5 minutes.
- [ ] GIVEN a violation report request, WHEN generated, THEN only expenses with `policy_violation: true` in the filter range appear.
- [ ] GIVEN an empty result set, WHEN the report is generated, THEN `records: []` and `total: 0` are returned.
- [ ] GIVEN a date range exceeding 12 months, WHEN the report is requested, THEN `422` is returned.
- [ ] GIVEN a Finance user, WHEN `GET /api/v1/reports/status/:job_id` is called for another user's job, THEN `403 Forbidden` is returned.
- [ ] GIVEN a report is generated, WHEN committed, THEN an audit log entry is created.

---

## Definition of Done

- [ ] `POST /api/v1/reports/generate` with sync (< 10k) and async (≥ 10k) paths
- [ ] `GET /api/v1/reports/status/:job_id` polling endpoint
- [ ] BullMQ async job processing
- [ ] CSV and PDF export generation with cloud storage upload
- [ ] Pre-signed URL with 1-hour TTL
- [ ] `report_jobs` collection schema and indexes
- [ ] All 6 UI components
- [ ] Notification on async job completion (F-17)
- [ ] Audit log on report generation
- [ ] Unit tests: sync generation, async job, date range validation, empty results, job ownership check
- [ ] Integration test: large dataset async flow end-to-end
