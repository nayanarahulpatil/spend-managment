# Feature: Duplicate Receipt Detection

## Feature ID
`F-07`

## Purpose
Prevent employees from submitting the same receipt more than once — whether intentional or accidental — by comparing SHA-256 hashes of uploaded receipt files at expense submission time. Return a clear conflict error when a duplicate is detected.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-07-1 | Employee | As an employee, I want to be warned if I accidentally submit the same receipt twice. |
| US-07-2 | Finance | As a Finance manager, I want to prevent duplicate reimbursements from the same receipt. |
| US-07-3 | Admin | As an admin, I want duplicate detection to run automatically so no manual review is needed for obvious duplicates. |

---

## Functional Requirements

- On receipt upload (F-06), compute SHA-256 hash of the file content and return it as `receipt_hash`.
- On expense submission (F-05), store `receipt_hash` against the expense record.
- Before saving a new expense, query `expenses` collection for any existing record with the same `receipt_hash` and `employee_id`.
- If a match is found → return `409 Conflict` with message "Duplicate receipt detected."
- Cross-employee duplicate detection is optional (configurable by Admin) — by default, only same-employee duplicates are blocked.
- Deleted (`soft-deleted`) expenses: their `receipt_hash` still participates in duplicate detection.

---

## Validation Rules

| Check | Rule |
|---|---|
| `receipt_hash` | Computed from raw file bytes using SHA-256. Stored as hex string. |
| Duplicate scope | Default: same `employee_id` + same `receipt_hash`. Configurable: global (any employee). |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Same receipt, same employee, second submission | `409 Conflict` — "Duplicate receipt detected. This receipt was already submitted." |
| Same receipt, different employee (cross-employee mode off) | Allowed — no conflict returned. |
| Same receipt, different employee (cross-employee mode on) | `409 Conflict` — "This receipt has already been submitted by another employee." |
| Receipt from soft-deleted expense resubmitted | `409 Conflict` — deleted expense's hash still indexed. |
| Two different files with same visual content (different bytes) | No conflict — hash differs; not detected. |
| File re-uploaded but not submitted as expense | No conflict — hash checked only at expense submission, not upload. |

---

## Dependencies

| Dependency | Type |
|---|---|
| F-06 Receipt Upload & OCR | Computes and returns `receipt_hash` |
| F-05 Expense Submission | Triggers duplicate check before saving |
| `core-business-service` | Duplicate check logic in expense service |
| MongoDB | `expenses` collection — index on `receipt_hash` + `employee_id` |

---

## API Requirements

No standalone endpoint. Logic embedded in `POST /api/v1/expenses`.

**On duplicate detected, `POST /api/v1/expenses` returns:**
```json
{
  "status": 409,
  "data": {
    "conflicting_expense_id": "string"
  },
  "message": "Duplicate receipt detected. This receipt was already submitted."
}
```

---

## Database Impact

**Collection: `expenses`**
| Field | Type | Notes |
|---|---|---|
| `receipt_hash` | String | SHA-256 hex. Indexed. |
| `employee_id` | ObjectId | Combined index with `receipt_hash` |

**Compound Index:** `{ receipt_hash: 1, employee_id: 1 }` — enables fast duplicate lookup.

**Global mode:** Index on `{ receipt_hash: 1 }` alone.

---

## UI Components

| Component | Description |
|---|---|
| `DuplicateReceiptWarning` | Modal/banner shown on `409` response with link to the conflicting expense |
| `ConflictingExpenseLink` | Displays expense ID of the previously submitted duplicate with "View" action |

---

## Security Requirements

- SHA-256 computation performed server-side — client-provided hash not trusted.
- `conflicting_expense_id` returned in error response only if it belongs to the same employee (prevent data leakage of other employees' expense IDs in single-employee mode).
- Audit log entry created when a duplicate is detected and blocked.

---

## Acceptance Criteria

- [ ] GIVEN an employee submits the same receipt image twice, WHEN the second submission is made, THEN `409 Conflict` is returned with `conflicting_expense_id`.
- [ ] GIVEN the same receipt from a different employee (cross-employee mode off), WHEN submitted, THEN `201 Created` is returned — no conflict.
- [ ] GIVEN a soft-deleted expense with a receipt hash, WHEN the same receipt is resubmitted, THEN `409 Conflict` is returned.
- [ ] GIVEN a `409` response, WHEN the UI renders, THEN the conflicting expense ID is displayed with a "View" link.
- [ ] GIVEN a duplicate is blocked, WHEN the event fires, THEN an audit log entry is created.

---

## Definition of Done

- [ ] SHA-256 hash stored on expense record at submission
- [ ] Duplicate check query before expense insert
- [ ] Compound index `{ receipt_hash, employee_id }` on `expenses`
- [ ] `409 Conflict` response with `conflicting_expense_id`
- [ ] Cross-employee mode configurable (feature flag or admin config)
- [ ] Audit log on duplicate detection
- [ ] `DuplicateReceiptWarning` UI component
- [ ] Unit tests: same employee duplicate, different employee (both modes), soft-deleted duplicate
