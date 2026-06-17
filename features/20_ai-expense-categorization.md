# Feature: AI Expense Categorization

## Feature ID
`F-20`

## Purpose
Automatically suggest the most appropriate expense category based on the submitted description, amount, and vendor name using an AI model. Return a confidence score so employees and the UI can decide whether to auto-apply or prompt manual review.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-20-1 | Employee | As an employee, I want the system to suggest an expense category based on my receipt so I don't have to look it up. |
| US-20-2 | Employee | As an employee, I want to see a confidence level for the AI suggestion so I know when to verify manually. |
| US-20-3 | Finance | As a Finance user, I want AI-suggested categories to be accurate so manual corrections are minimized. |

---

## Functional Requirements

- `POST /api/v1/ai/categorize` accepts `description`, `amount`, and `vendor`.
- Returns a `suggested_category` (must map to a valid category in the `categories` collection) and a `confidence` score (0.0–1.0).
- If `confidence < 0.7` → UI does not auto-apply the suggestion; employee prompted to select manually.
- If `confidence ≥ 0.85` → UI auto-applies the suggestion in the expense form (configurable threshold).
- AI model: OpenAI API (GPT-4 class) + MongoDB Atlas Vector Search for vendor-to-category mapping.
- Vector Search: vendor name embedded and matched against a pre-built vendor → category index.
- Fallback: if AI service is unavailable → return `503 Service Unavailable` with `suggested_category: null`.
- AI call is optional — employee can skip categorization and select manually.
- Accepted/rejected suggestions tracked for model improvement (feedback loop).

---

## Validation Rules

| Field | Rule |
|---|---|
| `description` | Required. Min 3, max 500 chars. |
| `amount` | Optional. Positive number. |
| `vendor` | Optional. Max 200 chars. |
| `suggested_category` in response | Must be a valid `category_id` from the active categories list. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Unknown vendor / no match | Returns best-effort suggestion with `confidence < 0.7`; employee prompted to select. |
| AI service unavailable | `503 Service Unavailable` — `suggested_category: null`, `confidence: null`. |
| AI returns a category not in active categories list | System filters response — invalid suggestion discarded; `confidence: 0` returned. |
| Description is too generic (e.g., "misc") | Low confidence returned; UI shows manual selection prompt. |
| Employee ignores suggestion and picks different category | Tracked as rejected suggestion; used for feedback loop training. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `ai-service` | Hosts categorization endpoint |
| OpenAI API | LLM for text-based category inference |
| MongoDB Atlas Vector Search | Vendor → category embedding index |
| `categories` collection | Validates returned category exists and is active |
| F-06 Receipt Upload & OCR | OCR output (`vendor`, `amount`) fed as input to categorization |
| F-05 Expense Submission | Calls categorization optionally before form submission |

---

## API Requirements

### `POST /api/v1/ai/categorize`
**Access:** Employee, Manager, Finance, Admin

**Request:**
```json
{
  "description": "Business dinner with client",
  "amount": 185.00,
  "vendor": "Nobu Restaurant"
}
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "suggested_category": "Meals & Entertainment",
    "suggested_category_id": "string",
    "confidence": 0.92,
    "method": "vector_search|llm|hybrid"
  },
  "message": "Category suggested"
}
```

**Response (AI unavailable) 503:**
```json
{
  "status": 503,
  "data": { "suggested_category": null, "confidence": null },
  "message": "AI categorization service unavailable"
}
```

---

### `POST /api/v1/ai/categorize/feedback`
**Purpose:** Track whether suggestion was accepted or rejected.

**Request:**
```json
{
  "expense_id": "string",
  "suggested_category_id": "string",
  "accepted": false,
  "final_category_id": "string"
}
```

**Response 200 OK:** `{ "status": 200, "data": {}, "message": "Feedback recorded" }`

---

## Database Impact

**Collection: `ai_categorization_feedback`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `expense_id` | ObjectId | |
| `employee_id` | ObjectId | |
| `suggested_category_id` | ObjectId | |
| `accepted` | Boolean | |
| `final_category_id` | ObjectId | Category actually chosen |
| `confidence` | Number | Score at time of suggestion |
| `created_at` | Date | |

**MongoDB Atlas Vector Search Index:**
- Collection: `vendor_embeddings`
- Fields: `vendor_name` (embedded via OpenAI `text-embedding-ada-002`), `category_id`, `category_name`

---

## UI Components

| Component | Description |
|---|---|
| `AiCategoryBadge` | Shows "AI Suggested: [Category]" with confidence bar in the expense form |
| `CategoryAutoFill` | Auto-applies suggestion to dropdown when confidence ≥ 0.85 |
| `ManualCategoryPrompt` | Shown when confidence < 0.7 — "AI couldn't determine category. Please select." |
| `ConfidenceMeter` | Visual bar: green (high), amber (medium), red (low) |
| `FeedbackTrigger` | Invisible tracker: fires `POST /api/v1/ai/categorize/feedback` when employee submits expense |

---

## Security Requirements

- OpenAI API key stored in environment variable — never in code or client response.
- AI endpoint accessible to authenticated users only.
- `suggested_category_id` validated against active categories before returning — no arbitrary category IDs injected.
- Feedback endpoint scoped to the authenticated employee's own expenses.

---

## Acceptance Criteria

- [ ] GIVEN a known vendor (e.g., "Nobu Restaurant"), WHEN `POST /api/v1/ai/categorize` is called, THEN a category suggestion with `confidence ≥ 0.85` is returned within 1 second.
- [ ] GIVEN `confidence ≥ 0.85`, WHEN the suggestion is returned, THEN the UI auto-fills the category field.
- [ ] GIVEN `confidence < 0.7`, WHEN the suggestion is returned, THEN the UI shows a manual selection prompt.
- [ ] GIVEN the AI service is unavailable, WHEN categorization is called, THEN `503` is returned with `suggested_category: null` and the form remains fully functional for manual input.
- [ ] GIVEN the AI returns a category not in the active categories list, WHEN the response is processed, THEN the invalid category is discarded and `confidence: 0` is returned.
- [ ] GIVEN an employee accepts or rejects a suggestion, WHEN the expense is submitted, THEN a feedback record is created.

---

## Definition of Done

- [ ] `POST /api/v1/ai/categorize` implemented in `ai-service`
- [ ] OpenAI API integration for LLM-based categorization
- [ ] MongoDB Atlas Vector Search for vendor embedding lookup
- [ ] Response category validated against active `categories` collection
- [ ] `503` fallback when AI service is down
- [ ] `POST /api/v1/ai/categorize/feedback` implemented
- [ ] `ai_categorization_feedback` collection schema
- [ ] All 5 UI components
- [ ] Unit tests: known vendor → high confidence, unknown vendor → low confidence, unavailable service, invalid category filtered
- [ ] Integration test: OCR output → categorize → auto-fill → feedback recorded
