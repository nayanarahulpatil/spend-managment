import React, { useState } from 'react';
import { Bell, Bot, Search } from 'lucide-react';

interface HeaderProps {
  title: string;
  role: string;
  name: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({
  title,
  role,
  name,
  onSearch,
  searchPlaceholder = 'Search...',
  activeTab,
  setActiveTab,
}: HeaderProps) {
  const [aiEnabled, setAiEnabled] = useState(true);

  const toggleAi = () => {
    setAiEnabled(!aiEnabled);
    setActiveTab(aiEnabled ? 'dashboard' : 'ai');
  };

  const getProfileImage = () => {
    if (name) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff&rounded=true`;
    }
    if (role === 'manager' || role === 'finance' || role === 'admin') {
      return 'https://lh3.googleusercontent.com/aida-public/AB6AXuBliyKkF_R0yJhw0Uengjg4VFXUX_CrdrWaNmtjmaQKJlH9LSOHt1tZIDKh60JqSMiFcb5oKzj1-92-gB3756xyD2rgTeqFd7B4e9dsDXSazk_A0qSW6NFmst80rUSNVfwXXyq-RcXwSSMIdZIUijknTHPj9vgyhJ0jmgC7mjEOECmusq3u_Yhzypq3yp4zv-QO-GnEt6Y9ZGe9hWr7IEUHwlYfscq_RM7FVDF-pnq_RGN7npY82RrIrLLtILk33lR-pPT26vy1Z1MF';
    }
    return 'https://lh3.googleusercontent.com/aida-public/AB6AXuDa2Zm6bW_B5bp9pCZR_itKAnP8I6nF9RSd4i-IQf3Oc8C0pabmvfcT_NwwtGW6dq9aMn7zh-0Z8kUnvM7oXT0HzIoZlNkGAG2DPDXwEVt0bBEunzjDk77LnXQHkDp9oAvSqeGs0j6Z_W8RKvowSXHiKgybKj-oqZk8lh8KAXHgAsMWN68z6cJ8TxYbdepbN43qMgx4y1JypVvsbzks9g54EIQt6Mah5a2CVybkOk0jYRTWJiGtr47pfxmvrgM-nc5RhW7pJKBz_sxL';
  };

  const getProfileName = () => {
    if (name) return name;
    if (role === 'manager' || role === 'finance' || role === 'admin') {
      return 'Julian Vane';
    }
    return 'Alex Rivera';
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-glass-border h-16 shadow-sm flex items-center justify-between px-6 max-w-container-max mx-auto w-full">
      <div className="flex items-center gap-8">
        <h2 className="font-headline-md text-headline-md font-bold text-electric-blue">{title}</h2>
        
        {/* Search input (if placeholder is provided) */}
        {onSearch && (
          <div className="relative hidden md:block w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant w-4 h-4" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-slate-800/50 border border-glass-border rounded-full py-1.5 pl-10 pr-4 text-xs focus:ring-2 focus:ring-electric-blue outline-none transition-all text-white"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* AI Assistant Toggle Badge */}
        <div className="flex items-center gap-2 bg-slate-800 border border-glass-border rounded-full px-3 py-1.5">
          <Bot size={16} className="text-electric-blue" />
          <span className="font-label-sm text-xs text-on-surface">AI Agent</span>
          <button
            onClick={toggleAi}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
              aiEnabled ? 'bg-secondary-container' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                aiEnabled ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Notifications Button */}
        <button
          onClick={() => setActiveTab('notifications')}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/5 text-on-surface transition-colors relative"
        >
          <Bell size={18} />
          {/* Active indicator */}
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-electric-blue animate-pulse" />
        </button>

        <div className="h-8 w-px bg-glass-border mx-1"></div>

        {/* Profile User Dropdown */}
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden border border-glass-border">
            <img
              alt="User profile"
              className="w-full h-full object-cover"
              src={getProfileImage()}
            />
          </div>
          <div className="text-left hidden lg:block">
            <p className="font-label-md text-xs text-on-surface group-hover:text-primary transition-colors">
              {getProfileName()}
            </p>
            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider leading-none">
              {role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
