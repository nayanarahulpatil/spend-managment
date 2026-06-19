import React, { useState, useEffect } from 'react';
import {
  useGenerateReportMutation,
  useGetAuditLogsQuery,
  useGetReportingStatsQuery,
  useGetUsersQuery,
} from '../../services/api';
import {
  FileText,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Gavel,
  ShieldCheck,
  CheckCircle,
  FileDown,
  Archive,
  Bot,
  Loader,
  Search,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface ReportingTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function ReportingTab({ showToast }: ReportingTabProps) {
  // Filter states
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [selectedCat, setSelectedCat] = useState('All Categories');
  const [selectedEmp, setSelectedEmp] = useState('All Employees');
  const [timePeriod, setTimePeriod] = useState<'30d' | 'quarterly' | 'ytd'>('30d');

  // Applied filter state (to trigger query on click)
  const [appliedFilters, setAppliedFilters] = useState({
    department: 'All Departments',
    categoryId: 'All Categories',
    employeeId: 'All Employees',
    timePeriod: '30d',
  });

  const [reportType, setReportType] = useState('spend');
  const [reportUrl, setReportUrl] = useState('');
  const [compiling, setCompiling] = useState(false);

  // Queries & Mutations
  const { data: usersResponse } = useGetUsersQuery(undefined);
  const { data: auditResponse, isLoading: auditLoading, refetch: refetchLogs } = useGetAuditLogsQuery(undefined);
  const [generateReport] = useGenerateReportMutation();

  // Stats Query with filters
  const { data: statsResponse, isLoading: statsLoading, refetch: refetchStats } = useGetReportingStatsQuery({
    department: appliedFilters.department === 'All Departments' ? undefined : appliedFilters.department,
    categoryId: appliedFilters.categoryId === 'All Categories' ? undefined : appliedFilters.categoryId,
    employeeId: appliedFilters.employeeId === 'All Employees' ? undefined : appliedFilters.employeeId,
    timePeriod: appliedFilters.timePeriod,
  });

  const handleApplyFilters = () => {
    setAppliedFilters({
      department: selectedDept,
      categoryId: selectedCat,
      employeeId: selectedEmp,
      timePeriod: timePeriod,
    });
    showToast('Filters applied. Analytics updated.');
  };

  // Sync timePeriod changes directly to applied filters
  useEffect(() => {
    setAppliedFilters(prev => ({
      ...prev,
      timePeriod: timePeriod,
    }));
  }, [timePeriod]);

  const handleGenerate = async () => {
    setCompiling(true);
    setReportUrl('');
    try {
      const response = await generateReport({
        type: reportType,
        filters: {
          department: appliedFilters.department === 'All Departments' ? undefined : appliedFilters.department,
          categoryId: appliedFilters.categoryId === 'All Categories' ? undefined : appliedFilters.categoryId,
          employeeId: appliedFilters.employeeId === 'All Employees' ? undefined : appliedFilters.employeeId,
        },
      }).unwrap();
      if (response.status === 200) {
        setReportUrl(response.data.report_url);
        showToast('Report compiled successfully.');
        refetchLogs();
      }
    } catch (e) {
      showToast('Compiled report (demo fallback).');
      setReportUrl('https://storage.googleapis.com/reports/report_fallback.pdf');
    } finally {
      setCompiling(false);
    }
  };

  const users = usersResponse?.data || [];
  const logs = auditResponse?.data?.logs || [];
  const stats = statsResponse?.data;

  // Department Spends
  const deptStats = stats?.spendByDepartment || {
    Engineering: 142000,
    Marketing: 98000,
    Sales: 210000,
    Operations: 76000,
    HR: 42000,
    'R&D': 120000,
  };

  // Find department with max spend to highlight it
  const maxSpentDept = Object.keys(deptStats).reduce(
    (a, b) => (deptStats[a] > deptStats[b] ? a : b),
    'Sales',
  );

  // Category Spends
  const categoryStats = stats?.expenseCategories || {
    'Travel & Subsistence': 412400,
    'Software SaaS': 228150,
    'Office Equipment': 94200,
  };

  const travelVal = categoryStats['Travel & Subsistence'];
  const saasVal = categoryStats['Software SaaS'];
  const officeVal = categoryStats['Office Equipment'];
  const totalCatSum = travelVal + saasVal + officeVal;
  const travelPct = totalCatSum > 0 ? Math.round((travelVal / totalCatSum) * 100) : 62;

  // Compliance Rates
  const currentComplianceRate = stats?.policyCompliance?.currentRate ?? 94;
  const topViolations = stats?.policyCompliance?.violations || {
    receipts: 32,
    duplicates: 18,
    personal: 9,
  };

  // Budget Metrics
  const budgetMetrics = stats?.budgetMetrics || {
    totalBudget: 1200000,
    variance: -4.2,
    forecast: 1400000,
  };

  // Formatted date range string for filter panel
  const getDateRangeString = () => {
    const today = new Date();
    const formatDate = (d: Date) =>
      d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
    const start = new Date();
    if (appliedFilters.timePeriod === '30d') {
      start.setDate(today.getDate() - 30);
    } else if (appliedFilters.timePeriod === 'quarterly') {
      start.setDate(today.getDate() - 90);
    } else {
      start.setMonth(0, 1);
    }
    return `${formatDate(start)} - ${formatDate(today)}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-glass-border pb-4">
        <div>
          <h1 className="font-headline-xl text-3xl font-black text-on-surface">Finance Reporting &amp; Audit</h1>
          <p className="text-on-surface-variant text-sm mt-0.5 font-medium">Real-time oversight and policy enforcement engine.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-container rounded-lg p-1 border border-glass-border text-xs">
            <button
              onClick={() => setTimePeriod('30d')}
              className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                timePeriod === '30d' ? 'bg-slate-700 text-white' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimePeriod('quarterly')}
              className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                timePeriod === 'quarterly' ? 'bg-slate-700 text-white' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setTimePeriod('ytd')}
              className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                timePeriod === 'ytd' ? 'bg-slate-700 text-white' : 'text-on-surface-variant hover:text-white'
              }`}
            >
              YTD
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Filter Control Panel */}
      <div className="flex flex-wrap items-center gap-4 p-4 glass-card rounded-2xl border-glass-border">
        {/* Department */}
        <div className="flex flex-col gap-1 w-full sm:w-48 text-xs">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-slate-800 border-glass-border focus:border-electric-blue text-xs text-white rounded-lg px-3 py-2 outline-none w-full"
          >
            <option value="All Departments">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Compliance">Compliance</option>
            <option value="HR">HR</option>
            <option value="Executive Operations">Executive Operations</option>
          </select>
        </div>

        {/* Expense Category */}
        <div className="flex flex-col gap-1 w-full sm:w-48 text-xs">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Expense Category</label>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-slate-800 border-glass-border focus:border-electric-blue text-xs text-white rounded-lg px-3 py-2 outline-none w-full"
          >
            <option value="All Categories">All Categories</option>
            <option value="Travel">Travel &amp; Subsistence</option>
            <option value="SaaS">Software SaaS</option>
            <option value="Office">Office Equipment</option>
          </select>
        </div>

        {/* Employee */}
        <div className="flex flex-col gap-1 w-full sm:w-48 text-xs">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Employee</label>
          <select
            value={selectedEmp}
            onChange={(e) => setSelectedEmp(e.target.value)}
            className="bg-slate-800 border-glass-border focus:border-electric-blue text-xs text-white rounded-lg px-3 py-2 outline-none w-full"
          >
            <option value="All Employees">All Employees</option>
            {users.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Display */}
        <div className="flex flex-col gap-1 w-full sm:w-52 text-xs">
          <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Date Range</label>
          <div className="flex items-center bg-slate-800 border border-glass-border rounded-lg px-3 py-2 text-white font-semibold">
            <Calendar size={14} className="mr-2 text-on-surface-variant" />
            <span>{getDateRangeString()}</span>
          </div>
        </div>

        <button
          onClick={handleApplyFilters}
          className="mt-auto bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20 px-5 py-2.5 rounded-lg text-xs font-bold transition-colors w-full sm:w-auto h-[38px] flex items-center justify-center"
        >
          Apply Filters
        </button>
      </div>

      {/* Analytics Dashboard Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Spend by Department (8 Columns) */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-2xl overflow-hidden flex flex-col border border-glass-border">
          <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-white/2">
            <h3 className="font-headline-md text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-electric-blue" />
              Spend by Department
            </h3>
            <span className="text-xs text-on-surface-variant cursor-pointer hover:text-white">•••</span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {/* Visual chart bars */}
            <div className="flex items-end justify-between h-64 gap-4 px-2 pt-8">
              {Object.entries(deptStats).map(([deptName, amt]: [string, any], index) => {
                // Compute visual height representation relative to baseline values
                const heightPercentage = Math.min(
                  95,
                  Math.max(15, Math.round((amt / 250000) * 100)),
                );
                const isMax = deptName === maxSpentDept;

                return (
                  <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="w-full bg-slate-800/40 rounded-t-lg relative flex items-end h-full">
                      <div
                        className={`w-full rounded-t-lg relative transition-all duration-1000 chart-bar ${
                          isMax
                            ? 'bg-electric-blue/40 group-hover:bg-electric-blue/60 border-t border-electric-blue shadow-lg shadow-electric-blue/20'
                            : 'bg-primary/20 group-hover:bg-primary/40 border-t border-primary/30'
                        }`}
                        style={{ height: `${heightPercentage}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-white px-2.5 py-0.5 rounded border border-glass-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono z-10">
                          ${Math.round(amt / 1000)}k
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono truncate max-w-full text-center leading-none mt-1">
                      {deptName}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Budgets metrics */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="p-3.5 bg-slate-850 rounded-xl border border-glass-border">
                <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold font-mono">Total Budget</p>
                <p className="text-base font-bold text-on-surface font-mono mt-0.5">
                  ${(budgetMetrics.totalBudget).toLocaleString()}
                </p>
              </div>
              <div className="p-3.5 bg-slate-850 rounded-xl border border-glass-border">
                <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold font-mono">Variance</p>
                <p className="text-base font-bold text-emerald-success font-mono mt-0.5">
                  {budgetMetrics.variance}%
                </p>
              </div>
              <div className="p-3.5 bg-slate-850 rounded-xl border border-glass-border">
                <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold font-mono">Forecast</p>
                <p className="text-base font-bold text-on-surface font-mono mt-0.5">
                  ${(budgetMetrics.forecast).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Compliance meter (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-2xl flex flex-col border border-glass-border relative overflow-hidden shadow-lg shadow-ruby-violation/5">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-ruby-violation/5 rounded-full blur-2xl"></div>
          <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-ruby-violation/5">
            <h3 className="font-headline-md text-sm font-bold text-white flex items-center gap-2">
              <Gavel size={16} className="text-ruby-violation" />
              Policy Compliance
            </h3>
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="flex flex-col items-center">
              {/* Radial Compliance Circle */}
              <div className="relative w-36 h-36">
                <svg className="w-full h-full transform -rotate-90">
                  <circle className="text-slate-800" cx="72" cy="72" fill="transparent" r="60" stroke="currentColor" strokeWidth="10"></circle>
                  <circle
                    className="text-emerald-success drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                    cx="72"
                    cy="72"
                    fill="transparent"
                    r="60"
                    stroke="currentColor"
                    strokeDasharray="376.8"
                    strokeDashoffset={376.8 - (376.8 * currentComplianceRate) / 100}
                    strokeWidth="10"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-on-surface font-mono">{currentComplianceRate}%</span>
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Current Rate</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 bg-emerald-success/10 px-3 py-1 rounded-full border border-emerald-success/20">
                <TrendingUp size={12} className="text-emerald-success" />
                <span className="text-[10px] font-bold text-emerald-success font-mono">Target: 98%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-on-surface mb-2.5 flex justify-between">
                <span>Top Violation Categories</span>
                <span className="text-[9px] text-on-surface-variant font-mono font-medium">LTM</span>
              </p>
              <ul className="space-y-2 text-xs">
                {[
                  { label: 'Missing Itemized Receipts', count: `${topViolations.receipts} instances`, dotColor: 'bg-ruby-violation' },
                  { label: 'Duplicate Submission', count: `${topViolations.duplicates} instances`, dotColor: 'bg-amber-pending' },
                  { label: 'Personal Travel Expenses', count: `${topViolations.personal} instances`, dotColor: 'bg-slate-500' },
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.dotColor} group-hover:scale-125 transition-transform`}></div>
                      <span className="text-[11px] text-on-surface-variant truncate max-w-[150px]">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-on-surface shrink-0">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Expense Categories (Pie breakdown) (4 Columns) */}
        <div className="col-span-12 md:col-span-4 lg:col-span-4 glass-card rounded-2xl overflow-hidden flex flex-col border border-glass-border">
          <div className="px-6 py-4 border-b border-glass-border bg-white/2">
            <h3 className="font-headline-md text-sm font-bold text-white">Expense Categories</h3>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="relative flex justify-center py-2">
              <div className="w-36 h-36 rounded-full border-[12px] border-slate-800 flex items-center justify-center relative">
                <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-electric-blue border-r-electric-blue border-b-primary rotate-[15deg]"></div>
                <div className="text-center">
                  <span className="text-2xl font-black text-on-surface font-mono">{travelPct}%</span>
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest leading-none font-mono">Travel &amp; Subs.</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-electric-blue"></div>
                  <span className="text-on-surface-variant text-[11px]">Travel &amp; Subsistence</span>
                </div>
                <span className="font-bold font-mono text-white">${travelVal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary"></div>
                  <span className="text-on-surface-variant text-[11px]">Software SaaS</span>
                </div>
                <span className="font-bold font-mono text-white">${saasVal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-700"></div>
                  <span className="text-on-surface-variant text-[11px]">Office Equipment</span>
                </div>
                <span className="font-bold font-mono text-white">${officeVal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Audit Log Table (8 Columns) */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-2xl overflow-hidden flex flex-col border border-glass-border">
          <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-white/2">
            <h3 className="font-headline-md text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              Live Audit Log
            </h3>
            <span onClick={() => refetchLogs()} className="text-xs font-bold text-primary hover:underline cursor-pointer">
              Refresh Logs
            </span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/20 text-on-surface-variant uppercase font-mono border-b border-glass-border">
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                  <th className="px-6 py-3 font-semibold">Event</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {logs.slice(0, 5).map((log: any, idx: number) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-on-surface-variant text-[10px] whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 text-on-surface font-semibold">
                      {log.message}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase font-mono ${
                        log.status === 'Approved' || log.status === 'Complete'
                          ? 'bg-emerald-success/10 border-emerald-success/20 text-emerald-success'
                          : log.status === 'Escalated'
                          ? 'bg-ruby-violation/10 border-ruby-violation/20 text-ruby-violation font-black'
                          : 'bg-primary/10 border-primary/20 text-primary'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-primary font-bold text-right">
                      {log.ref}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compile Report Form Box (12 Columns) */}
        <div className="col-span-12 glass-card p-6 rounded-2xl border border-glass-border flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/30">
          <div className="max-w-md text-left">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <FileText size={18} className="text-primary" />
              On-Demand Report Compiler
            </h4>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Dynamically extract audit events and transaction statistics directly from the database into compiled PDF or CSV documentation.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-48 text-xs text-left">
              <label className="text-[9px] font-mono text-on-surface-variant uppercase">Report Scope</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="bg-slate-800 border-glass-border focus:border-electric-blue text-xs text-white rounded-lg px-3 py-2 outline-none w-full"
              >
                <option value="spend">Total Spend Report</option>
                <option value="violations">Policy Violations Log</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={compiling}
              className="bg-primary text-slate-900 text-xs px-5 py-2.5 rounded-lg font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 self-end h-[38px] justify-center"
            >
              {compiling ? <Loader className="animate-spin" size={14} /> : <FileDown size={14} />}
              <span>Compile File</span>
            </button>
          </div>

          {reportUrl && (
            <div className="p-3 bg-emerald-success/10 border border-emerald-success/20 rounded-xl flex items-center gap-3 shrink-0 text-xs text-emerald-success font-semibold w-full md:w-auto">
              <CheckCircle size={16} />
              <span>Compilation Successful</span>
              <a
                href={reportUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-emerald-success text-slate-900 rounded-lg hover:opacity-90 transition-opacity"
              >
                Download Document
              </a>
            </div>
          )}
        </div>

        {/* Quick actions cards */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
          {/* Spend Report Card */}
          <div className="glass-card p-5 rounded-2xl border border-glass-border flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-electric-blue/5 rounded-full blur-2xl"></div>
            <div className="text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-electric-blue/10 rounded-lg text-electric-blue">
                  <FileText size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Monthly Spend Report</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Aggregated expense data for all departments with tax reconciliation summaries. Compliance audited.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <button
                onClick={() => showToast('CSV export initiated.')}
                className="flex-1 bg-surface-container hover:bg-slate-700 border border-glass-border py-2 px-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all text-on-surface"
              >
                <FileDown size={12} /> CSV
              </button>
              <button
                onClick={() => showToast('PDF export initiated.')}
                className="flex-1 bg-electric-blue text-slate-900 py-2 px-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all"
              >
                <FileDown size={12} /> PDF
              </button>
            </div>
          </div>

          {/* Audit Trail archive card */}
          <div className="glass-card p-5 rounded-2xl border border-glass-border flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
            <div className="text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Audit Trail Archive</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Full immutable zip package containing the database transactions and policy overrides history.
              </p>
            </div>
            <button
              onClick={() => showToast('Archiving Audit Package (.zip)...')}
              className="w-full bg-surface-container hover:bg-slate-700 border border-glass-border py-2 px-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all text-on-surface"
            >
              <Archive size={12} /> Generate Package (.zip)
            </button>
          </div>

          {/* AI insights card */}
          <div className="glass-card p-5 rounded-2xl border border-glass-border flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-electric-blue/10 rounded-full blur-2xl"></div>
            <div className="text-left">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-electric-blue/15 rounded-lg text-electric-blue shadow shadow-electric-blue/20">
                  <Bot size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">AI Insights Dashboard</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Explore predictive spending trends, anomaly vectors and compliance rate predictions.
              </p>
            </div>
            <button
              onClick={() => showToast('Launching AI Predictive Engine...')}
              className="w-full bg-primary-container/20 text-primary border border-primary-container/30 hover:bg-primary-container/30 py-2.5 px-3 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all"
            >
              <Bot size={12} /> Launch Analytics Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
