# Feature: Approval Workflow Engine

## Feature ID
`F-10`

## Purpose
Route submitted expenses through a configurable multi-level approval chain based on the employee → manager hierarchy. Support approve, reject, and request-more-info actions at each level. Advance expenses through all approval stages until Finance Approved or Rejected.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-10-1 | Employee | As an employee, I want to know who is reviewing my expense and at which stage. |
| US-10-2 | Manager | As a manager, I want to see a queue of pending expenses from my team for review. |
| US-10-3 | Manager | As a manager, I want to approve, reject, or ask for more info on an expense with a comment. |
| US-10-4 | Finance | As a Finance user, I want to give final approval to expenses that have passed manager review. |

---

## Functional Requirements

- On expense creation (F-05), the workflow engine resolves the approval chain for the submitting employee.
- Approval chain: Employee → direct Manager → Finance (configurable levels).
- A `workflow` record is created with: `expense_id`, `chain` (ordered list of approver IDs and levels), `current_level`, `status`.
- Approver at current level receives a notification (F-17).
- Approver can:
  - **Approve** → advance to next level, or mark `finance_approved` if final level.
  - **Reject** → set expense status to `rejected`; notify employee.
  - **Request More Info** → set expense status to `info_requested`; notify employee; employee can update and resubmit.
- Only the designated approver for the current level can action the expense.
- On final approval (last level): expense status set to `finance_approved`; trigger reimbursement record creation.
- Approval actions recorded with: `approver_id`, `action`, `comment`, `timestamp`.
- Approval history visible on expense detail.

---

## Validation Rules

| Check | Rule |
|---|---|
| Approver identity | Only the user assigned as approver for the current level can action the expense. |
| Expense status | Only `pending_approval` or `info_resubmitted` expenses can be actioned. |
| Reject reason | `reason` field required on reject action. |
| Comment | Optional on approve, required on request-more-info. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Approver chain not resolvable (no manager assigned) | Expense routed to Finance directly; Admin notified. |
| Approver approves own expense | `403 Forbidden` — "Approvers cannot action their own expenses." |
| Expense already actioned (concurrent) | `409 Conflict` — "Expense already actioned." (See F-12) |
| Employee resubmits after `info_requested` | Status changes to `info_resubmitted`; workflow resumes from same level. |
| Multi-level: manager approves, finance rejects | Expense status set to `rejected`; all previous approval levels logged. |
| Manager deactivated mid-workflow | Workflow escalates to next available approver up the chain; Admin notified. |

---

## Dependencies

| Dependency | Type |
|---|---|
| F-05 Expense Submission | Triggers workflow creation |
| F-11 SLA Auto-Escalation | Monitors SLA on each workflow level |
| F-12 Concurrent Conflict Prevention | Optimistic lock on workflow action |
| F-17 Notifications | Triggered on each workflow event |
| `core-business-service` | Workflow engine service |
| MongoDB | `workflows`, `workflow_actions` collections |
| `users` collection | Manager hierarchy lookup |

---

## API Requirements

### `GET /api/v1/workflows/queue`
**Access:** Manager, Finance, Admin
**Query Params:** `?level=manager|finance&status=pending&page=1&limit=20`

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "pending_approvals": [
      {
        "workflow_id": "string",
        "expense_id": "string",
        "employee_name": "string",
        "amount": 150.00,
        "currency": "USD",
        "category": "Meals",
        "submitted_at": "ISO8601",
        "policy_violation": false,
        "sla_deadline": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1
  },
  "message": "Queue fetched"
}
```

---

### `POST /api/v1/workflows/expenses/:expense_id/approve`
**Request:**
```json
{ "comment": "Approved. Looks good." }
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "next_approver": "string|null",
    "status": "pending_approval|finance_approved"
  },
  "message": "Expense approved"
}
```

---

### `POST /api/v1/workflows/expenses/:expense_id/reject`
**Request:**
```json
{ "reason": "Receipt does not match claimed amount." }
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {},
  "message": "Expense rejected"
}
```

---

### `POST /api/v1/workflows/expenses/:expense_id/request-info`
**Request:**
```json
{ "message": "Please provide the hotel invoice instead." }
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {},
  "message": "Information requested"
}
```

---

## Database Impact

**Collection: `workflows`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `expense_id` | ObjectId | Ref: `expenses` |
| `employee_id` | ObjectId | Submitter |
| `chain` | Array[Object] | `[{ level: 1, approver_id, status, actioned_at }]` |
| `current_level` | Number | Active approval level index |
| `status` | Enum | `pending\|approved\|rejected\|info_requested\|finance_approved` |
| `version` | Number | Optimistic lock version (F-12) |
| `sla_deadline` | Date | Computed from config at creation (F-11) |
| `created_at` | Date | |
| `updated_at` | Date | |

**Collection: `workflow_actions`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `workflow_id` | ObjectId | |
| `expense_id` | ObjectId | |
| `approver_id` | ObjectId | |
| `level` | Number | |
| `action` | Enum | `approved\|rejected\|info_requested` |
| `comment` | String | |
| `timestamp` | Date | |

**Indexes:** `expense_id` (unique on workflows), `approver_id`, `status`, `sla_deadline`

---

## UI Components

| Component | Description |
|---|---|
| `ApprovalQueue` | Paginated list of pending expenses with filters (level, date, policy violation flag) |
| `ExpenseReviewDrawer` | Full detail: amount, receipt preview, OCR data, policy violations, history |
| `ApprovalActionBar` | Approve / Reject / Request Info buttons with comment input |
| `ApprovalHistoryTimeline` | Visual timeline of all approval actions with actor, timestamp, comment |
| `InfoRequestedBanner` | Shown to employee on their expense when info is requested |
| `ResubmitExpenseForm` | Allows employee to update and resubmit after info request |

---

## Security Requirements

- Approver can only action expenses assigned to them at the current workflow level.
- Employee cannot action their own expense (self-approval prevented at service layer).
- Workflow `version` field used for optimistic locking (F-12).
- All workflow actions written to `audit_logs`.

---

## Acceptance Criteria

- [ ] GIVEN a submitted expense, WHEN the workflow engine runs, THEN a workflow record is created with the correct approver chain based on employee → manager hierarchy.
- [ ] GIVEN a manager with pending expenses, WHEN they call `GET /api/v1/workflows/queue`, THEN only their assigned pending expenses appear.
- [ ] GIVEN a manager approves an expense, WHEN there is a next level (Finance), THEN the expense status remains `pending_approval` and is assigned to the Finance approver.
- [ ] GIVEN a Finance approver approves the final level, WHEN actioned, THEN expense status changes to `finance_approved`.
- [ ] GIVEN an approver attempts to action another approver's expense, WHEN the request is made, THEN `403 Forbidden` is returned.
- [ ] GIVEN an employee submits their own expense, WHEN the workflow assigns them as approver, THEN the expense escalates to the next level up the chain (self-approval prevention).
- [ ] GIVEN a rejection, WHEN the action fires, THEN the expense status is `rejected`, employee is notified, and the action is logged.

---

## Definition of Done

- [ ] Workflow engine creates workflow record on expense creation
- [ ] Approver chain resolution from `users` manager hierarchy
- [ ] `GET /api/v1/workflows/queue` with RBAC and pagination
- [ ] `POST approve`, `reject`, `request-info` endpoints
- [ ] Status transitions: `pending_approval → finance_approved / rejected / info_requested`
- [ ] Resubmit flow from `info_requested` state
- [ ] Self-approval prevention
- [ ] Optimistic lock version field (F-12)
- [ ] SLA deadline set on creation (F-11)
- [ ] Notification trigger on each action (F-17)
- [ ] Audit log on all actions
- [ ] Unit tests: chain resolution, approve→next level, final approval, reject, self-approval block, info request
- [ ] Integration test: full multi-level flow from submission to finance_approved
