# Feature: Authentication — Login & MFA

## Feature ID
`F-01`

## Purpose
Provide secure, enterprise-grade user authentication via email/password with optional Multi-Factor Authentication (MFA). Issue JWT access and refresh tokens upon successful authentication. Serve as the entry point for all platform roles.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-01-1 | Employee | As an employee, I want to log in with my email and password so I can access my expense dashboard. |
| US-01-2 | Admin | As an admin, I want MFA enforced for all privileged roles so that unauthorized access is prevented. |
| US-01-3 | Any User | As a user, I want to receive a clear error message if my credentials are incorrect so I know what action to take. |
| US-01-4 | Any User | As a user, I want my account locked after repeated failed attempts to prevent brute-force attacks. |

---

## Functional Requirements

- System accepts `email` + `password`; optionally `mfa_token`.
- On valid credentials: issue `access_token` (short TTL, e.g. 15 min) and `refresh_token` (long TTL, e.g. 7 days).
- Response includes the authenticated user's `role`.
- MFA is mandatory for roles: `Admin`, `Finance`, `Auditor`.
- MFA is optional (configurable) for `Employee` and `Manager`.
- Account locked after 5 consecutive failed login attempts; `423 Locked` returned.
- Locked accounts require Admin unlock or time-based auto-unlock (configurable).
- All login events (success + failure) written to audit log.

---

## Validation Rules

| Field | Rule |
|---|---|
| `email` | Required. Valid email format. Max 255 chars. |
| `password` | Required. Min 8 chars. Not returned in any response. |
| `mfa_token` | Required if MFA enabled for role. 6-digit numeric TOTP. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Invalid credentials | `401 Unauthorized` — "Invalid email or password." |
| Account locked (≥5 failures) | `423 Locked` — "Account locked. Contact admin." |
| MFA required but not provided | `422 Unprocessable Entity` — "MFA token required." |
| MFA token expired/incorrect | `401 Unauthorized` — "Invalid or expired MFA token." |
| Expired access token on next request | `401 Unauthorized` — trigger client-side refresh flow. |
| Account deactivated | `401 Unauthorized` — "Account is inactive." |

---

## Dependencies

| Dependency | Type |
|---|---|
| `auth-service` | Backend service — owns login logic |
| `api-gateway` | Routes login request; no auth middleware applied to this endpoint |
| Redis | Token blacklist + failed attempt counter + lock state |
| MongoDB | User record lookup (email, hashed password, role, MFA secret) |
| TOTP library (e.g., `otplib`) | MFA token verification |

---

## API Requirements

### `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "mfa_token": "string|optional"
}
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "access_token": "string",
    "refresh_token": "string",
    "role": "string"
  },
  "message": "Login successful"
}
```

**Error Responses:**
- `401` — Invalid credentials / inactive account / invalid MFA
- `422` — MFA token missing when required
- `423` — Account locked

---

## Database Impact

**Collection: `users`**
| Field | Type | Notes |
|---|---|---|
| `email` | String | Indexed, unique |
| `password_hash` | String | bcrypt hashed |
| `role` | Enum | `employee\|manager\|finance\|admin\|auditor` |
| `mfa_enabled` | Boolean | Default: false |
| `mfa_secret` | String | Encrypted at rest |
| `failed_login_attempts` | Number | Reset on success |
| `locked_at` | Date | Null if not locked |
| `is_active` | Boolean | Default: true |

**Collection: `audit_logs`** — Login event written on every attempt.

---

## UI Components

| Component | Description |
|---|---|
| `LoginForm` | Email + password fields, submit button, error state |
| `MfaInputStep` | 6-digit OTP input shown after valid password when MFA required |
| `LoginError` | Inline error banner for invalid credentials / lock state |
| `LoadingOverlay` | Shown during authentication API call |

---

## Security Requirements

- Passwords hashed with `bcrypt` (min 10 rounds). Never stored in plaintext.
- `access_token` — JWT signed with RS256, TTL 15 minutes.
- `refresh_token` — opaque token, stored hashed in Redis, TTL 7 days.
- MFA secret encrypted at rest using AES-256.
- Rate limiting on login endpoint: max 10 requests/minute per IP.
- Login endpoint excluded from general auth middleware.
- All tokens transmitted via HTTPS only.

---

## Acceptance Criteria

- [ ] GIVEN valid credentials and no MFA required, WHEN `POST /api/v1/auth/login` is called, THEN `200 OK` is returned with `access_token`, `refresh_token`, and `role` within 500ms.
- [ ] GIVEN MFA is enabled for the user's role, WHEN login is called without `mfa_token`, THEN `422` is returned.
- [ ] GIVEN invalid password, WHEN login is called 5 times, THEN the 5th attempt returns `423 Locked`.
- [ ] GIVEN a locked account, WHEN valid credentials are submitted, THEN `423 Locked` is still returned until unlocked by Admin.
- [ ] GIVEN a deactivated account, WHEN login is attempted, THEN `401` is returned.
- [ ] GIVEN a valid login, WHEN the event fires, THEN an audit log entry is created with actor email, timestamp, and outcome.

---

## Definition of Done

- [ ] `POST /api/v1/auth/login` implemented in `auth-service`
- [ ] bcrypt password comparison
- [ ] JWT issued with correct claims (sub, role, iat, exp)
- [ ] MFA TOTP verification working
- [ ] Brute-force lockout (5 attempts → lock)
- [ ] Redis failed-attempt counter implemented
- [ ] Audit log written on login success and failure
- [ ] Unit tests: valid login, invalid password, MFA required, account locked, inactive account
- [ ] Integration test: full login flow with MFA
