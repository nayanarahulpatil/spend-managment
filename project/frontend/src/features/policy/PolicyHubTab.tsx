import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  HelpCircle, 
  AlertTriangle, 
  FileText, 
  Clock, 
  Coffee, 
  Plane, 
  Users, 
  HardDrive,
  CheckCircle,
  TrendingUp,
  Compass
} from 'lucide-react';

interface PolicyHubTabProps {
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export default function PolicyHubTab({ showToast }: PolicyHubTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const policies = [
    {
      id: 'p-meals',
      title: 'Meals & Entertainment Cap',
      category: 'limits',
      icon: <Coffee className="text-amber-pending w-5 h-5" />,
      limit: '$50.00 / Day',
      details: 'Individual meal limit is capped at $50.00 daily. Special coffee/breakfast sub-limit for Marketing (Rule MKT-22) is capped at $15.00 per event.',
      highlight: 'Exceeding flags immediate policy violation.'
    },
    {
      id: 'p-travel',
      title: 'Business Travel Allowance',
      category: 'limits',
      icon: <Plane className="text-electric-blue w-5 h-5" />,
      limit: '$500.00 / Claim',
      details: 'Flights, accommodations, and transit claims. Lodging must align with preferred partner hotel rates.',
      highlight: 'Auto-flags if single claim exceeds limit.'
    },
    {
      id: 'p-relations',
      title: 'Client Relations & Entertainment',
      category: 'limits',
      icon: <Users className="text-primary w-5 h-5" />,
      limit: '$150.00 / Claim',
      details: 'Covers client dinners, events, and business hosting. Requires list of attendees in justification comments.',
      highlight: 'Requires manager + finance dual-approval.'
    },
    {
      id: 'p-office',
      title: 'Office Supplies & Hardware',
      category: 'limits',
      icon: <HardDrive className="text-emerald-success w-5 h-5" />,
      limit: '$200.00 / Claim',
      details: 'Local desk equipment, software subscriptions, and peripheral devices needed for daily engineering or operational tasks.',
      highlight: 'Single-tier manager approval.'
    },
    {
      id: 'p-receipt',
      title: 'Receipt Mandate Threshold (EXP-07)',
      category: 'compliance',
      icon: <FileText className="text-electric-blue w-5 h-5" />,
      limit: '> $25.00',
      details: 'All expense report submissions exceeding $25.00 USD must be backed by a clear, OCR-scannable receipt image.',
      highlight: 'Required for submission checkout.'
    },
    {
      id: 'p-duplicate',
      title: 'Duplicate Validation (F-07)',
      category: 'compliance',
      icon: <AlertTriangle className="text-ruby-violation w-5 h-5" />,
      limit: 'Strict Block',
      details: 'The platform compares cryptographic file hashes on receipt uploads to block duplicate reimbursement submissions.',
      highlight: 'Returns 409 Conflict error on duplicate upload.'
    },
    {
      id: 'p-sla',
      title: 'Approval Queue SLA Escalation (F-11)',
      category: 'workflow',
      icon: <Clock className="text-amber-pending w-5 h-5" />,
      limit: '48 Hour SLA',
      details: 'If a pending expense is not approved or rejected by the assigned manager within 48 hours, it auto-escalates to the secondary tier.',
      highlight: 'Sends email + push notifications to next-in-line.'
    }
  ];

  const departmentCostCenters = [
    { department: 'Finance', costCenters: ['CC-101', 'CC-99'], status: 'Active' },
    { department: 'Engineering', costCenters: ['CC-101', 'PD-102'], status: 'Active' },
    { department: 'Sales', costCenters: ['CC-103', 'GS-505'], status: 'Active' },
    { department: 'Marketing', costCenters: ['CC-102', 'MKT-400'], status: 'Active' },
    { department: 'Compliance', costCenters: ['CC-101'], status: 'Active' },
    { department: 'HR', costCenters: ['CC-101'], status: 'Active' },
    { department: 'Executive Operations', costCenters: ['CC-99'], status: 'Active' }
  ];

  // Filtering Logic
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          policy.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || policy.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Panel */}
      <header className="flex flex-col gap-1 border-b border-glass-border pb-4">
        <h2 className="font-headline-lg text-headline-lg text-on-surface text-2xl font-bold">Policy & Compliance Hub</h2>
        <p className="font-body-md text-on-surface-variant text-sm mt-0.5">Reference manual for enterprise thresholds, cost-center rules, and audit configurations.</p>
      </header>

      {/* Quick Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
          <input
            type="text"
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-glass-border rounded-full py-2 pl-10 pr-4 text-xs focus:ring-2 focus:ring-electric-blue outline-none transition-all text-white"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1">
          {['all', 'limits', 'compliance', 'workflow'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all shrink-0 ${
                activeFilter === filter
                  ? 'bg-electric-blue text-slate-900 shadow-md font-bold'
                  : 'bg-slate-850 hover:bg-slate-800 text-on-surface-variant hover:text-white border border-glass-border'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Policies */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPolicies.map((policy) => (
          <div 
            key={policy.id} 
            className="glass-card p-6 rounded-2xl border border-glass-border flex flex-col justify-between hover:scale-[1.01] transition-transform duration-300"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-glass-border">
                  {policy.icon}
                </div>
                <span className="text-xs font-mono font-bold bg-white/5 border border-glass-border px-2.5 py-1 rounded text-primary">
                  {policy.limit}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2">{policy.title}</h3>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-4">{policy.details}</p>
            </div>
            
            <div className="mt-4 pt-4 border-t border-glass-border flex items-center gap-2 text-[10px] font-semibold text-amber-pending">
              <Compass size={12} className="shrink-0" />
              <span className="truncate">{policy.highlight}</span>
            </div>
          </div>
        ))}

        {filteredPolicies.length === 0 && (
          <div className="col-span-full py-12 text-center text-on-surface-variant font-mono text-xs">
            No matching policy rules found. Try adjusting your search query.
          </div>
        )}
      </section>

      {/* Bottom Section: Cost Center Mapping & SLA Workflow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Cost Center Directory */}
        <section className="lg:col-span-7 glass-card rounded-2xl overflow-hidden border border-glass-border">
          <div className="p-6 border-b border-glass-border bg-white/5 flex justify-between items-center">
            <h3 className="text-xs uppercase font-mono font-bold text-on-surface tracking-wider">Department Cost Centers</h3>
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[8px] font-bold">USR-06 COMPLIANT</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-on-surface-variant uppercase font-mono border-b border-glass-border bg-slate-850/50">
                  <th className="px-6 py-3.5 font-semibold">Department</th>
                  <th className="px-6 py-3.5 font-semibold">Valid Cost Centers</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Routing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border text-xs">
                {departmentCostCenters.map((dept, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-white">{dept.department}</td>
                    <td className="px-6 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {dept.costCenters.map((cc) => (
                          <span key={cc} className="px-2 py-0.5 rounded bg-slate-800 text-on-surface-variant border border-glass-border font-mono text-[10px]">
                            {cc}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-success/20 text-emerald-success text-[10px] font-bold border border-emerald-success/20 uppercase">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Dynamic Workflow Timeline callout */}
        <section className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-glass-border space-y-4">
            <h3 className="text-xs uppercase font-mono font-bold text-on-surface tracking-wider pb-2 border-b border-glass-border">
              Escalation Chain Diagram
            </h3>

            <div className="space-y-6 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-glass-border">
              {/* Step 1 */}
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-6 h-6 rounded-full bg-electric-blue border-4 border-slate-900 flex items-center justify-center shrink-0"></div>
                <div>
                  <h4 className="text-xs font-bold text-white">1. Submission & Policy Scan</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
                    Real-time OCR check runs. Flags warnings or duplicate hashes immediately.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-6 h-6 rounded-full bg-amber-pending border-4 border-slate-900 flex items-center justify-center shrink-0"></div>
                <div>
                  <h4 className="text-xs font-bold text-white">2. Direct Manager Review (48h SLA)</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
                    Assigned manager evaluates claim. If action is missed, SLA triggers escalation.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-6 h-6 rounded-full bg-primary border-4 border-slate-900 flex items-center justify-center shrink-0"></div>
                <div>
                  <h4 className="text-xs font-bold text-white">3. Finance Audit Clearance</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
                    Audits receipt attachment validity, VAT calculations, and cost-center allocation.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 items-start relative z-10">
                <div className="w-6 h-6 rounded-full bg-emerald-success border-4 border-slate-900 flex items-center justify-center shrink-0"></div>
                <div>
                  <h4 className="text-xs font-bold text-white">4. Reimbursement Processing</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed mt-0.5">
                    Approved claim queued for batch payment in the next weekly billing cycle.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick SLA compliance alert */}
          <div className="glass-card p-5 rounded-2xl border border-amber-pending/20 bg-amber-pending/5 flex gap-3 text-xs">
            <Clock size={16} className="text-amber-pending shrink-0 mt-0.5 animate-pulse" />
            <div>
              <p className="font-bold text-white mb-1">Weekly Payment Runs</p>
              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                All approved claims cleared by Finance before Thursday 5:00 PM EST are dispatched in Friday's disbursement batch.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
