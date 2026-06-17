# Feature: Role-Based Access Control (RBAC)

## Feature ID
`F-03`

## Purpose
Enforce role-based access control across all protected API endpoints via the API Gateway middleware. Ensure users can only access resources permitted by their assigned role. Prevent privilege escalation and unauthorized data access.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-03-1 | Employee | As an employee, I should only see and act on my own expense data. |
| US-03-2 | Manager | As a manager, I want access to my team's expenses without seeing other departments' data. |
| US-03-3 | Finance | As a Finance user, I want exclusive access to bulk approval and financial reports. |
| US-03-4 | Admin | As an admin, I want to manage all users and system configurations. |
| US-03-5 | Auditor | As an auditor, I want read-only access to all data for compliance review. |

---

## Functional Requirements

- All protected endpoints require a valid `Authorization: Bearer <access_token>` header.
- API Gateway decodes JWT, extracts `role`, and checks against the endpoint's permitted role list.
- Endpoints return `403 Forbidden` if the user's role is not in the allowed list.
- Endpoints return `401 Unauthorized` if the token is missing, expired, or malformed.
- RBAC is enforced at the API Gateway layer — not duplicated inside each service.
- Data-level RBAC (e.g., employee sees only own expenses) enforced in the service/repository layer.

**Role Permission Matrix:**

| Endpoint Group | Employee | Manager | Finance | Admin | Auditor |
|---|---|---|---|---|---|
| Auth endpoints | ✅ | ✅ | ✅ | ✅ | ✅ |
| Own expenses (CRUD) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Team expenses (read) | ❌ | ✅ | ✅ | ✅ | ✅ |
| Approval queue | ❌ | ✅ | ✅ | ✅ | ❌ |
| Bulk approval | ❌ | ❌ | ✅ | ✅ | ❌ |
| User management | ❌ | ❌ | ❌ | ✅ | ❌ |
| Reports | ❌ | ❌ | ✅ | ✅ | ✅ |
| Audit logs | ❌ | ❌ | ❌ | ✅ | ✅ |
| AI endpoints | ✅ | ✅ | ✅ | ✅ | ❌ |
| Notifications | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## Validation Rules

| Check | Rule |
|---|---|
| Token presence | `Authorization` header required on all protected routes |
| Token validity | Must be valid JWT, not expired, not blacklisted |
| Role claim | `role` field in JWT payload must match a defined system role |
| Resource ownership | Service layer validates `user_id` in record matches authenticated user (for own-data routes) |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Missing `Authorization` header | `401 Unauthorized` — "Authentication token required." |
| Expired access token | `401 Unauthorized` — "Token expired." Client triggers refresh flow. |
| Malformed JWT | `401 Unauthorized` — "Invalid token format." |
| Valid token but insufficient role | `403 Forbidden` — "Insufficient permissions." |
| Employee accessing another employee's expense | `403 Forbidden` at service layer — resource ownership check fails. |
| Role changed since token issued | Token still valid until expiry; new permissions apply on next login. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `api-gateway` | Hosts RBAC middleware; validates JWT and checks role on every protected request |
| `auth-service` | Issues JWT with `role` claim |
| Redis | Token blacklist check on each request |
| All downstream services | Implement data-level ownership checks |

---

## API Requirements

No dedicated endpoint. RBAC is middleware applied globally.

**Middleware behavior on every protected request:**
1. Extract `Authorization: Bearer <token>` header.
2. Verify JWT signature and expiry.
3. Check token hash against Redis blacklist.
4. Extract `role` from JWT payload.
5. Compare `role` against endpoint's `@Roles(...)` decorator/config.
6. Pass through to service on success; return `401` or `403` on failure.

---

## Database Impact

No direct database writes. Role stored in MongoDB `users` collection and embedded in JWT at login time.

---

## UI Components

| Component | Description |
|---|---|
| `AuthGuard` (React) | HOC/hook — checks role from Redux auth state; redirects unauthorized users |
| `RoleConditionalRender` | Renders UI elements conditionally based on user role |
| `UnauthorizedPage` | Displayed when user navigates to a role-restricted route |
| `ForbiddenBanner` | Inline error for API `403` responses |

---

## Security Requirements

- JWT verified using RS256 public key at API Gateway level.
- Role embedded in JWT at issuance — not fetched from DB on every request (for performance).
- Blacklist check performed on every authenticated request to catch force-logged-out sessions.
- RBAC configuration (role-to-endpoint mapping) stored in code/config — not in database (prevents runtime tampering).
- Principle of least privilege: every role defaults to no access; permissions explicitly granted.

---

## Acceptance Criteria

- [ ] GIVEN a user with `Employee` role, WHEN they call `GET /api/v1/workflows/queue`, THEN `403 Forbidden` is returned.
- [ ] GIVEN a request with no `Authorization` header, WHEN any protected endpoint is called, THEN `401 Unauthorized` is returned.
- [ ] GIVEN a valid `Finance` role token, WHEN they call `POST /api/v1/reports/generate`, THEN `200 OK` is returned.
- [ ] GIVEN an employee's JWT, WHEN they call `GET /api/v1/expenses/:id` for another employee's expense, THEN `403 Forbidden` is returned.
- [ ] GIVEN a blacklisted token (post-logout), WHEN any protected request is made, THEN `401 Unauthorized` is returned.
- [ ] GIVEN 100% of protected endpoints, THEN all enforce RBAC — verified by integration test suite.

---

## Definition of Done

- [ ] RBAC middleware implemented in `api-gateway`
- [ ] JWT RS256 verification in middleware
- [ ] Redis blacklist check on every request
- [ ] Role permission matrix implemented as decorator/config
- [ ] Data-level ownership check in `expense` service
- [ ] `AuthGuard` and `RoleConditionalRender` implemented on frontend
- [ ] Unit tests: valid role pass, insufficient role block, missing token, blacklisted token
- [ ] Integration tests: 100% endpoint coverage for RBAC rules
