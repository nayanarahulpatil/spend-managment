# Feature: User Management

## Feature ID
`F-04`

## Purpose
Enable Admin users to create, update, deactivate, and list employee profiles. Support role assignment, department and cost-center mapping, and manager hierarchy linkage required for workflow routing.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-04-1 | Admin | As an admin, I want to create new employee accounts so they can access the platform. |
| US-04-2 | Admin | As an admin, I want to assign roles to users so their permissions are correctly scoped. |
| US-04-3 | Admin | As an admin, I want to deactivate an employee account without deleting it so their expense history is preserved. |
| US-04-4 | Admin | As an admin, I want to update a user's department or manager so the approval chain stays accurate. |
| US-04-5 | Admin | As an admin, I want to list all users with filters so I can audit and manage the workforce. |

---

## Functional Requirements

- Admin can create a user: name, email, role, department, manager assignment.
- System sends a welcome email with a temporary password or invite link on user creation.
- Admin can update role, department, and manager of existing users.
- Admin can deactivate (soft-delete) a user — account becomes inactive, login returns `401`.
- Admin can list all users with optional filters: role, department, status.
- Users are paginated in list responses (default page size: 20).
- Duplicate email check on creation — system rejects with `409 Conflict`.
- Manager assignment validated: `manager_id` must reference an existing active user with `Manager` or `Finance` role.

---

## Validation Rules

| Field | Rule |
|---|---|
| `name` | Required. Min 2, max 100 chars. |
| `email` | Required. Valid format. Unique in system. Max 255 chars. |
| `role` | Required. One of: `employee`, `manager`, `finance`, `admin`, `auditor`. |
| `department_id` | Required. Must reference a valid existing department. |
| `manager_id` | Optional on create. Must be an active user with `manager` or `finance` role. |
| `role` (update) | Optional. Changing role takes effect on next login (new JWT issued). |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Duplicate email on create | `409 Conflict` — "Email already registered." |
| Invalid `department_id` | `422 Unprocessable Entity` — "Invalid department." |
| Invalid `manager_id` (non-manager role) | `422 Unprocessable Entity` — "Manager must have Manager or Finance role." |
| Deactivate already-inactive user | `409 Conflict` — "User is already inactive." |
| Deactivated user tries to log in | `401 Unauthorized` — "Account is inactive." |
| Update role of currently logged-in admin | Allowed; takes effect on next login. |
| List with no users matching filters | `200 OK` with empty `data` array and `total: 0`. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `auth-service` / `core-business-service` | User CRUD logic |
| `api-gateway` | RBAC: Admin-only access |
| MongoDB | `users`, `departments`, `cost_centers` collections |
| `notification-service` | Welcome email on user creation |
| `audit_logs` | All user create/update/deactivate actions logged |

---

## API Requirements

### `GET /api/v1/users`
**Query Params:** `?role=string&department_id=string&status=active|inactive&page=1&limit=20`

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "users": [{ "id": "string", "name": "string", "role": "string", "department": "string", "is_active": true }],
    "total": 0,
    "page": 1
  },
  "message": "Users fetched"
}
```

---

### `POST /api/v1/users`
**Request:**
```json
{
  "name": "string",
  "email": "string",
  "role": "string",
  "department_id": "string",
  "manager_id": "string|optional"
}
```

**Response 201 Created:**
```json
{
  "status": 201,
  "data": { "id": "string" },
  "message": "User created"
}
```

**Errors:** `409` duplicate email | `422` invalid department or manager

---

### `PATCH /api/v1/users/:id`
**Request:**
```json
{
  "role": "string|optional",
  "department_id": "string|optional",
  "manager_id": "string|optional",
  "is_active": "boolean|optional"
}
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {},
  "message": "User updated"
}
```

**Errors:** `404` user not found | `422` invalid field values

---

## Database Impact

**Collection: `users`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | Primary key |
| `name` | String | |
| `email` | String | Unique index |
| `password_hash` | String | Set on creation |
| `role` | Enum | `employee\|manager\|finance\|admin\|auditor` |
| `department_id` | ObjectId | Ref: `departments` |
| `manager_id` | ObjectId | Ref: `users` (nullable) |
| `is_active` | Boolean | Default: true |
| `mfa_enabled` | Boolean | Default: false |
| `mfa_secret` | String | Encrypted |
| `created_at` | Date | |
| `updated_at` | Date | |

**Collection: `departments`** — Predefined. Admin-managed separately.

**Indexes:** `email` (unique), `department_id`, `role`, `is_active`

---

## UI Components

| Component | Description |
|---|---|
| `UserListTable` | Paginated table with role/dept/status filters and search |
| `CreateUserModal` | Form: name, email, role dropdown, department dropdown, manager autocomplete |
| `EditUserDrawer` | Side drawer to update role, department, manager, active status |
| `DeactivateConfirmDialog` | Confirmation before deactivation with warning about login impact |
| `UserStatusBadge` | Active / Inactive visual indicator |

---

## Security Requirements

- Endpoint accessible by `Admin` role only (`403` for all others).
- Password set as bcrypt hash on creation; raw password never stored.
- Welcome email with temporary password uses one-time link (expires in 24h).
- PII fields (`name`, `email`) masked in system logs.
- All create/update/deactivate actions written to `audit_logs` with `actor_id`, `action`, `before`, `after` state.

---

## Acceptance Criteria

- [ ] GIVEN a valid admin token, WHEN `POST /api/v1/users` is called with a duplicate email, THEN `409 Conflict` is returned.
- [ ] GIVEN a valid payload, WHEN a user is created, THEN the user is saved with the correct role and department, and a welcome email is sent.
- [ ] GIVEN an Admin deactivates a user, WHEN the deactivated user attempts login, THEN `401 Unauthorized` is returned.
- [ ] GIVEN an invalid `department_id`, WHEN user creation is attempted, THEN `422 Unprocessable Entity` is returned.
- [ ] GIVEN any user create/update/deactivate action, WHEN committed, THEN an audit log entry is created.
- [ ] GIVEN an Employee role token, WHEN `GET /api/v1/users` is called, THEN `403 Forbidden` is returned.

---

## Definition of Done

- [ ] `GET /api/v1/users` with filters and pagination implemented
- [ ] `POST /api/v1/users` with duplicate check and welcome email
- [ ] `PATCH /api/v1/users/:id` with role/dept/manager/active updates
- [ ] Soft-delete (deactivation) logic
- [ ] Audit log on all mutations
- [ ] MongoDB indexes on `email`, `role`, `department_id`, `is_active`
- [ ] Unit tests: create valid, duplicate email, invalid dept, deactivate, RBAC block
- [ ] Integration test: create → login → deactivate → login rejected
