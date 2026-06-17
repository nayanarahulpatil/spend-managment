# Feature: Concurrent Approval Conflict Prevention

## Feature ID
`F-12`

## Purpose
Prevent two approvers from simultaneously actioning the same expense, which could result in inconsistent workflow state. Use optimistic locking on the workflow record to detect and reject concurrent modifications.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-12-1 | Manager | As a manager, I want to be alerted if an expense was already actioned by someone else when I try to approve. |
| US-12-2 | Finance | As a Finance user, I want concurrent approval conflicts to be prevented automatically. |

---

## Functional Requirements

- Each `workflow` document has a `version` field (integer, starts at 0, increments on every action).
- On any approval action (`approve`, `reject`, `request-info`), the client must send the current `version` in the request.
- Service performs a conditional update: `{ _id: workflow_id, version: N }` → update + increment version.
- If no document matches (version has already been incremented by another request), return `409 Conflict`.
- The response clearly states the conflict and instructs the user to refresh and retry.
- The `version` field is returned in all approval queue and workflow detail responses.

---

## Validation Rules

| Check | Rule |
|---|---|
| `version` field | Required in all approval action request bodies. |
| Conditional update | MongoDB `findOneAndUpdate` with `{ _id, version: N }` — atomic. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Two approvers click Approve simultaneously | First request succeeds (version matched); second returns `409 Conflict`. |
| Client sends stale `version` (refreshed list) | `409 Conflict` — "Expense already actioned. Refresh and retry." |
| Escalation runs during active approval attempt | Escalation increments version; subsequent approval action gets `409`. |
| Client does not send `version` | `422 Unprocessable Entity` — "Workflow version is required." |

---

## Dependencies

| Dependency | Type |
|---|---|
| F-10 Approval Workflow Engine | `workflow` record owner; version field initialized |
| F-11 SLA Auto-Escalation | Escalation also updates workflow version |
| MongoDB | Atomic `findOneAndUpdate` with version condition |
| `core-business-service` | Implements optimistic lock in workflow service |

---

## API Requirements

`version` field added to all approval action request bodies:

### `POST /api/v1/workflows/expenses/:expense_id/approve`
```json
{
  "comment": "string|optional",
  "version": 2
}
```

### `POST /api/v1/workflows/expenses/:expense_id/reject`
```json
{
  "reason": "string",
  "version": 2
}
```

### `POST /api/v1/workflows/expenses/:expense_id/request-info`
```json
{
  "message": "string",
  "version": 2
}
```

**Conflict Response `409`:**
```json
{
  "status": 409,
  "data": {},
  "message": "Expense already actioned. Please refresh and try again."
}
```

**Approval queue response includes `version`:**
```json
{
  "workflow_id": "string",
  "expense_id": "string",
  "version": 2,
  ...
}
```

---

## Database Impact

**Collection: `workflows`** — Added field:
| Field | Type | Notes |
|---|---|---|
| `version` | Number | Starts at 0. Incremented atomically on every action. |

**MongoDB operation pattern:**
```js
db.workflows.findOneAndUpdate(
  { _id: workflowId, version: clientVersion },
  { $set: { status: "approved", ... }, $inc: { version: 1 } },
  { returnDocument: "after" }
)
// If result is null → version mismatch → 409 Conflict
```

---

## UI Components

| Component | Description |
|---|---|
| `ConflictErrorBanner` | Shown on `409` response: "This expense was already actioned. Refreshing queue..." |
| Auto-Refresh Trigger | On `409`, the approval queue automatically refreshes to show current state |

---

## Security Requirements

- Version field is read-only from the client's perspective — only the server increments it.
- Optimistic lock is implemented at the database level — not at the application cache level.
- No server-side locking (pessimistic lock) — use optimistic lock for scalability.

---

## Acceptance Criteria

- [ ] GIVEN two concurrent approve requests for the same expense with the same version, WHEN both reach the server, THEN one succeeds and the other returns `409 Conflict`.
- [ ] GIVEN a client sends a stale version number, WHEN the approve action is attempted, THEN `409 Conflict` is returned.
- [ ] GIVEN a `409` response, WHEN the UI receives it, THEN the approval queue auto-refreshes.
- [ ] GIVEN a missing `version` field in the request body, WHEN any approval action is called, THEN `422 Unprocessable Entity` is returned.
- [ ] GIVEN a successful approval action, WHEN committed, THEN the workflow `version` is incremented by 1.

---

## Definition of Done

- [ ] `version` field added to `workflows` schema (default: 0)
- [ ] `findOneAndUpdate` with `version` condition in workflow service
- [ ] `409 Conflict` returned when version mismatch
- [ ] `version` included in queue and detail API responses
- [ ] `version` required in all approval action request bodies (`422` if missing)
- [ ] `ConflictErrorBanner` UI component with auto-refresh
- [ ] Unit tests: concurrent success+conflict, stale version, missing version
