import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, setCredentials, clearCredentials } from './store';

// Core Layout Components
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Feature Views
import LoginView from './features/auth/LoginView';
import DashboardTab from './features/dashboard/DashboardTab';
import SubmitExpenseTab from './features/expenses/SubmitExpenseTab';
import WorkflowTab from './features/workflow/WorkflowTab';
import ReportingTab from './features/reporting/ReportingTab';
import UsersTab from './features/users/UsersTab';
import AiTab from './features/ai/AiTab';
import NotificationsTab from './features/notifications/NotificationsTab';

// Icons
import { CheckCircle, XCircle } from 'lucide-react';

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, role } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  if (!isAuthenticated) {
    return (
      <LoginView
        onLoginSuccess={(creds) => {
          dispatch(setCredentials(creds));
          showToast('Logged in successfully!');
        }}
      />
    );
  }

  const handleLogout = () => {
    dispatch(clearCredentials());
    showToast('Logged out successfully.');
  };

  // Helper to resolve page header title
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Equinox Dashboard';
      case 'submit':
        return 'New Reimbursement';
      case 'workflow':
        return 'Approvals Queue';
      case 'reporting':
        return 'Reporting & Audit';
      case 'users':
        return 'User Management';
      case 'ai':
        return 'AI Assistant Hub';
      case 'notifications':
        return 'Notifications';
      default:
        return 'Equinox Finance';
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 border transition-all duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-success/20 border-emerald-success text-emerald-success'
              : 'bg-ruby-violation/20 border-ruby-violation text-ruby-violation'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation Panel */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role || 'employee'}
        onLogout={handleLogout}
      />

      {/* Main Screen Layout Container */}
      <div className="flex-1 flex flex-col md:ml-64 min-h-screen overflow-hidden">
        {/* Sticky Header Panel */}
        <Header
          title={getPageTitle()}
          role={role || 'employee'}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onSearch={activeTab === 'workflow' ? (q) => console.log('Searching queue:', q) : undefined}
          searchPlaceholder="Search approvals queue..."
        />

        {/* Tab Views Coordinator */}
        <main className="flex-1 p-8 bg-background overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardTab
              role={role || 'employee'}
              showToast={showToast}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'submit' && (
            <SubmitExpenseTab
              showToast={showToast}
            />
          )}

          {activeTab === 'workflow' && (
            <WorkflowTab
              showToast={showToast}
              role={role || 'employee'}
            />
          )}

          {activeTab === 'reporting' && (
            <ReportingTab
              showToast={showToast}
            />
          )}

          {activeTab === 'users' && (
            <UsersTab
              showToast={showToast}
            />
          )}

          {activeTab === 'ai' && (
            <AiTab
              role={role || 'employee'}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsTab
              showToast={showToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
