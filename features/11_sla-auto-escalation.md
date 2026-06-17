# Feature: SLA Auto-Escalation

## Feature ID
`F-11`

## Purpose
Automatically escalate expenses to a secondary approver when the primary approver fails to action within the configured SLA window. Notify both the employee and the escalation manager when escalation occurs.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-11-1 | Employee | As an employee, I want my expense to be automatically escalated if my manager doesn't respond in time. |
| US-11-2 | Manager | As a manager, I want to receive escalation alerts so I know when a colleague's unactioned expense is reassigned to me. |
| US-11-3 | Admin | As an admin, I want to configure the SLA window per approval level. |

---

## Functional Requirements

- SLA window is configurable per approval level (e.g., Level 1 Manager: 48 hours, Level 2 Finance: 72 hours).
- On workflow creation (F-10), compute `sla_deadline = created_at + sla_hours` and store on workflow record.
- A background job (cron) runs every 5 minutes to check for workflows where `sla_deadline < now` and status is still `pending_approval`.
- On SLA breach:
  - Identify the escalation approver (next manager up the hierarchy from the current approver, or a configured fallback).
  - Reassign current workflow level to the escalation approver.
  - Set `escalated: true` and `escalated_at` on the workflow.
  - Send escalation notifications to: the original approver, the escalation approver, and the employee.
- SLA timer resets when the expense is reassigned (after escalation) or when info is requested and resubmitted.
- Admin can configure: SLA hours per level, escalation target (next manager or designated backup).

---

## Validation Rules

| Config | Rule |
|---|---|
| SLA hours | Must be a positive integer. Default: 48 hours. |
| Escalation target | Must be an active user with `Manager` or `Finance` role. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No escalation approver found | Escalate to Admin; Admin notified via email and in-app. |
| Expense actioned just before SLA check fires | Job detects status is no longer `pending_approval`; skips escalation. |
| SLA breach during non-business hours | Escalation still triggers — system operates 24/7. |
| Escalation approver also inactive | Escalate further up the hierarchy; if no one found, escalate to Admin. |
| SLA breached multiple times (escalation approver also doesn't act) | Each subsequent SLA breach triggers another escalation up the chain. |

---

## Dependencies

| Dependency | Type |
|---|---|
| F-10 Approval Workflow Engine | Provides `workflow` records and SLA deadline field |
| `core-business-service` | Background SLA cron job |
| F-17 Notifications | Escalation notification to 3 parties |
| MongoDB | `workflows` collection — `sla_deadline`, `escalated`, `escalated_at` |
| `users` collection | Manager hierarchy for escalation target resolution |
| Admin Config | SLA hours and escalation target configuration |
| Job Scheduler (e.g., NestJS `@nestjs/schedule`) | Cron job every 5 minutes |

---

## API Requirements

No direct public endpoint. SLA check runs as a background cron job.

**Workflow record update on escalation:**
```json
{
  "escalated": true,
  "escalated_at": "ISO8601",
  "escalation_approver_id": "string",
  "original_approver_id": "string"
}
```

**Admin SLA Config endpoint (implicit):**
- `GET /api/v1/admin/sla-config` — fetch current SLA settings
- `PATCH /api/v1/admin/sla-config` — update SLA hours and escalation targets

---

## Database Impact

**Collection: `workflows`** — Additional fields:
| Field | Type | Notes |
|---|---|---|
| `sla_deadline` | Date | `created_at + sla_hours` |
| `escalated` | Boolean | Default: false |
| `escalated_at` | Date | Timestamp of escalation |
| `escalation_approver_id` | ObjectId | Ref: `users` |
| `original_approver_id` | ObjectId | Ref: `users` — preserved on escalation |
| `escalation_count` | Number | Increments on each escalation |

**Collection: `sla_config`:**
| Field | Type | Notes |
|---|---|---|
| `level` | Number | Approval level |
| `sla_hours` | Number | SLA window in hours |
| `escalation_role` | Enum | `next_manager\|fallback_admin` |
| `fallback_user_id` | ObjectId | Optional fixed fallback |

**Index:** `sla_deadline` (TTL or range query by cron job)

---

## UI Components

| Component | Description |
|---|---|
| `SlaDeadlineIndicator` | Shows remaining time in approval queue item (e.g., "12h remaining", "Overdue") |
| `EscalatedBadge` | Visual indicator on escalated expenses in queue and expense detail |
| `EscalationNotificationCard` | In-app notification card type for escalation alerts |
| `SlaConfigAdminPanel` | Admin UI to set SLA hours per level and escalation target |

---

## Security Requirements

- SLA cron job runs with a service account — not triggerable by end users.
- Escalation approver reassignment is logged in `audit_logs`.
- Admin-only access to SLA configuration endpoints.

---

## Acceptance Criteria

- [ ] GIVEN a workflow SLA deadline has passed, WHEN the cron job runs, THEN the expense is escalated to the secondary approver within 5 minutes of SLA expiry.
- [ ] GIVEN escalation fires, WHEN notifications are sent, THEN the employee, original approver, and escalation approver all receive notifications.
- [ ] GIVEN an expense is actioned just before the cron runs, WHEN the cron checks the workflow, THEN escalation is skipped.
- [ ] GIVEN no escalation approver exists in the hierarchy, WHEN escalation fires, THEN the Admin is notified.
- [ ] GIVEN a second SLA breach (escalation approver also misses deadline), WHEN the next cron runs, THEN another escalation up the chain is triggered.
- [ ] GIVEN an escalation event, WHEN committed, THEN an audit log entry is created.

---

## Definition of Done

- [ ] `sla_deadline` computed and stored on workflow creation
- [ ] Background cron job implemented (every 5 minutes) using `@nestjs/schedule`
- [ ] Escalation approver resolution from manager hierarchy
- [ ] Fallback to Admin if no escalation approver found
- [ ] `escalated`, `escalated_at`, `escalation_approver_id` updated on escalation
- [ ] Notification trigger for 3 parties (F-17)
- [ ] Admin SLA config endpoints
- [ ] `SlaDeadlineIndicator` and `EscalatedBadge` UI components
- [ ] Audit log on escalation
- [ ] Unit tests: SLA breach triggers escalation, no approver → Admin fallback, pre-actioned expense skipped
- [ ] Integration test: workflow created → SLA passes → escalation fires → notification sent
