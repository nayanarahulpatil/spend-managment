# Feature: Multi-Currency Support

## Feature ID
`F-08`

## Purpose
Allow employees to submit expenses in any supported currency. Automatically convert the submitted amount to the platform's base currency using live FX rates at submission time. Store both original and converted amounts for accurate financial reporting.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-08-1 | Employee | As an employee on a business trip, I want to submit expenses in the local currency so I don't have to manually convert. |
| US-08-2 | Finance | As a Finance manager, I want all expenses normalized to the base currency so reports are consistent. |
| US-08-3 | Admin | As an admin, I want to configure the platform base currency for the organization. |

---

## Functional Requirements

- Employee selects currency from a list of supported ISO 4217 currencies during expense submission.
- Platform has a configurable `base_currency` (e.g., `USD`).
- On expense submission, if `currency` ≠ `base_currency`, call FX rate API to fetch the live exchange rate.
- Compute `converted_amount = amount × exchange_rate`.
- Store: `amount` (original), `currency` (original), `converted_amount` (base), `base_currency`, `exchange_rate`, `rate_fetched_at`.
- FX rates fetched from a configured third-party provider (e.g., Open Exchange Rates).
- FX rates cached in Redis with a TTL (e.g., 15 minutes) to reduce third-party API calls.
- If FX rate fetch fails → `503 Service Unavailable` — "Currency conversion service unavailable. Try again later."
- All financial reports use `converted_amount` for aggregation.

---

## Validation Rules

| Field | Rule |
|---|---|
| `currency` | Required. Must be a valid ISO 4217 code from the platform's supported currency list. |
| `amount` | Positive number. Max 2 decimal places. |
| Unsupported currency | `422 Unprocessable Entity` — "Currency not supported." |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Expense submitted in base currency | No FX call needed; `converted_amount = amount`, `exchange_rate = 1`. |
| FX rate API unavailable | `503 Service Unavailable` — expense submission blocked; retry advised. |
| FX rate API returns stale/cached rate | Use cached rate from Redis; log `rate_source: cache`. |
| FX rate API rate limit hit | Serve from cache if available; else `503`. |
| Employee submits 0.00 amount | `422` — "Amount must be greater than zero." |
| Currency code not in supported list | `422` — "Currency not supported." |

---

## Dependencies

| Dependency | Type |
|---|---|
| F-05 Expense Submission | Triggers FX conversion at submission |
| Third-Party FX API (e.g., Open Exchange Rates) | Live exchange rate source |
| Redis | FX rate cache (TTL: 15 min) |
| `core-business-service` | Currency conversion logic |
| MongoDB | Stores `converted_amount`, `exchange_rate`, `rate_fetched_at` on expense |
| Admin Config | Base currency setting |

---

## API Requirements

No standalone endpoint. Logic embedded in `POST /api/v1/expenses`.

**Expense record response includes:**
```json
{
  "status": 201,
  "data": {
    "expense_id": "string",
    "amount": 150.00,
    "currency": "EUR",
    "converted_amount": 162.75,
    "base_currency": "USD",
    "exchange_rate": 1.085,
    "rate_fetched_at": "2026-06-15T10:00:00Z",
    "policy_violation": false,
    "violation_reason": null
  },
  "message": "Expense submitted"
}
```

**FX service down error:**
```json
{
  "status": 503,
  "data": {},
  "message": "Currency conversion service unavailable. Try again later."
}
```

---

## Database Impact

**Collection: `expenses`** — Additional fields:
| Field | Type | Notes |
|---|---|---|
| `currency` | String | ISO 4217 original currency |
| `converted_amount` | Number | In platform base currency |
| `base_currency` | String | Platform base currency (e.g., `USD`) |
| `exchange_rate` | Number | Rate used at conversion |
| `rate_fetched_at` | Date | Timestamp of rate fetch |
| `rate_source` | Enum | `live\|cache` |

**Collection: `fx_rate_cache`** (optional — or stored only in Redis):
| Field | Notes |
|---|---|
| `from_currency` | |
| `to_currency` | |
| `rate` | |
| `fetched_at` | |

---

## UI Components

| Component | Description |
|---|---|
| `CurrencySelector` | Searchable dropdown with ISO 4217 currency list and flag icons |
| `ConvertedAmountPreview` | Real-time preview of converted amount in base currency as user types (uses cached rate) |
| `ExchangeRateTooltip` | Shows `1 EUR = 1.085 USD as of [time]` on hover |
| `FxUnavailableError` | Inline error if FX service is down during submission |

---

## Security Requirements

- Third-party FX API key stored in environment variable — never hardcoded.
- FX API key not exposed in any client-side response.
- FX rate used for conversion is stored immutably on the expense record — cannot be altered post-submission.
- Redis cache key format: `fx:<from>:<to>` with TTL of 15 minutes.

---

## Acceptance Criteria

- [ ] GIVEN an expense submitted in `EUR` when base currency is `USD`, WHEN saved, THEN `converted_amount`, `exchange_rate`, and `rate_fetched_at` are stored on the record.
- [ ] GIVEN an expense submitted in the base currency, WHEN saved, THEN `exchange_rate = 1` and `converted_amount = amount`.
- [ ] GIVEN the FX rate is cached in Redis, WHEN a subsequent expense in the same currency is submitted within TTL, THEN the FX API is NOT called — the cached rate is used.
- [ ] GIVEN the FX rate API is unavailable and no cache exists, WHEN an expense in a non-base currency is submitted, THEN `503` is returned.
- [ ] GIVEN an unsupported currency code, WHEN submitted, THEN `422 Unprocessable Entity` is returned.

---

## Definition of Done

- [ ] FX rate fetch from third-party API integrated
- [ ] Redis caching of FX rates with 15-min TTL
- [ ] `converted_amount`, `exchange_rate`, `rate_fetched_at`, `rate_source` stored on expense
- [ ] `503` response on FX service failure
- [ ] `CurrencySelector` and `ConvertedAmountPreview` UI components
- [ ] Admin config for `base_currency`
- [ ] Unit tests: same currency, FX conversion, cache hit, API unavailable, unsupported currency
