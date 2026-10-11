/**
 * ConnectBank AI - Main Application Entry
 * Full-stack multi-agent banking dashboard with 9 interconnected layers.
 */

import React, { useState, useEffect } from 'react';
import { Customer } from './types/banking.ts';
import { apiClient } from './services/apiClient.ts';
import { Sidebar, ActiveTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { OverviewDashboard } from './pages/OverviewDashboard.tsx';
import { AssistantChat } from './pages/AssistantChat.tsx';
import { AccountsTransactions } from './pages/AccountsTransactions.tsx';
import { FraudMonitoring } from './pages/FraudMonitoring.tsx';
import { LoansCalculator } from './pages/LoansCalculator.tsx';
import { KYCCompliance } from './pages/KYCCompliance.tsx';
import { AgentMonitor } from './pages/AgentMonitor.tsx';
import { NotificationsPage } from './pages/NotificationsPage.tsx';
import { SystemStatusSettings } from './pages/SystemStatusSettings.tsx';
import { CreateUserModal } from './components/CreateUserModal.tsx';
import { UserLoginModal } from './components/UserLoginModal.tsx';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('CUST-1001');
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [initialAssistantPrompt, setInitialAssistantPrompt] = useState<string | undefined>(undefined);
  const [aiMode, setAiMode] = useState<'live_gemini' | 'deterministic_fallback'>('deterministic_fallback');
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initial Load
  useEffect(() => {
    initApp();
  }, []);

  // Reload dashboard data whenever selected customer changes
  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerDashboard(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const initApp = async () => {
    try {
      const custList = await apiClient.getCustomers();
      setCustomers(custList);
      if (custList.length > 0) {
        setSelectedCustomerId(custList[0].id);
        await loadCustomerDashboard(custList[0].id);
      }
      const status = await apiClient.getSystemStatus();
      if (status?.gateway?.isConfigured) {
        setAiMode('live_gemini');
      }
    } catch (err) {
      console.error('App init error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCustomerDashboard = async (customerId: string) => {
    try {
      const data = await apiClient.getDashboard(customerId);
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    }
  };

  const handleUserCreated = async (newCustomerId: string) => {
    const updated = await apiClient.getCustomers();
    setCustomers(updated);
    setSelectedCustomerId(newCustomerId);
    await loadCustomerDashboard(newCustomerId);
  };

  const handleLoginSuccess = async (customerId: string) => {
    setSelectedCustomerId(customerId);
    await loadCustomerDashboard(customerId);
  };

  const handleNavigate = (tab: ActiveTab, prompt?: string) => {
    if (prompt) {
      setInitialAssistantPrompt(prompt);
    } else {
      setInitialAssistantPrompt(undefined);
    }
    setActiveTab(tab);
  };

  const currentCustomer =
    customers.find(c => c.id === selectedCustomerId) ||
    dashboardData?.customer ||
    customers[0];

  const unreadCount = dashboardData?.unreadNotificationsCount ?? 0;
  const fraudAlertCount = dashboardData?.fraudAlerts?.filter((a: any) => a.status === 'open').length ?? 0;

  if (isLoading || !currentCustomer) {
    return (
      <div className="min-h-screen bg-[#0A192F] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-base font-bold tracking-tight">Initializing ConnectBank AI...</div>
          <div className="text-xs text-slate-400">Loading supervisor orchestrator & simulated core banking ledger</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-900">
      {/* Persistent Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={tab => {
          setInitialAssistantPrompt(undefined);
          setActiveTab(tab);
        }}
        unreadCount={unreadCount}
        fraudAlertCount={fraudAlertCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header Bar */}
        <Header
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={id => {
            setSelectedCustomerId(id);
            setInitialAssistantPrompt(undefined);
          }}
          unreadCount={unreadCount}
          onTabChange={handleNavigate}
          aiMode={aiMode}
          onOpenCreateUser={() => setIsCreateUserOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'overview' && dashboardData && (
            <OverviewDashboard
              customer={currentCustomer}
              totalBalance={dashboardData.totalBalance}
              accounts={dashboardData.accounts}
              recentTransactions={dashboardData.recentTransactions}
              loans={dashboardData.loans}
              fraudAlerts={dashboardData.fraudAlerts}
              kyc={dashboardData.kyc}
              recentTraces={dashboardData.recentTraces || []}
              onNavigate={handleNavigate}
            />
          )}

          {activeTab === 'assistant' && (
            <AssistantChat
              customer={currentCustomer}
              initialPrompt={initialAssistantPrompt}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsTransactions customer={currentCustomer} />
          )}

          {activeTab === 'fraud' && (
            <FraudMonitoring
              customer={currentCustomer}
              onNavigateToAssistant={prompt => handleNavigate('assistant', prompt)}
            />
          )}

          {activeTab === 'loans' && (
            <LoansCalculator customer={currentCustomer} />
          )}

          {activeTab === 'kyc' && (
            <KYCCompliance customer={currentCustomer} />
          )}

          {activeTab === 'monitor' && (
            <AgentMonitor customer={currentCustomer} />
          )}

          {activeTab === 'notifications' && (
            <NotificationsPage
              customer={currentCustomer}
              onNavigate={handleNavigate}
              onRefreshUnread={() => loadCustomerDashboard(selectedCustomerId)}
            />
          )}

          {activeTab === 'settings' && (
            <SystemStatusSettings
              onDatabaseReset={() => loadCustomerDashboard(selectedCustomerId)}
              onOpenCreateUser={() => setIsCreateUserOpen(true)}
              onSwitchCustomer={id => setSelectedCustomerId(id)}
            />
          )}
        </main>
      </div>

      {/* User Creation Modal (Database Storage) */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onUserCreated={handleUserCreated}
      />

      {/* User Login Modal (Database Credentials Verification) */}
      <UserLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onOpenCreateUser={() => setIsCreateUserOpen(true)}
      />
    </div>
  );
}
