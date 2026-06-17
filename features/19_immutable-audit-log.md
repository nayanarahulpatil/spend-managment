# Feature: Immutable Audit Log

## Feature ID
`F-19`

## Purpose
Record every create, update, and delete action on expense and user entities as an immutable, timestamped audit log entry — capturing actor ID, action type, and before/after state. Ensure the log cannot be modified or deleted by any user. Support regulatory retention requirements (≥ 7 years, configurable).

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-19-1 | Auditor | As an auditor, I want to see a complete history of all changes to any expense record. |
| US-19-2 | Admin | As an admin, I want to verify who performed what action and when for compliance review. |
| US-19-3 | Finance | As a Finance user, I want to trace the full approval chain for any expense for audit purposes. |
| US-19-4 | Auditor | As an auditor, I need confirmation that log entries cannot be altered after creation. |

---

## Functional Requirements

- Audit log is written on every:
  - `expense`: create, update, status change (approval/rejection), delete (soft)
  - `user`: create, update (role/dept), deactivate
  - `policy_rule`: create, update, deactivate
  - `workflow_action`: approve, reject, request-info, escalate
- Each log entry contains: `entity_type`, `entity_id`, `actor_id`, `action`, `before_state`, `after_state`, `timestamp`, `ip_address`.
- Log entries are **append-only** — no UPDATE or DELETE operations permitted on `audit_logs` collection.
- MongoDB collection configured with a write-once constraint (application-level enforcement; DB role restriction).
- Audit logs stored for a minimum of 7 years (configurable per jurisdiction).
- Logs are queryable by: `entity_type`, `entity_id`, `actor_id`, `date range`, `action`.
- Audit log accessible by Admin and Auditor roles only.

---

## Validation Rules

| Check | Rule |
|---|---|
| Log entry creation | Synchronous — must succeed before the originating action response is returned. |
| `before_state` | Must be captured before the mutation is applied. |
| `after_state` | Must reflect the state after the mutation. |
| Log modification | Any attempt to UPDATE or DELETE an audit log entry returns `405 Method Not Allowed`. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Audit log write fails | Originating action also rolls back (atomic) — no silent log gaps. |
| Large `before_state` / `after_state` objects | Compressed (gzip) if > 16KB; full state preserved. |
| Audit log query for non-existent entity | `200 OK` with empty array — no `404`. |
| Attempt to DELETE audit log via API | `405 Method Not Allowed` — "Audit logs are immutable." |
| Attempt to UPDATE audit log via API | `405 Method Not Allowed` — "Audit logs are immutable." |
| Data retention period reached | Archival job moves old logs to cold storage; does not delete. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `core-business-service` | Writes audit log on all entity mutations |
| `reporting-service` | Reads audit log for audit reports (F-18) |
| MongoDB | `audit_logs` collection — append-only |
| Cloud Cold Storage | Archival of logs > 7 years (configurable) |
| F-03 RBAC | Admin + Auditor only for read access |

---

## API Requirements

### `GET /api/v1/audit/logs`
**Access:** Admin, Auditor
**Query Params:** `?entity=expense|user|policy_rule|workflow&entity_id=string&actor_id=string&action=string&date_from=ISO8601&date_to=ISO8601&page=1&limit=20`

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "logs": [
      {
        "id": "string",
        "entity_type": "expense",
        "entity_id": "string",
        "actor_id": "string",
        "actor_name": "string",
        "action": "approved",
        "before_state": {},
        "after_state": {},
        "timestamp": "ISO8601",
        "ip_address": "string"
      }
    ],
    "total": 120,
    "page": 1
  },
  "message": "Audit logs fetched"
}
```

**No POST / PATCH / DELETE endpoints exposed for `audit_logs`.**

---

## Database Impact

**Collection: `audit_logs`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `entity_type` | Enum | `expense\|user\|policy_rule\|workflow_action` |
| `entity_id` | ObjectId | Ref to the affected entity |
| `actor_id` | ObjectId | Ref: `users` — who performed the action |
| `actor_name` | String | Denormalized for query performance |
| `action` | String | `created\|updated\|deleted\|approved\|rejected\|escalated\|...` |
| `before_state` | Object | State before mutation (null on create) |
| `after_state` | Object | State after mutation (null on soft delete) |
| `timestamp` | Date | UTC timestamp — system-generated |
| `ip_address` | String | Client IP from request context |

**Immutability enforcement:**
- MongoDB user role: `audit_logs_writer` has `insert` only — no `update` or `delete`.
- Application service: no `updateOne` / `deleteOne` operations on this collection.
- API layer: no PUT/PATCH/DELETE routes registered for `/api/v1/audit/logs`.

**Indexes:** `entity_id`, `actor_id`, `entity_type`, `timestamp`, `action`

**Retention:** TTL index NOT used (logs must be retained). Archival cron job moves records older than configured retention period to cold storage.

---

## UI Components

| Component | Description |
|---|---|
| `AuditLogTable` | Paginated, filterable table: entity, actor, action, timestamp, before/after diff |
| `AuditLogFilters` | Filter bar: entity type, entity ID lookup, actor, action, date range |
| `BeforeAfterDiffViewer` | Side-by-side or unified diff of `before_state` vs `after_state` JSON |
| `AuditLogExportButton` | Triggers `POST /api/v1/reports/generate` with type: `audit` (F-18) |
| `ImmutabilityBadge` | Visual indicator: "Immutable — Read Only" on the audit log page header |

---

## Security Requirements

- MongoDB write role for `audit_logs` is `insert`-only — enforced at the DB user permission level.
- No application-layer code may call `updateOne`, `replaceOne`, or `deleteOne` on `audit_logs`.
- `before_state` and `after_state` may contain PII — access restricted to Admin + Auditor.
- Audit log entries are not paginated beyond 10,000 records per query — large exports use F-18 async report.
- `ip_address` captured from `X-Forwarded-For` header (behind API Gateway).
- Audit log read access itself is logged (meta-audit).

---

## Acceptance Criteria

- [ ] GIVEN an expense is created, WHEN the submission succeeds, THEN an audit log entry with `action: created`, `before_state: null`, and correct `after_state` is written.
- [ ] GIVEN an expense is approved, WHEN the action is committed, THEN an audit log entry with `action: approved`, `before_state` (old status), `after_state` (new status), `actor_id`, and `timestamp` is written.
- [ ] GIVEN an Admin attempts to call `DELETE /api/v1/audit/logs/:id`, THEN `405 Method Not Allowed` is returned.
- [ ] GIVEN any entity action fails (rollback), THEN no audit log entry is written for that action.
- [ ] GIVEN an Auditor queries audit logs for an expense, WHEN filtered by `entity_id`, THEN all create/update/status-change entries for that expense appear in chronological order.
- [ ] GIVEN an Employee role token, WHEN `GET /api/v1/audit/logs` is called, THEN `403 Forbidden` is returned.
- [ ] GIVEN 100% of entity mutations, THEN 100% are captured in the audit log (zero gaps).

---

## Definition of Done

- [ ] `audit_logs` collection created with insert-only MongoDB role
- [ ] Audit log writer service/decorator implemented — called on all entity mutations
- [ ] `GET /api/v1/audit/logs` with all filter params and pagination
- [ ] No UPDATE/DELETE routes or DB operations on `audit_logs`
- [ ] `405 Method Not Allowed` enforced at API and service layer
- [ ] `before_state` captured before mutation; `after_state` captured after
- [ ] Transaction: originating action rolls back if audit log write fails
- [ ] Archival cron job for retention policy
- [ ] All 5 UI components
- [ ] Unit tests: create/update/delete entity → log written, immutability block, RBAC, transaction rollback on log failure
- [ ] Integration test: full expense lifecycle → audit log completeness check
