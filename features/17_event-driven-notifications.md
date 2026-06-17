# Feature: Event-Driven Notifications

## Feature ID
`F-17`

## Purpose
Deliver real-time in-app and email notifications to the correct recipients on all defined expense lifecycle events. Ensure ≥ 99.5% delivery within 60 seconds of the triggering event. Eliminate duplicate notifications from the same event.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-17-1 | Employee | As an employee, I want to receive a notification when my expense is submitted, approved, or rejected. |
| US-17-2 | Manager | As a manager, I want to be notified when a new expense is assigned to me for approval. |
| US-17-3 | Employee | As an employee, I want to see unread notification count in the nav bar. |
| US-17-4 | Any User | As a user, I want to mark notifications as read so my badge count stays accurate. |

---

## Functional Requirements

**5 Defined Notification Event Types:**

| Event | Trigger | Recipients |
|---|---|---|
| `expense.submitted` | Employee submits expense | Employee (confirmation) + Assigned approver |
| `expense.approved` | Approver approves expense | Employee; next approver (if multi-level) |
| `expense.rejected` | Approver rejects expense | Employee |
| `expense.policy_flagged` | Policy violation detected on submission | Approver (flag alert) |
| `expense.sla_escalated` | SLA breach triggers escalation (F-11) | Employee + Original approver + Escalation approver |

- Channels: in-app (stored in `notifications` collection) + email (via Firebase FCM or SendGrid).
- In-app notification payload: `type`, `title`, `body`, `expense_id`, `link`, `read`, `created_at`.
- Email: templated, triggered asynchronously via `notification-service`.
- Unread count returned on `GET /api/v1/notifications`.
- User can mark individual notification as read (`PATCH /api/v1/notifications/:id/read`).
- De-duplication: same event + same recipient within 5 seconds → only one notification dispatched.

---

## Validation Rules

| Check | Rule |
|---|---|
| Recipient | Always resolved server-side from the event context — not passed by the event producer. |
| De-duplication | `notification_key = SHA-256(event_type + expense_id + recipient_id + unix_timestamp/5s bucket)` — checked in Redis before dispatch. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Duplicate event fires within 5 seconds | Redis de-duplication key found → second notification suppressed. |
| Email delivery failure | Retry up to 3 times with exponential backoff; log failure after 3rd attempt. |
| Recipient has no email address | In-app notification sent only; email skipped silently. |
| Recipient account deactivated | In-app notification suppressed; email suppressed; logged. |
| `GET /api/v1/notifications` called with empty inbox | `200 OK` with empty array and `unread_count: 0`. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `notification-service` | Owns notification creation and dispatch |
| `core-business-service` | Publishes expense lifecycle events |
| Message Queue (e.g., Redis Pub/Sub or BullMQ) | Decouples event production from notification dispatch |
| SendGrid / Firebase FCM | Email and push delivery |
| MongoDB | `notifications` collection — persistent in-app records |
| Redis | De-duplication key store (5-second TTL per key) |

---

## API Requirements

### `GET /api/v1/notifications`
**Access:** All authenticated roles
**Query Params:** `?read=true|false&page=1&limit=20`

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "notifications": [
      {
        "id": "string",
        "type": "expense.approved",
        "title": "Expense Approved",
        "body": "Your expense 'Client Lunch' has been approved by John Smith.",
        "expense_id": "string",
        "link": "/expenses/string",
        "read": false,
        "created_at": "ISO8601"
      }
    ],
    "unread_count": 3,
    "total": 12,
    "page": 1
  },
  "message": "Notifications fetched"
}
```

---

### `PATCH /api/v1/notifications/:id/read`
**Request:** No body required.

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {},
  "message": "Notification marked as read"
}
```

**Errors:** `404` notification not found | `403` not the notification's recipient

---

### `PATCH /api/v1/notifications/mark-all-read`
**Response 200 OK:**
```json
{
  "status": 200,
  "data": { "updated_count": 5 },
  "message": "All notifications marked as read"
}
```

---

## Database Impact

**Collection: `notifications`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `recipient_id` | ObjectId | Ref: `users` |
| `type` | Enum | `expense.submitted\|approved\|rejected\|policy_flagged\|sla_escalated` |
| `title` | String | |
| `body` | String | |
| `expense_id` | ObjectId | Ref: `expenses` |
| `link` | String | Frontend route |
| `read` | Boolean | Default: false |
| `email_sent` | Boolean | |
| `email_attempts` | Number | Retry count |
| `created_at` | Date | |

**Redis:** De-duplication key: `notif:dedup:<sha256_key>` — TTL: 5 seconds.

**Indexes:** `recipient_id`, `read`, `created_at`, `expense_id`

---

## UI Components

| Component | Description |
|---|---|
| `NotificationBell` | Nav bar icon with animated unread count badge |
| `NotificationDropdown` | Top-10 latest notifications panel on bell click |
| `NotificationListPage` | Full paginated notification inbox with read/unread filter |
| `NotificationCard` | Single item: icon (by type), title, body, timestamp, read indicator |
| `MarkAllReadButton` | Marks all as read with optimistic UI update |
| `NotificationDot` | Unread indicator dot on individual notification card |

---

## Security Requirements

- Notifications scoped to `recipient_id = authenticated_user_id` — user cannot read other users' notifications.
- `PATCH` to mark-as-read validates `recipient_id` ownership.
- Email content contains no sensitive financial data — only summary and link.
- Email links use short-lived signed tokens for unauthenticated deep-link access (optional, configurable).
- De-duplication key computed server-side.

---

## Acceptance Criteria

- [ ] GIVEN an employee submits an expense, WHEN the submission succeeds, THEN both the employee and the assigned approver receive in-app and email notifications within 60 seconds.
- [ ] GIVEN an approver approves an expense, WHEN the action fires, THEN the employee receives a notification within 60 seconds.
- [ ] GIVEN the same notification event fires twice within 5 seconds, WHEN the second fires, THEN only one notification is delivered (de-duplication active).
- [ ] GIVEN a user has 3 unread notifications, WHEN `GET /api/v1/notifications` is called, THEN `unread_count: 3` is returned.
- [ ] GIVEN a notification is marked as read, WHEN `GET /api/v1/notifications` is called again, THEN `unread_count` decrements by 1.
- [ ] GIVEN email delivery fails, WHEN 3 retries are exhausted, THEN the failure is logged and the in-app notification is still present.
- [ ] GIVEN a deactivated recipient, WHEN a notification event fires, THEN no notification is dispatched and the suppression is logged.

---

## Definition of Done

- [ ] `notification-service` implemented with event queue consumer
- [ ] All 5 event types produce correct in-app records and emails
- [ ] De-duplication via Redis (5-second window)
- [ ] `GET /api/v1/notifications` with pagination and unread count
- [ ] `PATCH /api/v1/notifications/:id/read`
- [ ] `PATCH /api/v1/notifications/mark-all-read`
- [ ] Email retry logic (3 attempts, exponential backoff)
- [ ] All 6 UI components
- [ ] Unit tests: all 5 event types, de-duplication, deactivated recipient, email retry
- [ ] Integration test: expense submission → notification received by both employee and approver within 60 seconds
