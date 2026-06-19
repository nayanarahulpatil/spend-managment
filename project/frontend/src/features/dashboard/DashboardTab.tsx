import React, { useState, useEffect } from 'react';
import {
  useGetEmployeeDashboardQuery,
  useGetManagerDashboardQuery,
} from '../../services/api';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  MoreVertical,
  PlusCircle,
  TrendingUp,
  Bot,
  Check,
} from 'lucide-react';

interface DashboardTabProps {
  role: string;
  name: string;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  setActiveTab: (tab: string) => void;
}

export default function DashboardTab({ role, name, showToast, setActiveTab }: DashboardTabProps) {
  const isEmployee = role === 'employee';
  
  // Queries
  const { data: employeeData, isLoading: empLoading, error: empError } = useGetEmployeeDashboardQuery(undefined, { skip: !isEmployee });
  const { data: managerData, isLoading: mgrLoading, error: mgrError } = useGetManagerDashboardQuery(undefined, { skip: isEmployee });

  const [loadingDelay, setLoadingDelay] = useState(true);

  // Simulate premium skeleton loading animation for 1.2 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingDelay(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const isLoading = isEmployee ? empLoading : mgrLoading;
  const hasError = isEmployee ? empError : mgrError;
  const stats = isEmployee ? employeeData?.data : managerData?.data;
  
  const rawSubmissions = stats?.recent_submissions || [];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="h-8 w-64 bg-slate-800 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-850 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-850 rounded-2xl animate-pulse" />
          <div className="h-32 bg-slate-850 rounded-2xl animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <div className="h-72 bg-slate-850 rounded-2xl lg:col-span-1 animate-pulse" />
          <div className="h-72 bg-slate-850 rounded-2xl lg:col-span-3 animate-pulse" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-8 text-center glass-card rounded-2xl border border-ruby-violation/20 text-ruby-violation text-xs font-mono">
        <AlertTriangle size={24} className="mx-auto mb-2 text-ruby-violation" />
        <p>Error loading dashboard metrics. Please try again later.</p>
      </div>
    );
  }

  // Greeting resolved based on roles
  const profileName = name || (['manager', 'finance', 'admin', 'auditor'].includes(role)
    ? 'Julian Vane'
    : 'Alex Rivera');

  const welcomeName = profileName.split(' ')[0];

  const formatStatus = (status: string, violation: boolean) => {
    if (violation && status === 'pending_approval') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ruby-violation/20 text-ruby-violation text-[10px] font-bold border border-ruby-violation/20 uppercase tracking-wide">
          <AlertTriangle size={12} /> Policy Violation
        </span>
      );
    }

    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-success/20 text-emerald-success text-[10px] font-bold border border-emerald-success/20 uppercase tracking-wide">
            <Check size={12} /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ruby-violation/20 text-ruby-violation text-[10px] font-bold border border-ruby-violation/20 uppercase tracking-wide">
            <AlertTriangle size={12} /> Rejected
          </span>
        );
      case 'info_requested':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-pending/20 text-amber-pending text-[10px] font-bold border border-amber-pending/20 uppercase tracking-wide">
            <Clock size={12} /> More Info Needed
          </span>
        );
      case 'pending_approval':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-pending/20 text-amber-pending text-[10px] font-bold border border-amber-pending/20 uppercase tracking-wide">
            <Clock size={12} /> Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h3 className="font-headline-lg text-headline-lg text-on-surface text-3xl font-bold">
          Good Morning, {welcomeName}
        </h3>
        <p className="text-on-surface-variant text-sm">
          Here is your expense summary for the current billing period.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pending Reimbursement or Approvals */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={64} className="text-white" />
          </div>
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-mono tracking-wider">
            {isEmployee ? 'Pending Reimbursement' : 'Pending Approvals Queue'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-3xl font-black text-amber-pending font-mono">
              {isEmployee 
                ? `$${(stats?.total_pending ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : (stats?.pending_approvals ?? 0)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Clock size={14} className="text-amber-pending" />
            <span className="text-xs text-on-surface-variant">
              {isEmployee 
                ? `${stats?.pending_count ?? 0} claims awaiting review` 
                : 'Awaiting manager approval'}
            </span>
          </div>
        </div>

        {/* Approved Spend */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle size={64} className="text-white" />
          </div>
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-mono tracking-wider">
            {isEmployee ? 'Approved This Month' : 'Team Approved Spend'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-3xl font-black text-emerald-success font-mono">
              ${(isEmployee ? (stats?.total_spent ?? 0) : (stats?.team_spent ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <TrendingUp size={14} className="text-emerald-success" />
            <span className="text-xs text-on-surface-variant">
              +8% vs last month
            </span>
          </div>
        </div>

        {/* Active Policy Flags */}
        <div className="glass-card p-6 rounded-2xl flex flex-col gap-2 relative overflow-hidden group border border-ruby-violation/20">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={64} className="text-white" />
          </div>
          <span className="font-label-md text-xs text-on-surface-variant uppercase font-mono tracking-wider">
            {isEmployee ? 'Active Policy Flags' : 'Total Policy Violations'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-headline-xl text-3xl font-black text-ruby-violation font-mono">
              {isEmployee ? (stats?.policy_flags ?? 0) : (stats?.violations_flagged ?? 0)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <AlertTriangle size={14} className="text-ruby-violation" />
            <span className="text-xs text-on-surface-variant">
              Requires immediate action
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Bento Column: AI Insights & Promo */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-2xl border border-electric-blue/30 relative overflow-hidden shadow-lg shadow-electric-blue/5">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-electric-blue to-transparent"></div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-electric-blue" />
              <h4 className="font-label-md text-sm font-bold text-on-surface">AI Insights</h4>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your travel spending is <span className="text-electric-blue font-bold">12% higher</span> than last month. 
            </p>
            <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
              View policy guidelines for hotel bookings to ensure compliance.
            </p>
            <button
              onClick={() => setActiveTab('reporting')}
              className="mt-4 w-full py-2.5 px-4 rounded-xl bg-white/5 border border-glass-border hover:bg-white/10 text-electric-blue text-xs font-bold transition-all"
            >
              View Policy Hub
            </button>
          </div>

          <div className="glass-card rounded-2xl overflow-hidden aspect-square relative border border-glass-border">
            <img 
              className="w-full h-full object-cover opacity-30 mix-blend-luminosity" 
              alt="Premium Visual Graphic"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCt0f8HSt3-lDCXg0sRRHbiZd0EMHYWYS474GTBwwAqYI1y3ppxZ5vl60SXF2C7zMAmPnmercjK_RlfOMvhEu4Hh4zNb3D9o1TN_3jtYOZ7SiktXYox48FiC76ltepoCH8isQ9_eZx8CtTOSyYr6FlxI5oP0E2mgcYjoNXQ1SSJ-2evwk7nZye_CFCOMUWktVc2cmTtWxJBQyOUocekhaxlGmow8--rBps-Nki4Ch7I_FKwktQzryXFKG03Q4EKmElOAavaPZUSJ-nD"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 right-4 text-left">
              <p className="text-[10px] font-mono text-on-surface-variant uppercase tracking-widest leading-none">Enterprise Savings</p>
              <p className="text-base font-bold text-on-surface mt-1.5">Equinox Premium</p>
            </div>
          </div>
        </div>

        {/* Right Table Column: Recent Submissions */}
        <div className="lg:col-span-3">
          <div className="glass-card rounded-2xl overflow-hidden border border-glass-border">
            <div className="p-6 border-b border-glass-border flex justify-between items-center bg-white/5">
              <h3 className="text-xs uppercase font-mono font-bold text-on-surface tracking-wider">
                {isEmployee ? 'My Recent Submissions' : 'Team Recent Submissions'}
              </h3>
              <button 
                onClick={() => setActiveTab(isEmployee ? 'reporting' : 'workflow')} 
                className="text-on-surface-variant hover:text-primary flex items-center gap-1 transition-colors text-xs font-bold"
              >
                <span>View All</span>
                <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="overflow-x-auto min-h-[350px]">
              {loadingDelay ? (
                /* Premium Skeleton Loader */
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-5 gap-4 border-b border-glass-border pb-4">
                    <div className="h-4 bg-slate-800 rounded shimmer col-span-1"></div>
                    <div className="h-4 bg-slate-800 rounded shimmer col-span-1"></div>
                    <div className="h-4 bg-slate-800 rounded shimmer col-span-1"></div>
                    <div className="h-4 bg-slate-800 rounded shimmer col-span-1"></div>
                    <div className="h-4 bg-slate-800 rounded shimmer col-span-1"></div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="grid grid-cols-5 gap-4 items-center h-12">
                        <div className="h-3 bg-slate-800/50 rounded shimmer col-span-1"></div>
                        <div className="h-6 bg-slate-800/50 rounded shimmer col-span-1"></div>
                        <div className="h-3 bg-slate-800/50 rounded shimmer col-span-1"></div>
                        <div className="h-3 bg-slate-800/50 rounded shimmer col-span-1"></div>
                        <div className="h-8 bg-slate-800/50 rounded-full shimmer col-span-1"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : rawSubmissions.length === 0 ? (
                <div className="p-12 text-center text-on-surface-variant text-xs font-mono">
                  No claims submitted. {isEmployee ? 'Click the button below to submit your first expense!' : 'No direct reports have submitted expenses.'}
                </div>
              ) : (
                /* Actual Submissions Table */
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-on-surface-variant uppercase font-mono border-b border-glass-border bg-slate-800/30">
                      {!isEmployee && <th className="px-6 py-4 font-semibold">Employee</th>}
                      <th className="px-6 py-4 font-semibold">Date</th>
                      <th className="px-6 py-4 font-semibold">Description</th>
                      <th className="px-6 py-4 font-semibold">Amount</th>
                      <th className="px-6 py-4 font-semibold">Category</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-glass-border">
                    {rawSubmissions.map((exp: any) => (
                      <tr key={exp.id || exp._id} className="hover:bg-white/5 transition-colors cursor-pointer group text-xs">
                        {!isEmployee && (
                          <td className="px-6 py-4">
                            <div className="font-bold text-on-surface">{exp.userName}</div>
                            <div className="text-[10px] text-on-surface-variant">{exp.department}</div>
                          </td>
                        )}
                        <td className="px-6 py-4 text-on-surface font-mono">
                          {new Date(exp.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-on-surface font-semibold max-w-[180px] truncate">
                          {exp.description}
                        </td>
                        <td className="px-6 py-4 text-on-surface font-mono font-bold">
                          ${(exp.convertedAmount ?? exp.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {exp.currency || 'USD'}
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant uppercase font-mono">
                          {exp.categoryId}
                        </td>
                        <td className="px-6 py-4">
                          {formatStatus(exp.status, exp.policyViolation)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              showToast(`Actions menu clicked for expense ${exp.id || exp._id}`);
                            }}
                            className="p-2 hover:text-primary transition-colors text-on-surface-variant"
                          >
                            <MoreVertical size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      {isEmployee && (
        <button
          onClick={() => setActiveTab('submit')}
          className="fixed bottom-8 right-8 flex items-center gap-2.5 px-6 py-4 bg-electric-blue text-slate-900 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all z-50 group font-bold shadow-electric-blue/20"
        >
          <PlusCircle size={18} />
          <span className="text-xs font-mono uppercase tracking-wider">New Expense</span>
        </button>
      )}
    </div>
  );
}
