# Feature: Manager Team Dashboard

## Feature ID
`F-15`

## Purpose
Provide managers with an aggregated view of their team's expense activity, including spend breakdown, pending approval queue, and policy violation summary — enabling informed approval decisions and team-level spend oversight.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-15-1 | Manager | As a manager, I want to see total spend across my direct reports so I can monitor team budget. |
| US-15-2 | Manager | As a manager, I want to see all pending expenses from my team so I can prioritize approvals. |
| US-15-3 | Manager | As a manager, I want to see a breakdown of spend by category and employee for my team. |
| US-15-4 | Manager | As a manager, I want to see how many policy violations my team has this month. |

---

## Functional Requirements

- Dashboard scoped to the manager's direct reports (`manager_id = authenticated_user_id` on the `users` collection).
- Dashboard widgets:
  1. **Team Spend Summary:** Total team submitted, approved, reimbursed (base currency), this month.
  2. **Pending Approvals Queue (Preview):** Top 5 pending expenses assigned to this manager, with quick-action links.
  3. **Team Spend by Employee:** Bar chart / table showing per-employee spend and submission count.
  4. **Team Spend by Category:** Donut/pie breakdown of spend by expense category.
  5. **Policy Violations Summary:** Count of flagged expenses across the team this month.
  6. **SLA At-Risk Expenses:** Expenses approaching SLA deadline (< 12 hours remaining).
- All data scoped to direct reports only.
- Drill-down: clicking an employee row shows their individual expense list.

---

## Validation Rules

| Check | Rule |
|---|---|
| Data scope | All queries filter `employee_id IN [direct_report_ids]` for the authenticated manager. |
| Direct report resolution | `users` collection queried for `manager_id = authenticated_user_id` and `is_active = true`. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| Manager has no direct reports | Dashboard shows zero state: "No direct reports found." |
| All team expenses approved | Pending queue widget shows empty state. |
| Team member deactivated mid-month | Their expenses still appear in historical aggregation. |
| Manager also has own expenses | Own expenses not included in team dashboard (shown in F-14 employee dashboard). |

---

## Dependencies

| Dependency | Type |
|---|---|
| `core-business-service` | Team aggregation API |
| MongoDB | `expenses` and `users` aggregation by `manager_id` |
| Redis | Optional aggregation cache (5-min TTL for team data) |
| F-10 Approval Workflow Engine | SLA deadline data for at-risk widget |
| F-03 RBAC | Manager role required |

---

## API Requirements

### `GET /api/v1/dashboard/manager`
**Access:** Manager, Admin

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "team_summary": {
      "total_submitted": 45,
      "total_amount_submitted": 12500.00,
      "total_approved": 30,
      "total_amount_approved": 8800.00,
      "this_month": { "submitted": 12, "amount": 3200.00 }
    },
    "pending_queue_preview": [
      {
        "expense_id": "string",
        "employee_name": "string",
        "amount": 200.00,
        "category": "Travel",
        "submitted_at": "ISO8601",
        "sla_deadline": "ISO8601",
        "policy_violation": true
      }
    ],
    "spend_by_employee": [
      { "employee_id": "string", "name": "string", "total_amount": 2100.00, "expense_count": 8 }
    ],
    "spend_by_category": [
      { "category": "Meals", "total_amount": 1500.00, "percentage": 35 }
    ],
    "policy_violations_count": 5,
    "sla_at_risk_count": 2
  },
  "message": "Manager dashboard loaded"
}
```

---

## Database Impact

Aggregation on `expenses` + lookup on `users` (manager_id filter):
```js
// Direct reports lookup
db.users.find({ manager_id: authenticatedUserId, is_active: true })

// Team expense aggregation
db.expenses.aggregate([
  { $match: { employee_id: { $in: directReportIds } } },
  { $group: { _id: "$status", total: { $sum: "$converted_amount" }, count: { $sum: 1 } } }
])
```

---

## UI Components

| Component | Description |
|---|---|
| `TeamSpendSummaryCard` | 4-metric card: submitted, approved, reimbursed, this month total |
| `PendingQueuePreview` | Top 5 pending items with quick approve/reject action buttons |
| `SpendByEmployeeTable` | Sortable table: employee name, amount, count, with drill-down link |
| `SpendByCategoryDonut` | Donut chart with legend; click to filter by category |
| `PolicyViolationSummaryBadge` | Amber badge: "5 violations this month" |
| `SlaAtRiskAlert` | Red alert strip: "2 expenses approaching SLA deadline" with links |
| `TeamDashboardSkeletonLoader` | Skeleton layout for all widgets |

---

## Security Requirements

- Service layer enforces `employee_id IN direct_report_ids` — manager cannot access other departments.
- Direct report IDs resolved server-side using `manager_id` filter — not passed by client.
- Drill-down to individual employee expenses enforces same ownership scope.

---

## Acceptance Criteria

- [ ] GIVEN a manager with 10 direct reports, WHEN `GET /api/v1/dashboard/manager` is called, THEN 100% of direct-report expenses are reflected in team summary.
- [ ] GIVEN a manager, WHEN the spend by employee widget loads, THEN each direct report appears with accurate totals.
- [ ] GIVEN a manager has no direct reports, WHEN dashboard loads, THEN zero state is displayed.
- [ ] GIVEN the manager dashboard total is compared to the sum of individual `GET /api/v1/dashboard/employee` totals for each report, THEN they must match.
- [ ] GIVEN a Manager token, WHEN `GET /api/v1/dashboard/manager` is called, THEN no expenses from outside their direct reports appear.
- [ ] GIVEN the dashboard loads, WHEN API responds, THEN all widgets render within 3 seconds at P95.

---

## Definition of Done

- [ ] `GET /api/v1/dashboard/manager` with aggregation pipeline (direct reports scope)
- [ ] Direct report resolution from `users` collection
- [ ] Spend by employee and by category breakdowns
- [ ] SLA at-risk count from `workflows` collection
- [ ] Redis cache for team aggregation (5-min TTL)
- [ ] All 7 UI components implemented
- [ ] Skeleton loaders and empty states
- [ ] Unit tests: scope isolation, zero-state, accurate totals
- [ ] Integration test: team total matches sum of individual employee totals
