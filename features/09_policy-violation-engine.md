# Feature: Policy Violation Engine

## Feature ID
`F-09`

## Purpose
Enforce configurable, organization-defined expense policy rules at the point of submission. Automatically flag expenses that violate limits (by category, role, department, or date range) without blocking the submission workflow. Alert approvers to violations in the approval queue.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-09-1 | Employee | As an employee, I want to know immediately if my expense exceeds a policy limit before finalizing. |
| US-09-2 | Manager | As a manager, I want to see policy violation flags on the expenses in my queue so I can make informed approval decisions. |
| US-09-3 | Admin | As an admin, I want to configure policy rules per category, department, and employee role. |
| US-09-4 | Finance | As a Finance user, I want violation reports to surface all flagged expenses for compliance review. |

---

## Functional Requirements

- Policy rules are configurable by Admin — no hardcoded limits.
- Rules are scoped by: `category_id`, `role`, `department_id`, `date_range`.
- Rule attributes: `max_amount` (base currency), `requires_receipt_above` (threshold), `allowed_days` (e.g., weekdays only).
- At submission, the policy engine evaluates all applicable rules for the expense.
- If any rule is violated:
  - Set `policy_violation: true` on expense record.
  - Store `violation_reason` (human-readable string).
  - Expense is still saved and routed to the approval workflow (not blocked).
- Approver dashboard displays a `Policy Violation` badge on flagged expenses.
- Multiple violations per expense supported — store as array `violations[]`.
- Policy rules have an `effective_from` and `effective_to` date (time-bound rules supported).

---

## Validation Rules

| Field | Rule |
|---|---|
| `category_id` | Matched against active policy rules for that category. |
| `amount` (converted) | Compared against `max_amount` in base currency from matching rule. |
| `date` | Checked against `allowed_days` and rule `effective_from`/`effective_to`. |
| Policy rule | Admin must configure at least one rule per active category. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No policy rule configured for category | Expense passes without violation flag; logged as "no rule defined." |
| Multiple rules applicable (role + dept) | All matching rules evaluated; each violation stored in `violations[]`. |
| Policy rule effective date expired | Expired rule not evaluated. |
| Amount equals exactly the limit | No violation — violation only when `amount > max_amount`. |
| Employee submits on a restricted day | Violation flagged: `"Expenses in this category are not allowed on weekends."` |
| Policy rule updated after submission | Historical expense violations not retroactively recalculated. |

---

## Dependencies

| Dependency | Type |
|---|---|
| F-05 Expense Submission | Calls policy engine synchronously before saving |
| `core-business-service` | Policy engine service |
| MongoDB | `policy_rules` collection |
| Admin Config / Policy Admin UI | CRUD for policy rules |
| Audit Log | Tracks policy rule changes by Admin |

---

## API Requirements

### Policy Engine (Internal — not a public endpoint)
Called synchronously during `POST /api/v1/expenses`.

**Input:**
```json
{
  "amount_in_base_currency": 150.00,
  "category_id": "string",
  "employee_role": "employee",
  "department_id": "string",
  "date": "2026-06-15"
}
```

**Output:**
```json
{
  "policy_violation": true,
  "violations": [
    {
      "rule_id": "string",
      "rule_name": "Meals & Entertainment Limit",
      "violation_reason": "Amount $150.00 exceeds the $100.00 category limit.",
      "severity": "warning"
    }
  ]
}
```

---

### Admin Policy Rule CRUD (implicit — needed for engine to function)
- `GET /api/v1/admin/policy-rules` — list all rules
- `POST /api/v1/admin/policy-rules` — create rule
- `PATCH /api/v1/admin/policy-rules/:id` — update rule
- `DELETE /api/v1/admin/policy-rules/:id` — deactivate rule

---

## Database Impact

**Collection: `policy_rules`**
| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `name` | String | Human-readable rule name |
| `category_id` | ObjectId | Nullable — applies to all categories if null |
| `role` | Enum | Nullable — applies to all roles if null |
| `department_id` | ObjectId | Nullable — applies to all depts if null |
| `max_amount` | Number | In base currency |
| `requires_receipt_above` | Number | Receipt threshold in base currency |
| `allowed_days` | Array[String] | e.g., `["Mon","Tue","Wed","Thu","Fri"]` |
| `effective_from` | Date | Rule activation date |
| `effective_to` | Date | Rule expiry date (nullable = indefinite) |
| `is_active` | Boolean | |

**Collection: `expenses`** — Additional fields:
| Field | Type | Notes |
|---|---|---|
| `policy_violation` | Boolean | |
| `violations` | Array[Object] | `[{ rule_id, rule_name, violation_reason, severity }]` |

**Indexes:** `category_id`, `role`, `department_id`, `effective_from`, `effective_to`, `is_active`

---

## UI Components

| Component | Description |
|---|---|
| `PolicyViolationBanner` | Shown in `NewExpenseForm` after submission if violation detected — not blocking |
| `ViolationBadge` | Red badge on expense card in approval queue |
| `ViolationDetailTooltip` | On hover/click: shows each rule violated with reason |
| `PolicyRuleAdminTable` | Admin CRUD table for managing policy rules with effective dates |
| `PolicyRuleForm` | Create/edit form: category, role, dept, max amount, allowed days, effective dates |

---

## Security Requirements

- Policy rules only writable by `Admin` role.
- Policy rule changes written to `audit_logs` with before/after state.
- Policy engine runs server-side — client cannot bypass by omitting the flag.
- Violations stored immutably on the expense record — cannot be cleared post-creation by employee.

---

## Acceptance Criteria

- [ ] GIVEN a policy rule with `max_amount: 100` for `Meals` category, WHEN an expense of $150 in Meals is submitted, THEN `policy_violation: true` and `violations[]` with the reason are returned.
- [ ] GIVEN no policy rule for a category, WHEN an expense in that category is submitted, THEN `policy_violation: false` and no violation array.
- [ ] GIVEN an expense exactly at the policy limit ($100), WHEN submitted, THEN `policy_violation: false`.
- [ ] GIVEN an expense with two applicable violations, WHEN submitted, THEN `violations[]` contains two entries.
- [ ] GIVEN a policy violation expense, WHEN it appears in the approval queue, THEN a `Policy Violation` badge is displayed.
- [ ] GIVEN an Admin creates a policy rule, WHEN the event fires, THEN an audit log entry is created.

---

## Definition of Done

- [ ] `policy_rules` collection schema and indexes created
- [ ] Policy engine service implemented (synchronous, called in expense submission)
- [ ] Multi-rule evaluation with `violations[]` array output
- [ ] Effective date filtering in rule lookup
- [ ] Admin policy rule CRUD endpoints
- [ ] `PolicyViolationBanner` and `ViolationBadge` UI components
- [ ] `PolicyRuleAdminTable` UI component
- [ ] Audit log on policy rule changes
- [ ] Unit tests: single violation, multi-violation, no rule, at-limit (no violation), expired rule
