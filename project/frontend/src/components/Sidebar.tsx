import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  CheckSquare,
  FileText,
  MessageSquare,
  Users,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: string;
  onLogout: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, role, onLogout }: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 z-40 bg-slate-800/90 dark:bg-slate-800/90 backdrop-blur-2xl border-r border-glass-border w-64 shadow-2xl shrink-0">
      {/* Brand Logo Header */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-electric-blue to-primary flex items-center justify-center text-slate-900 shadow-lg glow-electric">
            <ShieldCheck size={24} className="text-on-primary" />
          </div>
          <div>
            <h1 className="font-headline-lg text-on-surface font-black leading-tight text-[18px]">Equinox</h1>
            <p className="text-on-surface-variant font-label-sm text-[10px] uppercase tracking-widest">Finance Manager</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-2 space-y-1">
        {/* Dashboard / My Expenses */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-secondary-container text-on-secondary-container font-bold translate-x-1 shadow-lg shadow-secondary-container/10'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="font-label-md text-sm">My Expenses</span>
        </button>

        {/* New Expense */}
        <button
          onClick={() => setActiveTab('submit')}
          className={`w-full rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
            activeTab === 'submit'
              ? 'bg-secondary-container text-on-secondary-container font-bold translate-x-1 shadow-lg shadow-secondary-container/10'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
          }`}
        >
          <PlusCircle size={18} />
          <span className="font-label-md text-sm">New Expense</span>
        </button>

        {/* Team Approvals (Manager/Finance/Admin) */}
        {['manager', 'finance', 'admin'].includes(role) && (
          <button
            onClick={() => setActiveTab('workflow')}
            className={`w-full rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
              activeTab === 'workflow'
                ? 'bg-secondary-container text-on-secondary-container font-bold translate-x-1 shadow-lg shadow-secondary-container/10'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
            }`}
          >
            <CheckSquare size={18} />
            <span className="font-label-md text-sm">Team Approvals</span>
          </button>
        )}

        {/* Analytics & Reports (Finance/Auditor/Admin) */}
        {['finance', 'auditor', 'admin'].includes(role) && (
          <button
            onClick={() => setActiveTab('reporting')}
            className={`w-full rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
              activeTab === 'reporting'
                ? 'bg-secondary-container text-on-secondary-container font-bold translate-x-1 shadow-lg shadow-secondary-container/10'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
            }`}
          >
            <FileText size={18} />
            <span className="font-label-md text-sm">Audit & Reports</span>
          </button>
        )}

        {/* User Management (Admin) */}
        {['admin'].includes(role) && (
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
              activeTab === 'users'
                ? 'bg-secondary-container text-on-secondary-container font-bold translate-x-1 shadow-lg shadow-secondary-container/10'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
            }`}
          >
            <Users size={18} />
            <span className="font-label-md text-sm">User Management</span>
          </button>
        )}

        {/* AI Assistant */}
        <button
          onClick={() => setActiveTab('ai')}
          className={`w-full rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
            activeTab === 'ai'
              ? 'bg-secondary-container text-on-secondary-container font-bold translate-x-1 shadow-lg shadow-secondary-container/10'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
          }`}
        >
          <MessageSquare size={18} />
          <span className="font-label-md text-sm">AI Assistant</span>
        </button>

        {/* Notifications */}
        <button
          onClick={() => setActiveTab('notifications')}
          className={`w-full rounded-lg mx-2 my-1 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${
            activeTab === 'notifications'
              ? 'bg-secondary-container text-on-secondary-container font-bold translate-x-1 shadow-lg shadow-secondary-container/10'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50'
          }`}
        >
          <Bell size={18} />
          <span className="font-label-md text-sm">Notifications</span>
        </button>
      </nav>

      {/* Footer Details & Logout */}
      <div className="mt-auto px-4 border-t border-glass-border pt-6 space-y-4">
        {/* User card info */}
        <div className="p-3.5 rounded-xl bg-surface-container-high border border-glass-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden border border-primary/20 shrink-0">
            <img
              alt="User"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLc-UDPkyP1zq2TYxauePM2kLAR1toZe849bqmlqlfgPR7ZVs_-uhHWc89McmrvEQNhfUyKB1XDSdOkEjU1xnDV_jv25j6Jx4kVJ82ZexKPdbSRrrWqjGRBesh1baY1G7QgRuEvoiUV_GNFCWgIJ38LqhzjLNZGBjP4O9E5e9LVgDAvkF_2iBu62vHoYVK6BUgiyU4eIi1gzgz8Tr8z-iG9d6rWt-dToXPTr7its19RXZOWkK2vDpisPR-mxPX7KjfOSgRoLLd9xa1"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-on-surface truncate">Alex Rivera</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider truncate">{role}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-ruby-violation hover:bg-ruby-violation/10 transition-all"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
