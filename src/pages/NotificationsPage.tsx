/**
 * ConnectBank AI - Notifications & Customer Communications
 */

import React, { useState, useEffect } from 'react';
import { Customer, NotificationItem } from '../types/banking.ts';
import { apiClient } from '../services/apiClient.ts';
import { ActiveTab } from '../components/Sidebar.tsx';
import {
  Bell,
  ShieldAlert,
  CreditCard,
  FileCheck2,
  CheckCircle2,
  CheckCheck,
  AlertTriangle,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface NotificationsPageProps {
  customer: Customer;
  onNavigate: (tab: ActiveTab) => void;
  onRefreshUnread: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  customer,
  onNavigate,
  onRefreshUnread,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadNotifications();
  }, [customer.id]);

  const loadNotifications = async () => {
    const list = await apiClient.getNotifications(customer.id);
    setNotifications(list);
  };

  const handleMarkAsRead = async (id: string) => {
    await apiClient.markNotificationRead(id, customer.id);
    await loadNotifications();
    onRefreshUnread();
  };

  const handleMarkAllRead = async () => {
    await apiClient.markAllNotificationsRead(customer.id);
    await loadNotifications();
    onRefreshUnread();
  };

  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'fraud':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      case 'compliance':
        return <FileCheck2 className="w-5 h-5 text-amber-600" />;
      case 'loan':
      case 'account':
        return <CreditCard className="w-5 h-5 text-blue-600" />;
      default:
        return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Communications & Alerts
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Real-time security advisories, transactional notices, and multi-channel messages.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {['all', 'unread', 'fraud', 'compliance', 'account', 'loan'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-400 text-xs">
            No notifications found in this category.
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-5 border transition-all flex items-start justify-between gap-4 ${
                !item.read
                  ? 'border-blue-200 shadow-xs bg-blue-50/20'
                  : 'border-slate-200/80 text-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    item.type === 'fraud'
                      ? 'bg-rose-50 text-rose-600'
                      : item.type === 'compliance'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-blue-50 text-blue-600'
                  }`}
                >
                  {getIcon(item.type)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    )}
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                      {item.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>

                  <div className="text-[10px] text-slate-400 font-mono pt-1">
                    {new Date(item.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                {item.actionUrl && (
                  <button
                    onClick={() => {
                      if (item.actionUrl?.includes('fraud')) onNavigate('fraud');
                      if (item.actionUrl?.includes('kyc')) onNavigate('kyc');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}

                {!item.read && (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-medium px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
