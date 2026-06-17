# Feature: AI Policy Chatbot

## Feature ID
`F-22`

## Purpose
Provide employees and managers with a conversational AI assistant that can answer questions about the organization's expense policy in natural language. Maintain session continuity across messages. Use the organization's policy documentation as the knowledge base via retrieval-augmented generation (RAG).

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-22-1 | Employee | As an employee, I want to ask the chatbot "What is the meal limit for client dinners?" and get an accurate policy answer. |
| US-22-2 | Employee | As an employee, I want the chatbot to remember what I asked earlier in the same session so I don't have to repeat context. |
| US-22-3 | Manager | As a manager, I want to ask about travel policy limits for my team without reading the full policy document. |
| US-22-4 | Admin | As an admin, I want to update the policy knowledge base so the chatbot reflects the latest policy changes. |

---

## Functional Requirements

- `POST /api/v1/ai/chat` accepts a `message` and optional `session_id`.
- If `session_id` is provided and valid, the conversation history is retrieved and used as context.
- If `session_id` is not provided, a new session is created and returned.
- Chatbot uses RAG: user message → embed → retrieve relevant policy chunks from MongoDB Atlas Vector Search → pass retrieved context + conversation history to LLM → generate response.
- Policy knowledge base: Admin-uploaded policy documents, indexed as embeddings in MongoDB Atlas Vector Search.
- Response includes the `session_id` for follow-up messages.
- Sessions expire after 30 minutes of inactivity (configurable).
- Admin can upload/update policy documents (`POST /api/v1/admin/policy-docs`) to refresh the knowledge base.
- Out-of-scope questions (non-policy) → chatbot responds: "I can only assist with expense policy questions."
- Chat history stored per session: max 20 messages (configurable rolling window).

---

## Validation Rules

| Field | Rule |
|---|---|
| `message` | Required. Min 2, max 1000 chars. |
| `session_id` | Optional. Must be a valid UUID. If provided but expired → new session created. |
| Policy doc (admin upload) | PDF or TXT only. Max 10MB. Processed asynchronously into embeddings. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Session expired (> 30 min inactivity) | New session created silently; prior context not available. |
| Invalid `session_id` format | `422 Unprocessable Entity` — "Invalid session ID format." |
| AI service unavailable | `503 Service Unavailable` — "AI assistant is temporarily unavailable." |
| Out-of-scope question (e.g., "What's the weather?") | "I can only assist with expense policy questions. Please ask about the company expense policy." |
| Policy knowledge base empty (no docs indexed) | Chatbot responds with: "No policy documents are available. Please contact your Admin." |
| LLM hallucination (answer not grounded in policy docs) | RAG ensures retrieved context is passed; if no relevant chunk found, response states: "I couldn't find a specific policy for this. Please refer to your HR team." |

---

## Dependencies

| Dependency | Type |
|---|---|
| `ai-service` | Chatbot service — session management, RAG pipeline |
| OpenAI API | Chat completion (GPT-4) + text embeddings (`text-embedding-ada-002`) |
| MongoDB Atlas Vector Search | Policy chunk retrieval by semantic similarity |
| Redis | Session state storage (conversation history, TTL 30 min) |
| Admin Policy Doc Upload | Populates embedding index |
| F-03 RBAC | All authenticated roles (Employee, Manager, Finance, Admin) |

---

## API Requirements

### `POST /api/v1/ai/chat`
**Access:** Employee, Manager, Finance, Admin

**Request:**
```json
{
  "message": "What is the maximum amount I can claim for a business dinner?",
  "session_id": "uuid|optional"
}
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "reply": "According to the company expense policy, the maximum claim for a business dinner (Meals & Entertainment category) is $100 per person. Amounts exceeding this require prior manager approval and must be accompanied by a receipt.",
    "session_id": "uuid",
    "sources": [
      { "document": "Expense Policy v2.1", "section": "Section 4.2 – Meals & Entertainment" }
    ]
  },
  "message": "Response generated"
}
```

**Response 503 (AI unavailable):**
```json
{
  "status": 503,
  "data": {},
  "message": "AI assistant is temporarily unavailable. Please try again shortly."
}
```

---

### `GET /api/v1/ai/chat/history/:session_id`
**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "session_id": "uuid",
    "messages": [
      { "role": "user", "content": "string", "timestamp": "ISO8601" },
      { "role": "assistant", "content": "string", "timestamp": "ISO8601", "sources": [] }
    ]
  },
  "message": "History fetched"
}
```

---

### `POST /api/v1/admin/policy-docs`
**Access:** Admin only

**Request:** `multipart/form-data { "file": "binary", "name": "string", "version": "string" }`

**Response 202 Accepted:**
```json
{
  "status": 202,
  "data": { "job_id": "string" },
  "message": "Policy document uploaded. Indexing in progress."
}
```

---

## Database Impact

**MongoDB Atlas Vector Search — Collection: `policy_chunks`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `document_id` | ObjectId | Source policy doc |
| `document_name` | String | |
| `section` | String | e.g., "Section 4.2 – Meals" |
| `content` | String | Raw text chunk (≤ 500 tokens) |
| `embedding` | Array[Float] | 1536-dim embedding vector |
| `created_at` | Date | |

**Vector Search Index:** `{ embedding: "vector", numDimensions: 1536, similarity: "cosine" }`

**Redis:** Session key: `chat:session:<session_id>` → JSON array of messages, TTL 30 min.

**Collection: `policy_documents`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | |
| `version` | String | |
| `file_url` | String | |
| `status` | Enum | `indexing\|indexed\|failed` |
| `chunk_count` | Number | |
| `created_at` | Date | |

---

## UI Components

| Component | Description |
|---|---|
| `ChatbotWidget` | Floating chat bubble accessible from all pages |
| `ChatWindow` | Expandable panel: message list, input field, send button |
| `MessageBubble` | User (right-aligned) and assistant (left-aligned) message display |
| `SourceCitation` | Below assistant reply: linked policy section references |
| `TypingIndicator` | Animated dots while AI is generating response |
| `SessionExpiredBanner` | "Your previous session expired. Starting a new conversation." |
| `PolicyDocAdminUploader` | Admin page: drag-and-drop PDF/TXT upload with indexing progress |

---

## Security Requirements

- OpenAI API key stored in environment variable.
- Session stored in Redis — not in browser localStorage (avoid PII exposure).
- `session_id` validated as UUID — prevents session hijacking via malformed IDs.
- Each session is scoped to `user_id`: users cannot access other users' chat history.
- Policy documents stored in private cloud storage.
- Chatbot response does not include raw policy document URLs — only section citations.

---

## Acceptance Criteria

- [ ] GIVEN an employee asks a policy question, WHEN `POST /api/v1/ai/chat` is called, THEN a relevant, grounded answer is returned within 2 seconds at P95.
- [ ] GIVEN a `session_id` is returned from the first message, WHEN a follow-up question references prior context, THEN the assistant uses session history to answer correctly.
- [ ] GIVEN an out-of-scope question (e.g., "What's the capital of France?"), WHEN submitted, THEN the assistant responds with an out-of-scope message, not an answer.
- [ ] GIVEN a session has been inactive for > 30 minutes, WHEN a new message is sent with the old `session_id`, THEN a new session is created and prior context is not available.
- [ ] GIVEN the AI service is unavailable, WHEN chat is called, THEN `503 Service Unavailable` is returned.
- [ ] GIVEN an Admin uploads a new policy document, WHEN indexing completes, THEN subsequent chatbot responses reflect the updated policy content.
- [ ] GIVEN ≥ 85% of policy-related test questions, THEN the chatbot answers correctly based on the indexed policy documents.

---

## Definition of Done

- [ ] `POST /api/v1/ai/chat` with RAG pipeline (embed → retrieve → LLM → respond)
- [ ] `GET /api/v1/ai/chat/history/:session_id` implemented
- [ ] `POST /api/v1/admin/policy-docs` with async embedding job
- [ ] MongoDB Atlas Vector Search index configured on `policy_chunks`
- [ ] Redis session storage (30-min TTL)
- [ ] Session scoped to `user_id` — cross-user access blocked
- [ ] Out-of-scope question guard in LLM prompt
- [ ] `503` fallback when AI service is down
- [ ] All 7 UI components (including `ChatbotWidget` accessible from all pages)
- [ ] Unit tests: grounded answer, out-of-scope, session continuity, expired session, AI unavailable
- [ ] Integration test: upload policy doc → index → ask question → receive grounded answer with citation
