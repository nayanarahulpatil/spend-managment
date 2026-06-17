# Feature: Receipt Upload & OCR

## Feature ID
`F-06`

## Purpose
Allow employees to upload receipt images before or during expense submission. Use OCR to automatically extract amount, date, and vendor from the receipt to pre-populate the expense form, reducing manual entry and improving data accuracy.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-06-1 | Employee | As an employee, I want to upload a receipt image so the system extracts the details for me. |
| US-06-2 | Employee | As an employee, I want to see a confidence indicator for OCR data so I know what to verify manually. |
| US-06-3 | Employee | As an employee, I want to manually enter data when OCR cannot read my receipt. |

---

## Functional Requirements

- Employee uploads a receipt image via `POST /api/v1/expenses/receipt/upload` (multipart/form-data).
- Accepted formats: `JPEG`, `PNG`, `PDF`. Max file size: 10MB.
- System stores the file in cloud object storage (e.g., S3-compatible) and generates a `receipt_url`.
- OCR is triggered asynchronously after upload; result returned in the same response if < 5 seconds, or via polling endpoint.
- OCR extracts: `amount` (number), `date` (string, parsed to ISO 8601), `vendor` (string).
- Response includes `ocr_confidence` field: `high | medium | low`.
- If `ocr_confidence: low` — UI prompts employee to enter details manually; fields not auto-populated.
- `receipt_url` is stored and used in `POST /api/v1/expenses` (F-05).
- SHA-256 hash of file content computed on upload and stored — used for duplicate detection (F-07).

---

## Validation Rules

| Field | Rule |
|---|---|
| `file` | Required. JPEG, PNG, or PDF only. Max 10MB. |
| File MIME type | Validated server-side (not just by extension). |
| File content | Scanned for malware/malicious content before processing. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Unsupported file type | `422 Unprocessable Entity` — "Unsupported file type. Use JPEG, PNG, or PDF." |
| File exceeds 10MB | `413 Payload Too Large` — "File size exceeds the 10MB limit." |
| OCR fails (unreadable image) | Returns `receipt_url` with `ocr_data: null`, `ocr_confidence: low`; employee enters manually. |
| OCR times out (> 5 seconds) | Returns `receipt_url` with `ocr_status: processing`; polling endpoint provided. |
| Malware detected in file | `422 Unprocessable Entity` — "File failed security scan." File not stored. |
| Same file re-uploaded | `receipt_url` returned for new storage entry; duplicate detection handled in F-07 at expense level. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `core-business-service` | Orchestrates upload, OCR call, hash computation |
| Cloud Object Storage (e.g., AWS S3 / MinIO) | Receipt file storage |
| OCR Service (e.g., AWS Textract / Google Vision) | Text extraction from receipt image |
| Malware Scanner (e.g., ClamAV) | Pre-storage file scan |
| MongoDB | Stores `receipt_url` and `receipt_hash` on expense record |
| F-05 Expense Submission | Consumes `receipt_url` from this feature |
| F-07 Duplicate Receipt Detection | Consumes `receipt_hash` computed here |

---

## API Requirements

### `POST /api/v1/expenses/receipt/upload`
**Request:** `multipart/form-data`
```
file: <binary>
```

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "receipt_url": "https://storage.platform.com/receipts/uuid.jpg",
    "receipt_hash": "sha256_hex_string",
    "ocr_data": {
      "amount": 150.00,
      "date": "2026-06-15",
      "vendor": "Hilton Hotels"
    },
    "ocr_confidence": "high"
  },
  "message": "Receipt uploaded"
}
```

**Response when OCR pending:**
```json
{
  "status": 200,
  "data": {
    "receipt_url": "string",
    "receipt_hash": "string",
    "ocr_data": null,
    "ocr_confidence": null,
    "ocr_status": "processing",
    "poll_url": "/api/v1/expenses/receipt/ocr-status/:job_id"
  },
  "message": "Receipt uploaded. OCR processing."
}
```

**Errors:** `413` size exceeded | `422` unsupported type or malware

---

### `GET /api/v1/expenses/receipt/ocr-status/:job_id`
**Response 200 OK:** Returns `ocr_data` when complete; `{ "ocr_status": "processing" }` while pending.

---

## Database Impact

**Collection: `receipts`** (optional — may store directly on expense)
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `employee_id` | ObjectId | Uploader |
| `receipt_url` | String | Storage URL |
| `receipt_hash` | String | SHA-256 — indexed, used by F-07 |
| `ocr_data` | Object | `{ amount, date, vendor }` |
| `ocr_confidence` | Enum | `high\|medium\|low` |
| `ocr_status` | Enum | `complete\|processing\|failed` |
| `created_at` | Date | |

**Index:** `receipt_hash` (for duplicate lookup in F-07)

---

## UI Components

| Component | Description |
|---|---|
| `ReceiptUploader` | Drag-and-drop or file picker; preview thumbnail; progress bar during upload |
| `OcrResultPreview` | Shows extracted fields with confidence badge; editable inline |
| `OcrConfidenceBadge` | Color-coded: green (high), amber (medium), red (low) |
| `ManualEntryFallback` | Shown when `ocr_confidence: low` — all fields editable |
| `OcrPollingSpinner` | Shown when `ocr_status: processing`; auto-retries every 3s |

---

## Security Requirements

- Malware scan required before file is stored.
- File stored with a unique UUID filename — original filename discarded.
- MIME type validated server-side using file magic bytes (not by extension).
- Storage bucket is private; `receipt_url` is a pre-signed URL with TTL (e.g., 1 hour).
- Only the uploading employee (and authorized roles) can access the pre-signed URL.
- File size limit enforced at API Gateway level (before service processing).

---

## Acceptance Criteria

- [ ] GIVEN a valid JPEG receipt under 10MB, WHEN uploaded, THEN `receipt_url` and `ocr_data` are returned within 5 seconds with `ocr_confidence` set.
- [ ] GIVEN a clear machine-printed receipt, WHEN OCR processes it, THEN `amount`, `date`, and `vendor` are extracted with ≥ 90% accuracy.
- [ ] GIVEN an unreadable receipt image, WHEN OCR fails, THEN `receipt_url` is returned with `ocr_confidence: low` and no auto-populated fields.
- [ ] GIVEN a file exceeding 10MB, WHEN uploaded, THEN `413 Payload Too Large` is returned.
- [ ] GIVEN an unsupported file type (e.g., `.exe`), WHEN uploaded, THEN `422 Unprocessable Entity` is returned.
- [ ] GIVEN a malware-infected file, WHEN uploaded, THEN the file is rejected and not stored.
- [ ] GIVEN any upload, WHEN complete, THEN a `receipt_hash` is computed and returned for duplicate detection.

---

## Definition of Done

- [ ] `POST /api/v1/expenses/receipt/upload` with multipart handling
- [ ] Malware scan integration before storage
- [ ] MIME type validation via file magic bytes
- [ ] Cloud storage integration (pre-signed URL)
- [ ] OCR service integration with async fallback
- [ ] SHA-256 receipt hash computation on upload
- [ ] `GET /api/v1/expenses/receipt/ocr-status/:job_id` polling endpoint
- [ ] `ReceiptUploader` and `OcrResultPreview` UI components
- [ ] Unit tests: valid upload, oversized file, invalid type, OCR fail, malware detected
