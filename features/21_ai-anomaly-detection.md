# Feature: AI Anomaly Detection

## Feature ID
`F-21`

## Purpose
Automatically identify statistical outliers and suspicious patterns in employee expense data — including amount outliers, duplicate vendor patterns, off-hours claims, and frequency anomalies — and surface them to Finance users for review, reducing financial fraud and policy misuse.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-21-1 | Finance | As a Finance user, I want to be automatically alerted to suspicious expense patterns so I can investigate potential fraud. |
| US-21-2 | Admin | As an admin, I want anomaly detection to run regularly so Finance doesn't need to manually audit every expense. |
| US-21-3 | Finance | As a Finance user, I want to see why an expense was flagged as an anomaly so I can make a review decision. |

---

## Functional Requirements

**Anomaly Types Detected:**
1. **Amount Outlier:** Expense amount is a statistical outlier (> 2 standard deviations from the employee's or category's historical mean).
2. **Duplicate Vendor Pattern:** Same vendor submitted multiple times in a short window (e.g., 3+ same-vendor expenses within 7 days) with similar amounts.
3. **Off-Hours Claims:** Expenses submitted at unusual hours (e.g., 2–5 AM in the employee's timezone).
4. **High-Frequency Submission:** Employee submits > N expenses in a single day (configurable threshold, default: 10).
5. **Category Mismatch:** Expense description and vendor inconsistent with selected category (AI-based).

- Anomaly detection runs:
  - **Synchronous micro-check:** Basic rules (amount outlier, high-frequency) checked at expense submission.
  - **Async batch scan:** Full anomaly analysis (all types) runs as a daily background job on recent expenses.
- Surfaced in: Finance dashboard (F-16), `GET /api/v1/ai/anomalies` endpoint.
- Finance user can dismiss an anomaly (mark as reviewed) with a note — does not modify the original expense.
- Anomaly detection does not block expense submission or approval.

---

## Validation Rules

| Config | Rule |
|---|---|
| Outlier threshold | Default: > 2 standard deviations. Configurable by Admin. |
| Duplicate vendor window | Default: 7 days. Configurable. |
| High-frequency threshold | Default: 10 expenses/day. Configurable. |
| Off-hours window | Default: 00:00–05:00 (local time). Configurable. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| New employee with < 5 historical expenses | Outlier detection skipped (insufficient baseline); amount-limit rule falls back to category average. |
| AI service unavailable during batch scan | Category mismatch detection skipped for that run; other rule-based anomalies still run. |
| False positive dismissed by Finance | Anomaly marked `reviewed: true`; not re-flagged on next scan for same expense. |
| Anomaly detection flags a compliance-approved expense | Flag displayed; Finance can review and dismiss. Approval is not reversed. |
| All anomalies dismissed | `GET /api/v1/ai/anomalies` returns empty array with `total: 0`. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `ai-service` | Anomaly detection service (batch + sync micro-check) |
| OpenAI API | Category mismatch detection (LLM) |
| MongoDB | `expenses` historical data for statistical analysis |
| Job Scheduler (`@nestjs/schedule`) | Daily batch job trigger |
| F-16 Finance Dashboard | Anomaly count and list surfaced in dashboard |
| F-17 Notifications | Finance notified when new anomalies are detected |
| F-03 RBAC | Finance, Admin only for anomaly endpoints |

---

## API Requirements

### `GET /api/v1/ai/anomalies`
**Access:** Finance, Admin
**Query Params:** `?employee_id=string|optional&department_id=string|optional&type=string|optional&reviewed=false&page=1&limit=20`

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "anomalies": [
      {
        "anomaly_id": "string",
        "expense_id": "string",
        "employee_name": "string",
        "anomaly_type": "amount_outlier",
        "severity": "high|medium|low",
        "description": "Expense amount $850 is 3.2x the employee's average for Meals category ($265).",
        "detected_at": "ISO8601",
        "reviewed": false,
        "reviewer_id": null,
        "review_note": null
      }
    ],
    "total": 8,
    "page": 1
  },
  "message": "Anomalies fetched"
}
```

---

### `PATCH /api/v1/ai/anomalies/:id/review`
**Access:** Finance, Admin

**Request:**
```json
{
  "note": "Verified with employee. Client entertainment event. No issue."
}
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {},
  "message": "Anomaly marked as reviewed"
}
```

---

## Database Impact

**Collection: `anomalies`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `expense_id` | ObjectId | Ref: `expenses` |
| `employee_id` | ObjectId | |
| `anomaly_type` | Enum | `amount_outlier\|duplicate_vendor\|off_hours\|high_frequency\|category_mismatch` |
| `severity` | Enum | `high\|medium\|low` |
| `description` | String | Human-readable explanation |
| `detected_at` | Date | |
| `reviewed` | Boolean | Default: false |
| `reviewer_id` | ObjectId | Ref: `users` |
| `review_note` | String | |
| `reviewed_at` | Date | |

**Indexes:** `employee_id`, `expense_id`, `anomaly_type`, `reviewed`, `detected_at`

---

## UI Components

| Component | Description |
|---|---|
| `AnomalyFlagBadge` | Red/amber badge on expense card in Finance queue when anomaly detected |
| `AnomalyDetailPanel` | Shows anomaly type, severity, description, and review action for each flagged expense |
| `AnomalyInboxList` | Finance page: list of all unreviewed anomalies with filters by type, severity, employee |
| `ReviewAnomalyModal` | Finance dismisses anomaly with a note; shows reviewer name and timestamp |
| `AnomalySeverityChip` | Color-coded: red (high), amber (medium), grey (low) |

---

## Security Requirements

- Anomaly data accessible by Finance and Admin only.
- Employee personal spend patterns (used for outlier baseline) never exposed in API responses — only the anomaly description.
- Review actions written to `audit_logs`.
- Batch job runs with a service account — not triggerable by end users.

---

## Acceptance Criteria

- [ ] GIVEN historical expense data, WHEN the anomaly detection batch job runs, THEN ≥ 90% of seeded anomaly patterns are detected (test data).
- [ ] GIVEN a flagged anomaly, WHEN `GET /api/v1/ai/anomalies` is called by Finance, THEN the anomaly appears with `anomaly_type`, `severity`, and `description`.
- [ ] GIVEN a Finance user dismisses an anomaly with a note, WHEN `PATCH /api/v1/ai/anomalies/:id/review` is called, THEN `reviewed: true`, `reviewer_id`, and `review_note` are saved.
- [ ] GIVEN a dismissed anomaly, WHEN the batch job runs again, THEN the dismissed anomaly is not re-flagged.
- [ ] GIVEN an Employee role token, WHEN `GET /api/v1/ai/anomalies` is called, THEN `403 Forbidden` is returned.
- [ ] GIVEN a false-positive rate test on 1,000 known-clean expenses, THEN < 20% are incorrectly flagged.

---

## Definition of Done

- [ ] `GET /api/v1/ai/anomalies` with filters and pagination
- [ ] `PATCH /api/v1/ai/anomalies/:id/review` implemented
- [ ] All 5 anomaly detection rules implemented (rule-based + AI for category mismatch)
- [ ] Daily batch job implemented with `@nestjs/schedule`
- [ ] Synchronous micro-check at expense submission (amount outlier + high-frequency)
- [ ] `anomalies` collection schema and indexes
- [ ] Finance notification on new anomaly batch result (F-17)
- [ ] All 5 UI components
- [ ] Audit log on review actions
- [ ] Unit tests: each anomaly type, dismissed → not re-flagged, AI unavailable → partial scan, RBAC
- [ ] Integration test: seeded anomaly data → batch job → Finance inbox shows flags
