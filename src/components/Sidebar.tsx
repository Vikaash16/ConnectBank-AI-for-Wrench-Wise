/**
 * ConnectBank AI - Main Navigation Sidebar
 */

import React from 'react';
import {
  LayoutDashboard,
  Bot,
  CreditCard,
  ShieldAlert,
  Calculator,
  FileCheck2,
  Activity,
  Bell,
  Settings,
  Shield,
  Layers,
} from 'lucide-react';

export type ActiveTab =
  | 'overview'
  | 'assistant'
  | 'accounts'
  | 'fraud'
  | 'loans'
  | 'kyc'
  | 'monitor'
  | 'notifications'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadCount: number;
  fraudAlertCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  fraudAlertCount,
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number; badgeColor?: string }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'assistant', label: 'AI Assistant', icon: <Bot className="w-5 h-5 text-blue-400" /> },
    { id: 'accounts', label: 'Accounts & Txns', icon: <CreditCard className="w-5 h-5" /> },
    {
      id: 'fraud',
      label: 'Fraud & Risk',
      icon: <ShieldAlert className="w-5 h-5" />,
      badge: fraudAlertCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'loans', label: 'Loans & EMI', icon: <Calculator className="w-5 h-5" /> },
    { id: 'kyc', label: 'KYC & Compliance', icon: <FileCheck2 className="w-5 h-5" /> },
    { id: 'monitor', label: 'Agent Monitor', icon: <Activity className="w-5 h-5" /> },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <Bell className="w-5 h-5" />,
      badge: unreadCount,
      badgeColor: 'bg-blue-500 text-white',
    },
    { id: 'settings', label: 'System & Status', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="w-64 bg-[#0A192F] text-slate-200 flex flex-col border-r border-slate-800 shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
            ConnectBank <span className="text-xs bg-blue-500/20 text-cyan-300 font-semibold px-1.5 py-0.5 rounded border border-cyan-500/30">AI</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">Multi-Agent Banking</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Banking Modules
        </div>
        {navItems.slice(0, 6).map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Platform & Observability
        </div>
        {navItems.slice(6).map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Layer Architecture Badge */}
      <div className="p-3 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
          <Layers className="w-4 h-4" />
          <span>9-Layer Architecture</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Supervisor Agent with 5 specialized sub-agents, MCP tool layer, and local policy RAG.
        </p>
      </div>
    </aside>
  );
};
