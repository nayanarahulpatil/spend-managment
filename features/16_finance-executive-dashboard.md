# Feature: Finance & Executive Dashboard

## Feature ID
`F-16`

## Purpose
Provide Finance users with a pending approvals queue and financial controls dashboard, and Executives with cross-organization spend analytics refreshed within 15 minutes of new events — enabling real-time financial oversight and strategic decision-making.

---

## User Stories

| ID | Role | Story |
|---|---|---|
| US-16-1 | Finance | As a Finance user, I want to see all expenses awaiting Finance-level approval in a prioritized queue. |
| US-16-2 | Finance | As a Finance user, I want to see org-wide spend metrics filtered by department, category, and time period. |
| US-16-3 | Executive | As an executive, I want to see real-time company-wide spend analytics without drilling into individual expense records. |
| US-16-4 | Executive | As an executive, I want to see top policy violators and highest spend categories for strategic review. |

---

## Functional Requirements

**Finance Dashboard:**
- Finance approval queue: all expenses at Finance level with `pending_approval` status.
- Summary metrics: total pending amount, avg processing time, SLA breach count.
- Org-wide spend table: filterable by department, category, date range.
- Policy violations summary: top 5 categories with highest violation rates.
- Quick-action: approve/reject from dashboard without navigating to queue.

**Executive Dashboard:**
- Org-wide spend KPIs: total spend, approved, reimbursed, pending — for current and previous period.
- Department-level spend breakdown (bar/treemap chart).
- Category spend leaderboard.
- Top 5 policy violators by department or employee (anonymizable via config).
- Month-over-month spend trend line chart.
- Data freshness: analytics updated within 15 minutes of a new approval/reimbursement event.

---

## Validation Rules

| Check | Rule |
|---|---|
| Finance dashboard | Accessible only by `finance` and `admin` roles. |
| Executive dashboard | Accessible only by `admin` role (configurable to include senior managers). |
| Data freshness | Analytics data must be ≤ 15 minutes stale from last event. |

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No pending Finance approvals | Queue shows empty state: "All caught up!" |
| Analytics data older than 15 minutes | Stale data indicator shown with last-updated timestamp. |
| Executive accesses Finance queue | Separate route — Executive sees analytics only, not approval queue. |
| Department with zero spend | Shown in department breakdown with $0 — not omitted. |

---

## Dependencies

| Dependency | Type |
|---|---|
| `reporting-service` | Analytics aggregation engine |
| `core-business-service` | Finance approval queue data |
| MongoDB | Cross-org aggregation on `expenses`, `workflows` |
| Redis | Analytics cache (15-min TTL, invalidated on approval/reimbursement events) |
| F-10 Workflow Engine | Approval queue data source |
| F-03 RBAC | Finance + Admin roles only |

---

## API Requirements

### `GET /api/v1/dashboard/finance`
**Access:** Finance, Admin

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "approval_queue": {
      "total_pending": 18,
      "total_pending_amount": 45200.00,
      "avg_wait_hours": 22.5,
      "sla_breach_count": 3,
      "items": []
    },
    "org_spend_summary": {
      "total_submitted": 320,
      "total_approved": 280,
      "total_reimbursed": 240,
      "total_amount_approved": 185000.00
    },
    "violation_summary": [
      { "category": "Travel", "violation_count": 12, "violation_rate": 18 }
    ]
  },
  "message": "Finance dashboard loaded"
}
```

---

### `GET /api/v1/dashboard/executive`
**Access:** Admin (configurable for senior roles)

**Response 200 OK:**
```json
{
  "status": 200,
  "data": {
    "kpis": {
      "total_spend_this_period": 185000.00,
      "total_spend_last_period": 172000.00,
      "change_percentage": 7.56,
      "pending_amount": 45200.00
    },
    "spend_by_department": [
      { "department": "Engineering", "total_amount": 62000.00, "percentage": 33.5 }
    ],
    "spend_by_category": [
      { "category": "Travel", "total_amount": 55000.00, "percentage": 29.7 }
    ],
    "top_violations_by_department": [],
    "monthly_trend": [
      { "month": "2026-05", "total_amount": 172000.00 },
      { "month": "2026-06", "total_amount": 185000.00 }
    ],
    "data_as_of": "ISO8601"
  },
  "message": "Executive dashboard loaded"
}
```

---

## Database Impact

Aggregation on `expenses` (all records) + joins on `users`, `departments`, `categories`.

**Redis cache keys:**
- `dashboard:finance:<user_id>` — TTL 5 min
- `dashboard:executive` — TTL 15 min; invalidated on `approval` or `reimbursement` events

**Event-driven invalidation:**
- On expense status change to `finance_approved` or `reimbursed` → publish event → invalidate `dashboard:executive` cache.

---

## UI Components

**Finance Dashboard:**
| Component | Description |
|---|---|
| `FinanceApprovalQueue` | Full paginated queue with sort, filter, bulk-select, quick-action bar |
| `OrgSpendSummaryCard` | 4 KPI metrics: submitted, approved, reimbursed, pending amount |
| `ViolationSummaryTable` | Category, violation count, rate — sorted by rate descending |
| `AvgProcessingTimeCard` | Avg hours from submission to Finance approval |

**Executive Dashboard:**
| Component | Description |
|---|---|
| `ExecutiveKpiCards` | Period totals with MoM change arrows |
| `DepartmentSpendBarChart` | Horizontal bar chart with department breakdown |
| `CategorySpendLeaderboard` | Ranked list with percentage and amount |
| `MonthlyTrendLineChart` | 12-month rolling trend line |
| `TopViolatorsBadge` | Anonymizable top-violating departments/employees |
| `DataFreshnessIndicator` | "Data as of [time]" — amber if > 15 min stale |

---

## Security Requirements

- Finance queue shows all Finance-level expenses — not scoped to individual approver.
- Executive dashboard data is aggregated only — no individual expense details accessible.
- `top_violations_by_department` — employee names anonymizable via admin configuration (shows only department in anonymous mode).
- Both dashboards protected by RBAC middleware.

---

## Acceptance Criteria

- [ ] GIVEN a Finance user logs in, WHEN `GET /api/v1/dashboard/finance` is called, THEN all Finance-level pending expenses appear in the approval queue.
- [ ] GIVEN a new expense is approved, WHEN up to 15 minutes elapse, THEN the Executive analytics figures are updated.
- [ ] GIVEN a Finance user views the dashboard, WHEN it loads, THEN all widgets render within 3 seconds.
- [ ] GIVEN `data_as_of` in the Executive dashboard response, WHEN it is > 15 minutes old, THEN a stale data indicator is displayed.
- [ ] GIVEN an Employee role token, WHEN `GET /api/v1/dashboard/finance` is called, THEN `403 Forbidden` is returned.

---

## Definition of Done

- [ ] `GET /api/v1/dashboard/finance` with approval queue and org spend aggregation
- [ ] `GET /api/v1/dashboard/executive` with KPIs, department/category breakdown, trend
- [ ] Redis cache with event-driven invalidation on approval/reimbursement
- [ ] 15-min freshness guarantee with stale data indicator
- [ ] All Finance and Executive UI components
- [ ] RBAC enforcement
- [ ] Unit tests: data accuracy, cache invalidation, RBAC block
- [ ] Integration test: approve expense → cache invalidates → executive dashboard reflects update within 15 min
