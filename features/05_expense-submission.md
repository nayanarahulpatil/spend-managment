# Feature: Expense Submission

## Feature ID
`F-05`

## Purpose
Allow authenticated employees to submit business expense claims with all required metadata. Trigger real-time policy validation at submission time. Create an expense record and initiate the approval workflow.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-05-1 | Employee | As an employee, I want to submit an expense with amount, category, and receipt so I can get reimbursed. |
| US-05-2 | Employee | As an employee, I want to know immediately if my expense violates a policy so I can adjust before submission. |
| US-05-3 | Employee | As an employee, I want to view, edit (if still pending), and delete my submitted expenses. |
| US-05-4 | Manager | As a manager, I want submitted expenses to automatically enter my approval queue. |

---

## Functional Requirements

- Employee submits expense with: `amount`, `currency`, `category_id`, `cost_center_id`, `date`, `description`, `receipt_url`.
- `receipt_url` is mandatory for expenses above $25 (configurable threshold).
- System runs real-time policy check at submission:
  - If amount exceeds category policy limit → set `policy_violation: true`, store `violation_reason`.
  - Expense still saved and forwarded to workflow (not blocked).
- Approved expense record status: `pending_approval`.
- System triggers workflow engine to resolve and assign the approval chain.
- Submission notification sent to employee (in-app + email).
- Employee can edit a `pending_approval` expense (before any approver action).
- Employee can delete a `pending_approval` expense (before any approver action).
- Editing/deleting after approval action has started returns `409 Conflict`.
- Paginated list of own expenses with status filter.

---

## Validation Rules

| Field | Rule |
|---|---|
| `amount` | Required. Positive number. Max 2 decimal places. |
| `currency` | Required. Valid ISO 4217 currency code (e.g., `USD`, `INR`). |
| `category_id` | Required. Must reference a valid active expense category. |
| `cost_center_id` | Required. Must reference a valid cost center for the employee's department. |
| `date` | Required. ISO 8601 format. Cannot be a future date. Cannot be older than 90 days (configurable). |
| `description` | Required. Min 5, max 500 chars. |
| `receipt_url` | Required if amount > $25. Must be a valid URL (uploaded via F-06). |
| `idempotency_key` | Optional header. Used for retry deduplication. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Amount > policy limit | Save expense with `policy_violation: true`; notify approver of violation flag. |
| Missing receipt for amount > $25 | `422 Unprocessable Entity` — "Receipt required for expenses above $25." |
| Future date submitted | `422` — "Expense date cannot be a future date." |
| Date older than 90 days | `422` — "Expense date exceeds the allowed submission window." |
| Invalid `category_id` | `422` — "Invalid or inactive expense category." |
| Retry with same `idempotency_key` | Return original expense record; do not create duplicate. |
| Edit after approver has acted | `409 Conflict` — "Expense cannot be modified after approval action." |
| Delete after approval | `409 Conflict` — "Expense cannot be deleted after approval action." |

---

## Dependencies

| Dependency | Type |
|---|---|
| `core-business-service` | Expense CRUD, policy engine |
| `api-gateway` | RBAC (Employee+ allowed) |
| MongoDB | `expenses`, `categories`, `cost_centers`, `policy_rules` collections |
| `notification-service` | Submission confirmation notification |
| Workflow Engine (F-10) | Triggered after successful expense creation |
| Receipt Upload (F-06) | `receipt_url` must be pre-uploaded before submission |
| Policy Engine (F-09) | Called synchronously during submission |

---

## API Requirements

### `POST /api/v1/expenses`
**Request:**
```json
{
  "amount": 150.00,
  "currency": "USD",
  "category_id": "string",
  "cost_center_id": "string",
  "date": "2026-06-15",
  "description": "Client lunch",
  "receipt_url": "string"
}
```
**Headers:** `Idempotency-Key: <uuid>` (optional)

**Response 201 Created:**
```json
{
  "status": 201,
  "data": {
    "expense_id": "string",
    "policy_violation": false,
    "violation_reason": null
  },
  "message": "Expense submitted"
}
```

---

### `GET /api/v1/expenses`
**Query Params:** `?status=pending_approval|approved|rejected|all&page=1&limit=20`

**Response 200 OK:**
```json
{
  "status": 200,
  "data": { "expenses": [], "total": 0, "page": 1 },
  "message": "Expenses fetched"
}
```
*Employee sees only own expenses. Manager/Finance sees team expenses.*

---

### `GET /api/v1/expenses/:id`
**Response 200 OK:**
```json
{
  "status": 200,
  "data": { "expense": {} },
  "message": "Expense fetched"
}
```
**Errors:** `404` not found | `403` not owner/authorized

---

### `PATCH /api/v1/expenses/:id`
**Request:**
```json
{ "description": "string|optional", "category_id": "string|optional" }
```
**Errors:** `409` if expense already actioned

---

### `DELETE /api/v1/expenses/:id`
**Response 200 OK:** `{ "status": 200, "data": {}, "message": "Expense deleted" }`
**Errors:** `409` if expense already actioned | `403` if not owner

---

## Database Impact

**Collection: `expenses`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `employee_id` | ObjectId | Ref: `users` |
| `amount` | Number | Original amount |
| `currency` | String | ISO 4217 |
| `converted_amount` | Number | Base currency (set by F-08) |
| `base_currency` | String | Platform base currency |
| `category_id` | ObjectId | Ref: `categories` |
| `cost_center_id` | ObjectId | Ref: `cost_centers` |
| `date` | Date | Expense incurred date |
| `description` | String | |
| `receipt_url` | String | |
| `receipt_hash` | String | SHA-256, for duplicate detection (F-07) |
| `status` | Enum | `pending_approval\|approved\|rejected\|reimbursed` |
| `policy_violation` | Boolean | |
| `violation_reason` | String | Nullable |
| `idempotency_key` | String | Indexed, unique |
| `workflow_id` | ObjectId | Ref: `workflows` |
| `created_at` | Date | |
| `updated_at` | Date | |
| `deleted_at` | Date | Soft delete |

**Indexes:** `employee_id`, `status`, `date`, `idempotency_key` (unique), `receipt_hash`

---

## UI Components

| Component | Description |
|---|---|
| `NewExpenseForm` | Multi-step form: receipt upload → details (pre-filled from OCR) → category/cost center → review |
| `PolicyViolationBanner` | Inline warning if policy limit exceeded; allows continue or adjust |
| `ExpenseListTable` | Paginated list with status filter, sort by date/amount |
| `ExpenseDetailDrawer` | Full detail view: receipt preview, timeline, approval status |
| `EditExpenseModal` | Editable form for `pending_approval` expenses only |
| `DeleteConfirmDialog` | Confirmation before delete |
| `SkeletonLoader` | Shown during list and detail fetch |

---

## Security Requirements

- Employee can only view/edit/delete their own expenses.
- `receipt_url` validated as a URL from the platform's own storage domain (prevent external URL injection).
- All expense mutations written to `audit_logs`.
- `amount` field sanitized — no string injection possible (validated as number).

---

## Acceptance Criteria

- [ ] GIVEN a logged-in employee with a valid receipt URL, WHEN they submit an expense within policy limits, THEN a `201 Created` response is returned with `policy_violation: false` and status `pending_approval`.
- [ ] GIVEN an expense amount exceeds the category policy limit, WHEN submitted, THEN `policy_violation: true` and `violation_reason` are returned.
- [ ] GIVEN an expense above $25 with no `receipt_url`, WHEN submitted, THEN `422` is returned.
- [ ] GIVEN a retry with the same `idempotency_key`, WHEN submitted, THEN the original expense record is returned — no duplicate created.
- [ ] GIVEN a `pending_approval` expense, WHEN the employee edits it, THEN `200 OK` is returned with updated data.
- [ ] GIVEN an expense that has been approved/rejected, WHEN the employee attempts to edit or delete, THEN `409 Conflict` is returned.
- [ ] GIVEN a successful submission, WHEN the event fires, THEN an audit log entry is created.

---

## Definition of Done

- [ ] `POST /api/v1/expenses` with policy check and idempotency
- [ ] `GET /api/v1/expenses` with ownership filter and pagination
- [ ] `GET /api/v1/expenses/:id` with ownership check
- [ ] `PATCH /api/v1/expenses/:id` with status guard
- [ ] `DELETE /api/v1/expenses/:id` with status guard and soft delete
- [ ] Policy engine integration (F-09)
- [ ] Workflow trigger on creation (F-10)
- [ ] Notification trigger on creation (F-17)
- [ ] Audit log on all mutations
- [ ] MongoDB indexes
- [ ] Unit tests: all validations, idempotency, status guards, ownership
- [ ] Integration test: full submission → workflow trigger flow
