/**
 * ConnectBank AI - Top Header Bar
 */

import React from 'react';
import { Customer } from '../types/banking.ts';
import { CustomerSwitcher } from './CustomerSwitcher.tsx';
import { Bell, Sparkles, Cpu, AlertTriangle, ShieldCheck, UserPlus, KeyRound } from 'lucide-react';
import { ActiveTab } from './Sidebar.tsx';

interface HeaderProps {
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (id: string) => void;
  unreadCount: number;
  onTabChange: (tab: ActiveTab) => void;
  aiMode: 'live_gemini' | 'deterministic_fallback';
  onOpenCreateUser: () => void;
  onOpenLogin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  unreadCount,
  onTabChange,
  aiMode,
  onOpenCreateUser,
  onOpenLogin,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Simulation Notice & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Core Banking Sandbox Active</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Simulated INR Data • Safe Demo</span>
        </div>
      </div>

      {/* Right: AI Gateway status, Notifications, Persona Switcher */}
      <div className="flex items-center gap-3">
        {/* AI Engine Status Pill */}
        <div
          onClick={() => onTabChange('settings')}
          className="cursor-pointer hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all hover:opacity-90"
          style={{
            backgroundColor: aiMode === 'live_gemini' ? '#EFF6FF' : '#F1F5F9',
            borderColor: aiMode === 'live_gemini' ? '#BFDBFE' : '#CBD5E1',
            color: aiMode === 'live_gemini' ? '#1D4ED8' : '#475569',
          }}
          title="Click to view System Status & AI Gateway telemetry"
        >
          {aiMode === 'live_gemini' ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Gemini 3.8 Flash (Live)</span>
            </>
          ) : (
            <>
              <Cpu className="w-3.5 h-3.5 text-slate-600" />
              <span>Deterministic AI Engine</span>
            </>
          )}
        </div>

        {/* Notifications Icon */}
        <button
          onClick={() => onTabChange('notifications')}
          className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Create User Button */}
        <button
          onClick={onOpenCreateUser}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          title="Create new customer user & credentials in database"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Create User</span>
        </button>

        {/* Customer Persona Switcher */}
        <CustomerSwitcher
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={onSelectCustomer}
          onOpenCreateUser={onOpenCreateUser}
          onOpenLogin={onOpenLogin}
        />
      </div>
    </header>
  );
};
