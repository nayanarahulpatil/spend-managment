# Feature: Token Refresh & Logout

## Feature ID
`F-02`

## Purpose
Enable seamless, silent session renewal via refresh tokens without re-authentication. Provide secure server-side token invalidation on logout to prevent token reuse attacks.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-02-1 | Any User | As a user, I want my session to silently renew so I don't lose work due to token expiry. |
| US-02-2 | Any User | As a user, I want my session fully terminated on logout so no one can reuse my token. |
| US-02-3 | Admin | As an admin, I want to be able to force-logout any user's active sessions for security purposes. |

---

## Functional Requirements

- `POST /api/v1/auth/refresh` accepts a valid, non-expired refresh token and issues a new `access_token`.
- Refresh token is validated server-side (exists in Redis, not blacklisted, not expired).
- On successful refresh: issue new `access_token`; optionally rotate refresh token (sliding window).
- `POST /api/v1/auth/logout` accepts refresh token, blacklists it in Redis, returns `200 OK`.
- After logout, the blacklisted refresh token cannot be used to refresh again.
- Expired or blacklisted refresh tokens return `401 Unauthorized`.
- Admin force-logout deletes all refresh tokens associated with a given `user_id`.

---

## Validation Rules

| Field | Rule |
|---|---|
| `refresh_token` (refresh) | Required. Must be a non-expired, non-blacklisted token matching a stored hash. |
| `refresh_token` (logout) | Required. Must exist in the request body. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Refresh token expired | `401 Unauthorized` — "Session expired. Please log in again." |
| Refresh token already blacklisted (post-logout reuse) | `401 Unauthorized` — "Token revoked." |
| Refresh token not found in Redis | `401 Unauthorized` — "Invalid token." |
| Concurrent refresh calls with same token | First succeeds; second fails if token rotation is enabled (old token invalidated). |
| Force-logout by admin | All refresh tokens for `user_id` removed from Redis; next API call returns `401`. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `auth-service` | Owns refresh and logout logic |
| Redis | Stores refresh token hashes with TTL; blacklist set |
| `api-gateway` | Routes request; no auth middleware on refresh endpoint |
| MongoDB | User record validation (is_active, role) |

---

## API Requirements

### `POST /api/v1/auth/refresh`

**Request:**
```json
{ "refresh_token": "string" }
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": { "access_token": "string" },
  "message": "Token refreshed"
}
```

**Errors:** `401` — expired / invalid / blacklisted

---

### `POST /api/v1/auth/logout`

**Request:**
```json
{ "refresh_token": "string" }
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {},
  "message": "Logged out successfully"
}
```

---

## Database Impact

**Redis:**
| Key Pattern | Value | TTL |
|---|---|---|
| `refresh:<user_id>:<token_hash>` | `user_id` | 7 days |
| `blacklist:<token_hash>` | `1` | Until original TTL expires |

No MongoDB writes on refresh or logout. Audit log written on logout.

---

## UI Components

| Component | Description |
|---|---|
| `TokenRefreshInterceptor` | Axios interceptor — auto-calls refresh on `401`, retries original request |
| `LogoutButton` | Calls logout endpoint; clears local token state; redirects to login |
| `SessionExpiredModal` | Shown if refresh token is expired — prompts re-login |

---

## Security Requirements

- Refresh tokens stored as SHA-256 hash in Redis — raw token never persisted.
- Token rotation on refresh: old refresh token invalidated on each use (sliding window).
- Logout blacklists refresh token immediately; prior access tokens expire naturally within TTL.
- Refresh endpoint rate-limited: max 5 requests/minute per IP.
- Logout endpoint requires valid `access_token` in `Authorization` header.

---

## Acceptance Criteria

- [ ] GIVEN a valid, non-expired refresh token, WHEN `POST /api/v1/auth/refresh` is called, THEN a new `access_token` is returned with `200 OK`.
- [ ] GIVEN an expired refresh token, WHEN refresh is called, THEN `401` is returned.
- [ ] GIVEN a valid refresh token, WHEN `POST /api/v1/auth/logout` is called, THEN the token is blacklisted and `200 OK` returned.
- [ ] GIVEN a blacklisted refresh token, WHEN refresh is called, THEN `401 — Token revoked` is returned.
- [ ] GIVEN token rotation is enabled, WHEN refresh is called twice with the same token, THEN the second call returns `401`.

---

## Definition of Done

- [ ] `POST /api/v1/auth/refresh` implemented with Redis validation
- [ ] `POST /api/v1/auth/logout` implemented with Redis blacklisting
- [ ] Token rotation logic implemented
- [ ] Refresh token stored as hash in Redis
- [ ] Admin force-logout endpoint implemented
- [ ] Audit log on logout
- [ ] Unit tests: valid refresh, expired token, blacklisted token, logout, double-use after rotation
