# Feature: Bulk Approval

## Feature ID
`F-13`

## Purpose
Allow Finance managers to approve or reject multiple expenses in a single atomic action, reducing repetitive clicks and speeding up high-volume approval queues. Ensure all-or-nothing execution to prevent partial processing.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-13-1 | Finance | As a Finance manager, I want to approve multiple expenses at once so I don't have to action each one individually. |
| US-13-2 | Finance | As a Finance manager, I want a failed bulk approval to roll back completely so no expenses are partially processed. |
| US-13-3 | Manager | As a manager, I want to bulk-approve my team's compliant expenses at the end of the week. |

---

## Functional Requirements

- Finance and Manager roles can submit a bulk action request with a list of `expense_id`s.
- Supported bulk actions: `approve`, `reject`.
- All expenses in the batch must be in `pending_approval` status and assigned to the requesting approver at the current level.
- Batch is executed atomically:
  - All succeed → `200 OK` with list of processed expense IDs.
  - Any failure (invalid ID, wrong status, version conflict) → entire batch rolls back; `207 Multi-Status` returned with per-item error details.
- Each successfully actioned expense:
  - Triggers workflow advancement (F-10).
  - Triggers notifications (F-17).
  - Written to audit log.
- Bulk reject requires a single mandatory `reason` applied to all expenses in the batch, or per-item reasons.
- Maximum batch size: 50 expenses per request (configurable).

---

## Validation Rules

| Field | Rule |
|---|---|
| `expense_ids` | Required. Array. Min 1, max 50 items. Each must be a valid ObjectId. |
| `action` | Required. One of: `approve`, `reject`. |
| `reason` | Required if `action = reject`. Min 5 chars. |
| `version` | Required per expense — array of `{ expense_id, version }` objects for optimistic locking. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| One expense in batch is already actioned | Entire batch rolls back; `207` returned with failed item details. |
| One expense does not belong to requesting approver | Entire batch rolls back; `403` item detail in `207` response. |
| Batch size exceeds 50 | `422 Unprocessable Entity` — "Batch size cannot exceed 50." |
| Empty `expense_ids` array | `422 Unprocessable Entity` — "At least one expense ID is required." |
| Version mismatch on one item in batch | Entire batch rolls back; `409` item detail in `207` response. |
| Mix of valid and invalid expense IDs | Entire batch rolls back; invalid IDs listed in response. |

---

## Dependencies

| Dependency | Type |
|---|---|
| F-10 Approval Workflow Engine | Per-expense workflow advancement logic reused |
| F-12 Concurrent Conflict Prevention | Version check per expense in batch |
| F-17 Notifications | Notification per approved/rejected expense |
| `core-business-service` | Bulk action service with transaction |
| MongoDB | Transactional multi-document update (MongoDB session) |
| `audit_logs` | One entry per expense actioned |

---

## API Requirements

### `POST /api/v1/workflows/bulk-action`
**Access:** Manager, Finance

**Request:**
```json
{
  "action": "approve|reject",
  "reason": "string (required if reject)",
  "comment": "string|optional",
  "items": [
    { "expense_id": "string", "version": 2 },
    { "expense_id": "string", "version": 1 }
  ]
}
```

**Response 200 OK (all succeeded):**
```json
{
  "status": 200,
  "data": {
    "processed": ["expense_id_1", "expense_id_2"],
    "failed": []
  },
  "message": "Bulk action completed"
}
```

**Response 207 Multi-Status (partial/full failure — batch rolled back):**
```json
{
  "status": 207,
  "data": {
    "processed": [],
    "failed": [
      { "expense_id": "string", "error": "409 - Expense already actioned." },
      { "expense_id": "string", "error": "403 - Not your expense to approve." }
    ]
  },
  "message": "Bulk action failed. No changes were applied."
}
```

---

## Database Impact

Uses MongoDB multi-document transactions (replica set required):
- Each expense's `status` and workflow `version` updated atomically.
- If any document update fails, all updates in the session are rolled back.

**Collections affected:** `expenses`, `workflows`, `workflow_actions`, `audit_logs`, `notifications` (F-17 trigger).

---

## UI Components

| Component | Description |
|---|---|
| `BulkSelectCheckbox` | Checkbox per row in approval queue table; "Select All" on page |
| `BulkActionToolbar` | Appears when ≥1 expense selected: Approve All / Reject All buttons + item count |
| `BulkRejectReasonInput` | Single reason field applied to all selected rejections |
| `BulkResultSummary` | Post-action modal: shows success count, failed items with reasons |
| `BulkRollbackAlert` | Shown when batch rolled back: "Action failed. No changes were applied." |

---

## Security Requirements

- Only the designated approver at the current workflow level can include an expense in their bulk batch.
- Bulk action endpoint enforces RBAC: Manager and Finance roles only.
- MongoDB transactions ensure atomicity — no partial writes.
- All bulk actions logged per expense in `audit_logs`.

---

## Acceptance Criteria

- [ ] GIVEN a Finance user selects 5 valid pending expenses, WHEN bulk approve is submitted, THEN all 5 are approved, workflow advances, and notifications are sent for each.
- [ ] GIVEN a batch of 5 where 1 expense is already actioned, WHEN bulk approve is submitted, THEN all 5 roll back and `207 Multi-Status` is returned with the conflict detail.
- [ ] GIVEN a batch size of 51, WHEN submitted, THEN `422 Unprocessable Entity` is returned.
- [ ] GIVEN bulk reject without a reason, WHEN submitted, THEN `422 Unprocessable Entity` is returned.
- [ ] GIVEN a successful bulk action, WHEN committed, THEN one audit log entry per expense is created.
- [ ] GIVEN a rolled-back batch, WHEN the audit log is checked, THEN no entries exist for that batch.

---

## Definition of Done

- [ ] `POST /api/v1/workflows/bulk-action` implemented
- [ ] MongoDB multi-document transaction implemented
- [ ] Per-item version (optimistic lock) check in batch
- [ ] All-or-nothing rollback on any failure
- [ ] `207 Multi-Status` response with per-item error detail
- [ ] Max batch size enforced (default: 50)
- [ ] Notification trigger per expense (F-17)
- [ ] Audit log per expense on success
- [ ] `BulkSelectCheckbox`, `BulkActionToolbar`, `BulkResultSummary` UI components
- [ ] Unit tests: all success, one failure rollback, batch too large, missing reason, RBAC block
- [ ] Integration test: full bulk approve flow with transaction verification
