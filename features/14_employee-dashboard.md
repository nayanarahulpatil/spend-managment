# Feature: Employee Dashboard

## Feature ID
`F-14`

## Purpose
Provide logged-in employees with a personalized dashboard showing their expense summary, submission history, pending approval status, and reimbursement tracking — enabling full self-service visibility into their expense lifecycle.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-14-1 | Employee | As an employee, I want to see my total spend, pending approvals, and reimbursed amount on one screen. |
| US-14-2 | Employee | As an employee, I want to quickly access my recent expense submissions and their current status. |
| US-14-3 | Employee | As an employee, I want to see if any of my expenses are awaiting more information from me. |

---

## Functional Requirements

- Dashboard displays employee-scoped data only (data isolation enforced at service layer).
- Dashboard widgets:
  1. **Spend Summary Card:** Total submitted, total approved, total reimbursed (base currency), this month vs. last month.
  2. **Pending Approvals List:** Expenses in `pending_approval` or `info_requested` status, sorted by submission date.
  3. **Recent Submissions:** Last 5 expense submissions with status badges.
  4. **Reimbursement Status:** Expenses in `finance_approved` or `reimbursed` state with dates.
  5. **Policy Violations Alert:** Count of flagged expenses requiring employee attention.
- All data fetched from `core-business-service` aggregation APIs.
- Dashboard data refreshes on page load; auto-refresh configurable (e.g., every 60 seconds).

---

## Validation Rules

| Check | Rule |
|---|---|
| Data isolation | Service filters all queries by `employee_id = authenticated_user_id`. |
| Currency display | All amounts displayed in base currency with original currency noted. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Employee has no expenses | All widgets show zero state with "Submit your first expense" CTA. |
| Dashboard API fails | Skeleton loaders shown; error banner displayed; retry button. |
| Employee has only rejected expenses | Spend summary reflects $0 approved; rejected list shown separately. |
| Month boundary (e.g., first day of month) | "This month" shows current month; "Last month" shows previous. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `core-business-service` | Expense aggregation and dashboard API |
| MongoDB | `expenses` and `workflows` aggregations |
| Redis | Optional — cache dashboard aggregation for 60 seconds |
| F-03 RBAC | Employee sees only own data |

---

## API Requirements

### `GET /api/v1/dashboard/employee`
**Access:** Employee, Manager (own data), Finance (own data)

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "summary": {
      "total_submitted": 12,
      "total_amount_submitted": 3200.00,
      "total_approved": 8,
      "total_amount_approved": 2100.00,
      "total_reimbursed": 5,
      "total_amount_reimbursed": 1500.00,
      "this_month": { "submitted": 3, "amount": 800.00 },
      "last_month": { "submitted": 4, "amount": 1200.00 }
    },
    "pending_approvals": [
      {
        "expense_id": "string",
        "description": "string",
        "amount": 150.00,
        "currency": "USD",
        "status": "pending_approval",
        "submitted_at": "ISO8601",
        "current_approver": "string"
      }
    ],
    "recent_submissions": [],
    "policy_violations_count": 2
  },
  "message": "Dashboard loaded"
}
```

---

## Database Impact

No new collection. Aggregation pipeline on `expenses` collection filtered by `employee_id`.

**Aggregation stages:**
1. Match `{ employee_id: authenticated_user_id, deleted_at: null }`
2. Group by `status` to compute counts and sums
3. Lookup `workflows` for pending approver name
4. Sort by `created_at` descending for recent submissions

---

## UI Components

| Component | Description |
|---|---|
| `SpendSummaryCard` | 4-stat card: submitted, approved, reimbursed amounts + month-over-month |
| `PendingApprovalsList` | Compact list with expense name, amount, status badge, approver name |
| `RecentSubmissionsTable` | Last 5 expenses with status pill and date |
| `ReimbursementTracker` | Progress indicator per approved expense (approved → payment pending → reimbursed) |
| `PolicyViolationAlert` | Amber alert badge if any violations pending employee attention |
| `EmptyStateCTA` | Zero-state illustration + "Submit Expense" button |
| `DashboardSkeletonLoader` | Shown during initial data fetch |

---

## Security Requirements

- Service layer enforces `employee_id = authenticated_user_id` on all queries — no client-side filtering trusted.
- Dashboard endpoint returns `403` if called by an unauthenticated request.
- No other employee's data can appear in the response.

---

## Acceptance Criteria

- [ ] GIVEN a logged-in employee with 10 expenses, WHEN `GET /api/v1/dashboard/employee` is called, THEN the summary accurately reflects their expense totals.
- [ ] GIVEN an employee has no expenses, WHEN the dashboard loads, THEN zero states are shown with a "Submit Expense" CTA.
- [ ] GIVEN an employee has 3 pending approvals, WHEN the dashboard loads, THEN all 3 appear in the `pending_approvals` widget with current approver name.
- [ ] GIVEN the dashboard data matches `GET /api/v1/expenses` aggregated total, THEN both values must be equal (data accuracy test).
- [ ] GIVEN the dashboard loads, WHEN API responds, THEN all widgets render within 3 seconds at P95.
- [ ] GIVEN an Employee token, WHEN `GET /api/v1/dashboard/employee` is called, THEN only that employee's data is returned.

---

## Definition of Done

- [ ] `GET /api/v1/dashboard/employee` implemented with aggregation pipeline
- [ ] Data isolation enforced at service layer (`employee_id` filter)
- [ ] Redis cache for aggregation (optional, 60s TTL)
- [ ] All 7 UI components implemented
- [ ] Skeleton loaders on all widgets
- [ ] Empty state with CTA
- [ ] Unit tests: data accuracy, isolation (cannot see other employee data), empty state
- [ ] Integration test: dashboard total matches raw expense list total
