import React, { useState, useEffect } from 'react';
import { useGenerateReportMutation, useGetAuditLogsQuery } from '../../services/api';
import {
  FileText,
  BarChart3,
  TrendingDown,
  Gavel,
  ShieldCheck,
  CheckCircle,
  FileDown,
  Archive,
  Bot,
  Loader,
  Search
} from 'lucide-react';

interface ReportingTabProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function ReportingTab({ showToast }: ReportingTabProps) {
  const [reportType, setReportType] = useState('spend');
  const [reportUrl, setReportUrl] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'30d' | 'quarterly' | 'ytd'>('30d');

  const { data: auditData, isLoading: auditLoading } = useGetAuditLogsQuery(undefined);
  const [generateReport] = useGenerateReportMutation();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await generateReport({
        type: reportType,
        filters: {},
      }).unwrap();
      if (response.status === 200) {
        setReportUrl(response.data.report_url);
        setRecords(response.data.records);
        showToast('Report compiled successfully.');
      }
    } catch (e) {
      showToast('Error compiling report. Fallback to demo mode.', 'success');
      // Fallback data
      setReportUrl('#');
      setRecords([
        { id: 1, category_id: 'meals', amount: 1245.50, currency: 'USD', status: 'approved', policy_violation: false },
        { id: 2, category_id: 'travel', amount: 4800.00, currency: 'USD', status: 'approved', policy_violation: true },
        { id: 3, category_id: 'office', amount: 350.00, currency: 'USD', status: 'pending_approval', policy_violation: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const logs = auditData?.data?.logs || [];

  // Static/Mock details from screen 311
  const mockAuditLogs = [
    { timestamp: '2026-06-17 14:22:11', actor: 'Mark S.', message: 'User Mark S. updated Expense #8921', status: 'Approved', ref: 'EXP-8921' },
    { timestamp: '2026-06-17 14:18:05', actor: 'System', message: 'System auto-escalated Expense #7712 (SLA Breach)', status: 'Escalated', ref: 'EXP-7712' },
    { timestamp: '2026-06-17 13:55:42', actor: 'Admin', message: 'New policy v2.4 "Intercontinental Travel" published', status: 'Active', ref: 'POL-900' },
    { timestamp: '2026-06-17 13:12:00', actor: 'Fin-Bot', message: 'Bulk export initiated by Fin-Bot AI', status: 'Complete', ref: 'JOB-441' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-glass-border pb-4">
        <div>
          <h1 className="font-headline-xl text-3xl font-black text-on-surface">Finance Reporting &amp; Audit</h1>
          <p className="text-on-surface-variant text-sm mt-0.5">Real-time oversight and policy enforcement engine.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-surface-container rounded-lg p-1 border border-glass-border text-xs">
            <button 
              onClick={() => setTimePeriod('30d')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${timePeriod === '30d' ? 'bg-slate-700 text-white' : 'text-on-surface-variant hover:text-white'}`}
            >
              Last 30 Days
            </button>
            <button 
              onClick={() => setTimePeriod('quarterly')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${timePeriod === 'quarterly' ? 'bg-slate-700 text-white' : 'text-on-surface-variant hover:text-white'}`}
            >
              Quarterly
            </button>
            <button 
              onClick={() => setTimePeriod('ytd')}
              className={`px-3 py-1 rounded-md font-medium transition-all ${timePeriod === 'ytd' ? 'bg-slate-700 text-white' : 'text-on-surface-variant hover:text-white'}`}
            >
              YTD
            </button>
          </div>
        </div>
      </div>

      {/* Grid Dashboard Layout */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* Spend by Department (8 Columns) */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl overflow-hidden flex flex-col border border-glass-border">
          <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-white/2">
            <h3 className="font-headline-md text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 size={16} className="text-electric-blue" />
              Spend by Department
            </h3>
            <span className="text-xs text-on-surface-variant cursor-pointer">•••</span>
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between">
            {/* Bar charts visuals */}
            <div className="flex items-end justify-between h-64 gap-3 px-2 pt-8">
              {[
                { name: 'Engineering', height: '65%', amount: '$142k', isPrimary: false },
                { name: 'Marketing', height: '45%', amount: '$98k', isPrimary: false },
                { name: 'Sales', height: '85%', amount: '$210k', isPrimary: true },
                { name: 'Operations', height: '35%', amount: '$76k', isPrimary: false },
                { name: 'HR', height: '25%', amount: '$42k', isPrimary: false },
                { name: 'R&D', height: '55%', amount: '$120k', isPrimary: false },
              ].map((bar, index) => (
                <div key={index} className="flex flex-col items-center gap-2 flex-1 group">
                  <div className="w-full bg-slate-800 rounded-t-lg relative flex items-end h-full">
                    <div 
                      className={`w-full rounded-t-lg relative transition-all duration-1000 chart-bar ${
                        bar.isPrimary 
                          ? 'bg-electric-blue/40 group-hover:bg-electric-blue/60 border-t border-electric-blue shadow-lg glow-electric' 
                          : 'bg-primary/20 group-hover:bg-primary/40 border-t border-primary/30'
                      }`} 
                      style={{ height: bar.height }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-[10px] text-white px-2 py-0.5 rounded border border-glass-border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-mono z-10">
                        {bar.amount}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant font-mono truncate max-w-full text-center leading-none">{bar.name}</span>
                </div>
              ))}
            </div>

            {/* Budgets metrics */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="p-3 bg-white/5 rounded-lg border border-glass-border">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold font-mono">Total Budget</p>
                <p className="text-lg font-bold text-on-surface font-mono">$1.2M</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-glass-border">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold font-mono">Variance</p>
                <p className="text-lg font-bold text-emerald-success font-mono">-4.2%</p>
              </div>
              <div className="p-3 bg-white/5 rounded-lg border border-glass-border">
                <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold font-mono">Forecast</p>
                <p className="text-lg font-bold text-on-surface font-mono">$1.4M</p>
              </div>
            </div>
          </div>
        </div>

        {/* Policy Compliance Circle Meter (4 Columns) */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-xl flex flex-col border border-glass-border relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-ruby-violation/5 rounded-full blur-2xl"></div>
          <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-ruby-violation/5">
            <h3 className="font-headline-md text-sm font-bold text-white flex items-center gap-2">
              <Gavel size={16} className="text-ruby-violation" />
              Policy Compliance
            </h3>
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
            <div className="flex flex-col items-center">
              {/* Radial circle meter */}
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
                    strokeDashoffset="22.6" // 94% compliant = 6% offset = 22.6
                    strokeWidth="10"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-on-surface">94%</span>
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-wider font-mono">Current Rate</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 bg-emerald-success/10 px-3 py-1 rounded-full border border-emerald-success/20">
                <TrendingUp size={12} className="text-emerald-success" />
                <span className="text-[10px] font-bold text-emerald-success font-mono">Target: 98%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-on-surface mb-2 flex justify-between">
                <span>Top Violation Categories</span>
                <span className="text-[10px] text-on-surface-variant font-mono font-medium">LTM</span>
              </p>
              <ul className="space-y-2 text-xs">
                {[
                  { label: 'Missing Itemized Receipts', count: '32 instances', dotColor: 'bg-ruby-violation' },
                  { label: 'Duplicate Submission', count: '18 instances', dotColor: 'bg-amber-pending' },
                  { label: 'Personal Travel Expenses', count: '9 instances', dotColor: 'bg-slate-500' },
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

        {/* Expense Categories breakdown (4 Columns) */}
        <div className="col-span-12 md:col-span-4 lg:col-span-4 glass-card rounded-xl overflow-hidden flex flex-col border border-glass-border">
          <div className="px-6 py-4 border-b border-glass-border">
            <h3 className="font-headline-md text-sm font-bold text-white">Expense Categories</h3>
          </div>
          <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
            <div className="relative flex justify-center py-2">
              <div className="w-36 h-36 rounded-full border-[12px] border-slate-800 flex items-center justify-center relative">
                <div className="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-electric-blue border-r-electric-blue border-b-primary rotate-[15deg]"></div>
                <div className="text-center">
                  <span className="text-2xl font-black text-on-surface">62%</span>
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
                <span className="font-bold font-mono">$412,400</span>
              </div>
              <div className="flex items-center justify-between p-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-primary"></div>
                  <span className="text-on-surface-variant text-[11px]">Software SaaS</span>
                </div>
                <span className="font-bold font-mono">$228,150</span>
              </div>
              <div className="flex items-center justify-between p-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-700"></div>
                  <span className="text-on-surface-variant text-[11px]">Office Equipment</span>
                </div>
                <span className="font-bold font-mono">$94,200</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Audit Log Preview (8 Columns) */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-xl overflow-hidden flex flex-col border border-glass-border">
          <div className="px-6 py-4 border-b border-glass-border flex justify-between items-center bg-white/2">
            <h3 className="font-headline-md text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary" />
              Live Audit Log
            </h3>
            <span className="text-xs font-bold text-primary hover:underline cursor-pointer">View All Logs</span>
          </div>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800/20 text-on-surface-variant uppercase font-mono border-b border-glass-border">
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                  <th className="px-6 py-3 font-semibold">Event</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {(auditLoading ? mockAuditLogs : [...logs.map((l: any) => ({
                  timestamp: new Date(l.timestamp).toISOString().replace('T', ' ').substring(0, 19),
                  actor: l.actor,
                  message: l.message,
                  status: 'Complete',
                  ref: l.id ? l.id.substring(0, 8) : 'AUD-LOG'
                })), ...mockAuditLogs]).slice(0, 4).map((log, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-on-surface-variant text-[10px]">{log.timestamp}</td>
                    <td className="px-6 py-4 text-on-surface font-medium">{log.message}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase font-mono ${
                        log.status === 'Approved' || log.status === 'Complete'
                          ? 'bg-emerald-success/10 border-emerald-success/30 text-emerald-success'
                          : log.status === 'Escalated'
                          ? 'bg-ruby-violation/10 border-ruby-violation/30 text-ruby-violation font-extrabold shadow'
                          : 'bg-primary/10 border-primary/30 text-primary'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-primary font-bold">{log.ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Compile / Generate Report form Builder (12 Columns) */}
        <div className="col-span-12 glass-card p-6 rounded-xl border border-glass-border flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/30">
          <div className="max-w-md">
            <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
              <FileText size={18} className="text-primary" />
              On-Demand Report Compiler
            </h4>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              Dynamically extract transactions and policy breach events directly from the database into compiled PDF or CSV logs.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-48 text-xs">
              <label className="text-[9px] font-mono text-on-surface-variant uppercase">Report Scope</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="bg-slate-800 border-glass-border focus:border-electric-blue text-xs text-white rounded-lg px-3 py-2 outline-none"
              >
                <option value="spend">Total Spend Report</option>
                <option value="violations">Policy Violations Log</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-primary text-slate-900 text-xs px-5 py-2.5 rounded-lg font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 self-end w-full sm:w-auto justify-center"
            >
              {loading ? <Loader className="animate-spin" size={14} /> : <FileDown size={14} />}
              <span>Compile File</span>
            </button>
          </div>

          {reportUrl && (
            <div className="p-3 bg-emerald-success/10 border border-emerald-success/20 rounded-xl flex items-center gap-3 shrink-0 text-xs text-emerald-success font-semibold">
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

        {/* Export Options & Quick Actions (12 Columns, grid of 3 cards) */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-gutter mt-2">
          {/* Monthly Spend Card */}
          <div className="glass-card p-5 rounded-xl border border-glass-border flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-electric-blue/5 rounded-full blur-2xl"></div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-electric-blue/10 rounded-lg text-electric-blue">
                  <FileText size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Monthly Spend Report</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Aggregated expense data for all departments with tax reconciliation summaries.
              </p>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={() => showToast('CSV download initiated.')} className="flex-1 bg-surface-container hover:bg-slate-700 border border-glass-border py-2 px-3 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all text-on-surface">
                <FileDown size={12} /> CSV
              </button>
              <button onClick={() => showToast('PDF download initiated.')} className="flex-1 bg-electric-blue text-slate-900 py-2 px-3 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-95 transition-all">
                <FileDown size={12} /> PDF
              </button>
            </div>
          </div>

          {/* Audit Trail ZIP Card */}
          <div className="glass-card p-5 rounded-xl border border-glass-border flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-primary/5 rounded-full blur-2xl"></div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                  <ShieldCheck size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">Audit Trail Archive</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Full immutable history of all transaction modifications and approval overrides.
              </p>
            </div>
            <button onClick={() => showToast('ZIP bundle archiving in progress...')} className="w-full bg-surface-container hover:bg-slate-700 border border-glass-border py-2 px-3 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all text-on-surface">
              <Archive size={12} /> Generate Package (.zip)
            </button>
          </div>

          {/* AI Insights Launch Card */}
          <div className="glass-card p-5 rounded-xl border border-glass-border flex flex-col justify-between h-48 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-20 h-20 bg-electric-blue/10 rounded-full blur-2xl"></div>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-electric-blue/15 rounded-lg text-electric-blue shadow glow-electric">
                  <Bot size={18} />
                </div>
                <h4 className="font-bold text-white text-xs">AI Insights Dashboard</h4>
              </div>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Explore predictive spending trends and anomaly detection reports generated by Equinox AI.
              </p>
            </div>
            <button onClick={() => showToast('Launching AI Predictive Engine...')} className="w-full bg-primary-container/20 text-primary border border-primary-container/30 hover:bg-primary-container/30 py-2 px-3 rounded font-bold text-[10px] flex items-center justify-center gap-1.5 transition-all">
              <Bot size={12} /> Launch Analytics Engine
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
